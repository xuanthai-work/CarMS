"use client";

import { isValidElement, memo, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, UIMessage } from "ai";
import { DURATION, EASE } from "@/utils/motion";
import { CopyIcon, CheckIcon, FileGlyph, LinkGlyph } from "@/components/assistant/icons";

type ContentPart = UIMessage["parts"][number];
type GroundingSourcePart = SourceUrlUIPart | SourceDocumentUIPart;

/* ---- Markdown: không có @tailwindcss/typography → style tay từng thẻ ---- */

/** Lấy text thuần từ children của một ô markdown (string/number/element lồng nhau). */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

/** Ô chứa tiền/định lượng (1.250.000 đ, 12%, 1,5tr) → canh phải + font mono cho dễ so. */
function isNumericCell(node: ReactNode): boolean {
  const t = textOf(node).trim();
  if (!t) return false;
  return /^[-+]?\d[\d.,\s]*(%|đ|₫|tr|k)?$/i.test(t);
}

const markdownComponents: Components = {
  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed last:mb-0" {...props} />,
  a: ({ node, ...props }) => (
    <a
      target="_blank"
      rel="noreferrer"
      className="break-words text-dispatch-600 underline underline-offset-2 hover:text-dispatch-700"
      {...props}
    />
  ),
  strong: ({ node, ...props }) => <strong className="font-semibold text-ink" {...props} />,
  em: ({ node, ...props }) => <em className="italic" {...props} />,
  ul: ({ node, ...props }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0" {...props} />,
  ol: ({ node, ...props }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="my-2 border-l-2 border-hairline pl-3 italic text-muted" {...props} />
  ),
  hr: ({ node, ...props }) => <hr className="my-3 border-hairline" {...props} />,
  h1: ({ node, ...props }) => <h1 className="mb-1.5 mt-2 text-[15px] font-bold text-ink first:mt-0" {...props} />,
  h2: ({ node, ...props }) => <h2 className="mb-1.5 mt-2 text-[14.5px] font-bold text-ink first:mt-0" {...props} />,
  h3: ({ node, ...props }) => <h3 className="mb-1 mt-2 text-[13.5px] font-semibold text-ink first:mt-0" {...props} />,
  pre: ({ node, ...props }) => (
    <pre
      className="my-2 overflow-x-auto rounded-lg border border-hairline bg-canvas p-3 text-[12.5px] leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
      {...props}
    />
  ),
  code: ({ node, ...props }) => <code className="rounded bg-canvas px-1.5 py-0.5 text-[12.5px]" {...props} />,
  table: ({ node, ...props }) => (
    <div className="my-2 overflow-x-auto rounded-xl border border-hairline bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-[12.5px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-canvas/50" {...props} />,
  tr: ({ node, ...props }) => <tr className="even:bg-canvas/40" {...props} />,
  th: ({ node, ...props }) => (
    <th
      className="border-b border-hairline px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted"
      {...props}
    />
  ),
  td: ({ node, children, ...props }) => (
    <td
      className={`border-b border-hairline/80 px-3 py-2 align-top text-xs text-ink ${
        isNumericCell(children) ? "text-right font-mono tabular-nums" : ""
      }`}
      {...props}
    >
      {children}
    </td>
  ),
  img: ({ node, ...props }) => (
    // Ảnh tuỳ URL bất kỳ trong markdown trả lời — không dùng next/image (không biết trước kích thước/nguồn).
    // eslint-disable-next-line @next/next/no-img-element
    <img className="my-2 max-h-64 rounded-lg border border-hairline" {...props} />
  ),
};

/** Ảnh đính kèm → thumbnail (mở ảnh gốc ở tab mới); tệp khác → chip tên tệp có thể tải về. */
function FilePart({ part, isUser }: { part: FileUIPart; isUser: boolean }) {
  const isImage = part.mediaType.startsWith("image/") || part.mediaType === "image";
  if (isImage) {
    return (
      <a
        href={part.url}
        target="_blank"
        rel="noreferrer"
        className={`block w-fit overflow-hidden rounded-xl border ${isUser ? "border-white/25" : "border-hairline"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={part.url}
          alt={part.filename || "Ảnh đính kèm"}
          className="max-h-52 w-auto max-w-[220px] object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={part.url}
      target="_blank"
      rel="noreferrer"
      download={part.filename}
      className={`flex w-fit items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
        isUser ? "border-white/30 bg-white/10 text-white" : "border-hairline bg-canvas text-ink"
      }`}
    >
      <FileGlyph className="h-4 w-4 shrink-0" />
      <span className="max-w-[180px] truncate">{part.filename || "Tệp đính kèm"}</span>
    </a>
  );
}

function renderContentPart(part: ContentPart, key: number, isUser: boolean) {
  if (part.type === "text") {
    if (isUser) {
      return part.text.trim() ? (
        <p key={key} className="whitespace-pre-wrap break-words">
          {part.text}
        </p>
      ) : null;
    }
    return (
      <div key={key} className="text-[13.5px]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {part.text}
        </ReactMarkdown>
        {part.state === "streaming" && (
          <span className="animate-pulse text-muted" aria-hidden="true">
            ▍
          </span>
        )}
      </div>
    );
  }
  if (part.type === "file") {
    return (
      <div key={key}>
        <FilePart part={part} isUser={isUser} />
      </div>
    );
  }
  // reasoning / tool-call / step-start / data-* … chưa cần hiển thị trong khung chat này.
  return null;
}

/** Gom nguồn grounding (source-url/source-document), bỏ trùng theo sourceId. */
function collectSources(parts: UIMessage["parts"]): GroundingSourcePart[] {
  const seen = new Set<string>();
  const result: GroundingSourcePart[] = [];
  for (const part of parts) {
    if (part.type !== "source-url" && part.type !== "source-document") continue;
    if (seen.has(part.sourceId)) continue;
    seen.add(part.sourceId);
    result.push(part);
  }
  return result;
}

function sourceLabel(source: GroundingSourcePart): string {
  if (source.type === "source-url") {
    if (source.title) return source.title;
    try {
      return new URL(source.url).hostname.replace(/^www\./, "");
    } catch {
      return source.url;
    }
  }
  return source.title || source.filename || "Tài liệu";
}

function SourceList({ sources }: { sources: GroundingSourcePart[] }) {
  return (
    <div className="mt-2.5 border-t border-hairline pt-2.5">
      <p className="mb-1 text-xs font-medium text-muted">Nguồn tham khảo</p>
      <ul className="space-y-1">
        {sources.map((source) => (
          <li key={source.sourceId} className="flex items-start gap-1.5 text-xs">
            <LinkGlyph className="mt-[3px] h-3 w-3 shrink-0 text-muted" />
            {source.type === "source-url" ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-dispatch-600 hover:text-dispatch-700 hover:underline"
              >
                {sourceLabel(source)}
              </a>
            ) : (
              <span className="break-all text-muted">{sourceLabel(source)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Suy ra dòng trạng thái Meow đang làm gì từ parts (tool gần nhất / reasoning / mặc định). */
function getThinkingStatus(parts: UIMessage["parts"] = []): string {
  const toolPart = [...parts]
    .reverse()
    .find((p) => p.type.startsWith("tool-") || p.type === "dynamic-tool");

  if (toolPart) {
    const type = toolPart.type;
    if (type.includes("monthly_finance") || type.includes("daily_summary")) {
      return "Đang tổng hợp số liệu tài chính & doanh thu...";
    }
    if (type.includes("daily_trips") || type.includes("available_vehicles")) {
      return "Đang tra cứu lịch xe & điều phối...";
    }
    if (type.includes("vehicle_inspections")) {
      return "Đang kiểm tra hạn đăng kiểm & bảo hiểm...";
    }
    if (type.includes("tavily_search") || type.includes("search_web") || type.includes("google_search")) {
      return "Đang tìm kiếm thông tin trên Web...";
    }
    if (type.includes("vietnam_law_search") || type.includes("search_vietnam_law")) {
      return "Đang tra cứu quy định pháp luật Việt Nam...";
    }
    return "Đang truy vấn dữ liệu hệ thống...";
  }

  const hasReasoning = parts.some((p) => p.type === "reasoning");
  if (hasReasoning) {
    return "Đang phân tích và suy nghĩ...";
  }

  return "Meow đang suy nghĩ...";
}

/** Hàng chỉ báo Meow đang xử lý: avatar + 3 chấm động + dòng trạng thái theo ngữ cảnh tool. */
function ThinkingIndicator({
  statusText,
  reduceMotion,
}: {
  statusText: string;
  reduceMotion: boolean | null;
}) {
  return (
    <div className="flex w-full items-start gap-2.5 text-sm">
      <div className="mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/meow-avatar.jpg" alt="Meow" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full bg-blue-600 ${reduceMotion ? "" : "animate-bounce"}`}
              style={reduceMotion ? undefined : { animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span className="text-slate-700">{statusText}</span>
      </div>
    </div>
  );
}

/** Nút sao chép câu trả lời — hiện "Đã sao chép" trong 1.5s. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Trình duyệt chặn clipboard (không phải https) — bỏ qua, không phá luồng chat.
    }
  }
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label="Sao chép nội dung trả lời"
      className="mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
    >
      {copied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
      {copied ? "Đã sao chép" : "Sao chép"}
    </button>
  );
}

/** Một dòng hội thoại. memo theo tham chiếu `message`: khi stream token mới, các tin đã xong
 *  (giữ nguyên tham chiếu) không render/parse markdown lại — chỉ tin đang stream mới render lại. */
const MessageRow = memo(function MessageRow({
  message,
  reduceMotion,
  streaming = false,
}: {
  message: UIMessage;
  reduceMotion: boolean | null;
  /** Tin đang được stream — ẩn nút sao chép cho tới khi xong. */
  streaming?: boolean;
}) {
  const isUser = message.role === "user";
  const sources = collectSources(message.parts);
  // Người dùng: bong bóng canh phải. Trợ lý: trải full-width, không bong bóng (kiểu chat hiện đại).
  const motionProps = {
    initial: reduceMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : DURATION.enter, ease: EASE.out },
  };
  if (isUser) {
    return (
      <motion.div {...motionProps} className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-dispatch-600 px-3.5 py-2.5 text-sm text-white sm:max-w-[80%]">
          <div className="space-y-1.5">{message.parts.map((part, i) => renderContentPart(part, i, true))}</div>
        </div>
      </motion.div>
    );
  }
  const text = message.parts
    .filter((p): p is Extract<ContentPart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n\n")
    .trim();
  return (
    <motion.div {...motionProps} className="flex w-full items-start gap-2.5 text-sm text-ink">
      <div className="mt-0.5 h-7 w-7 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-canvas">
        {/* Avatar tĩnh trong /public */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/meow-avatar.jpg" alt="Meow" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="space-y-1.5">{message.parts.map((part, i) => renderContentPart(part, i, false))}</div>
        {sources.length > 0 && <SourceList sources={sources} />}
        {text && !streaming && <CopyButton text={text} />}
      </div>
    </motion.div>
  );
});

export default function Messages({ messages, status }: { messages: UIMessage[]; status: string }) {
  const reduceMotion = useReducedMotion();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Ghim xuống cuối mỗi khi có tin nhắn mới hoặc trạng thái stream thay đổi.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const lastMessage = messages[messages.length - 1];
  const lastAssistantHasVisibleText =
    lastMessage?.role === "assistant" &&
    lastMessage.parts.some((p) => p.type === "text" && p.text.trim().length > 0);
  // "submitted": chưa có message assistant nào cả → hiện chỉ báo.
  // "streaming" mà assistant chưa ra chữ thật (đang gọi tool/tìm kiếm) → vẫn hiện chỉ báo + trạng thái tool.
  // Có chữ rồi thì để con trỏ nhấp nháy gắn ngay sau đoạn text đang stream (renderContentPart).
  const showThinkingIndicator =
    status === "submitted" || (status === "streaming" && !lastAssistantHasVisibleText);

  return (
    <div className="thin-scroll flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {messages.length === 0 ? (
        <div className="grid h-full place-items-center text-center text-sm text-muted">
          <div>
            <p className="text-base font-medium text-ink">Xin chào 👋</p>
            <p className="mx-auto mt-1 max-w-xs">
              Hỏi mình bất cứ điều gì về lịch xe, tài xế hay chi phí. Có thể đính kèm ảnh hoặc bật tìm kiếm web.
            </p>
          </div>
        </div>
      ) : (
        messages.map((m, i) => (
          <MessageRow
            key={m.id}
            message={m}
            reduceMotion={reduceMotion}
            streaming={status === "streaming" && i === messages.length - 1}
          />
        ))
      )}
      {showThinkingIndicator && (
        <ThinkingIndicator
          statusText={getThinkingStatus(lastMessage?.role === "assistant" ? lastMessage.parts : [])}
          reduceMotion={reduceMotion}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
