"use client";

import { memo, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { FileUIPart, SourceDocumentUIPart, SourceUrlUIPart, UIMessage } from "ai";
import { DURATION, EASE } from "@/utils/motion";
import { FileGlyph, LinkGlyph } from "@/components/assistant/icons";

type ContentPart = UIMessage["parts"][number];
type GroundingSourcePart = SourceUrlUIPart | SourceDocumentUIPart;

/* ---- Markdown: không có @tailwindcss/typography → style tay từng thẻ ---- */
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
    <div className="my-2 overflow-x-auto rounded-lg border border-hairline">
      <table className="w-full border-collapse text-left text-[12.5px]" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-canvas" {...props} />,
  th: ({ node, ...props }) => <th className="border-b border-hairline px-2.5 py-1.5 font-semibold text-ink" {...props} />,
  td: ({ node, ...props }) => <td className="border-b border-hairline px-2.5 py-1.5 align-top text-ink" {...props} />,
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

/** Ba chấm nảy nhẹ, canh trái không bong bóng — chỉ báo trợ lý đang soạn/tìm kiếm, chưa có chữ để hiện con trỏ. */
function TypingIndicator({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full bg-muted ${reduceMotion ? "" : "animate-bounce"}`}
          style={reduceMotion ? undefined : { animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

/** Một dòng hội thoại. memo theo tham chiếu `message`: khi stream token mới, các tin đã xong
 *  (giữ nguyên tham chiếu) không render/parse markdown lại — chỉ tin đang stream mới render lại. */
const MessageRow = memo(function MessageRow({
  message,
  reduceMotion,
}: {
  message: UIMessage;
  reduceMotion: boolean | null;
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
  return (
    <motion.div {...motionProps} className="w-full text-sm text-ink">
      <div className="space-y-1.5">{message.parts.map((part, i) => renderContentPart(part, i, false))}</div>
      {sources.length > 0 && <SourceList sources={sources} />}
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
  const lastAssistantHasTextPart =
    lastMessage?.role === "assistant" && lastMessage.parts.some((p) => p.type === "text");
  // "submitted": chưa có message assistant nào cả → 3 chấm nảy.
  // "streaming" mà assistant chưa ra chữ nào (đang gọi tool/tìm kiếm) → vẫn 3 chấm nảy.
  // Có chữ rồi thì để con trỏ nhấp nháy gắn ngay sau đoạn text đang stream (renderContentPart).
  const showTypingIndicator = status === "submitted" || (status === "streaming" && !lastAssistantHasTextPart);

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
        messages.map((m) => <MessageRow key={m.id} message={m} reduceMotion={reduceMotion} />)
      )}
      {showTypingIndicator && <TypingIndicator reduceMotion={reduceMotion} />}
      <div ref={bottomRef} />
    </div>
  );
}
