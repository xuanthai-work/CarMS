"use client";

import { useEffect, useRef, useState } from "react";
import FilterTabs from "@/components/FilterTabs";
import ModelPicker from "@/components/assistant/ModelPicker";

/** Ảnh đính kèm vượt quá dung lượng này sẽ bị chặn kèm cảnh báo.
 *  3MB → base64 ~4MB, vẫn dưới hạn mức request-body ~4.5MB của Vercel serverless
 *  (route chạy runtime "nodejs"), còn dư khoảng trống cho các phần khác của payload. */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

/* ---- Icon set 2 nét, kế thừa currentColor — cùng vibe icon Sidebar/Messages ---- */
const ICON = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  );
}
function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON} className={className}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg {...ICON} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function StopIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="currentColor" />
    </svg>
  );
}

/** Ảnh đã chọn: giữ kèm object URL để hiện thumbnail, revoke khi không còn dùng nữa. */
type Attachment = { id: string; file: File; url: string };

function makeAttachmentId(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}:${Math.random().toString(36).slice(2)}`;
}

export default function Composer({
  webSearch,
  onWebSearchChange,
  onSend,
  isStreaming,
  onStop,
}: {
  webSearch: boolean;
  /** Đổi chế độ trả lời: false = thường, true = có tìm web (grounding). */
  onWebSearchChange: (v: boolean) => void;
  onSend: (text: string, files?: FileList) => void;
  /** Đang chờ/nhận phản hồi — khi bật, nút gửi đổi thành nút Dừng. */
  isStreaming: boolean;
  /** Hủy request đang chạy (abort stream). */
  onStop: () => void;
}) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Giữ tham chiếu tới danh sách mới nhất để cleanup lúc unmount (VD: đóng Drawer khi
  // chưa gửi) vẫn revoke đúng object URL hiện có, tránh rò rỉ bộ nhớ.
  const attachmentsRef = useRef<Attachment[]>([]);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.url));
    };
  }, []);

  function pickFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const ok = incoming.filter((f) => f.type.startsWith("image/") && f.size <= MAX_IMAGE_BYTES);
    if (ok.length < incoming.length) alert("Bỏ qua ảnh không hợp lệ hoặc vượt quá 3MB.");
    // Mỗi lần chọn lại thay thế toàn bộ danh sách trước đó (khớp hành vi input file gốc) —
    // nên phải revoke các URL cũ trước khi tạo URL mới.
    const next = ok.map((f) => ({ id: makeAttachmentId(f), file: f, url: URL.createObjectURL(f) }));
    setAttachments((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.url));
      return next;
    });
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((a) => a.id !== id);
    });
  }

  function submit() {
    if (isStreaming) return;
    const t = text.trim();
    if (!t && attachments.length === 0) return;
    const dt = new DataTransfer();
    attachments.forEach((a) => dt.items.add(a.file));
    onSend(t, dt.files.length ? dt.files : undefined);
    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const canSend = !isStreaming && (text.trim().length > 0 || attachments.length > 0);

  return (
    <div className="border-t border-hairline bg-surface p-3">
      {/* Khung nhập bo góc: textarea trên, hàng điều khiển dưới. Viền sáng lên khi focus. */}
      <div className="rounded-2xl border border-hairline bg-canvas p-2 transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-hairline bg-surface"
              >
                {/* Ảnh chọn từ máy người dùng (object URL cục bộ) — không dùng next/image vì nguồn tạm thời */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.file.name} title={a.file.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  aria-label={`Bỏ ảnh ${a.file.name}`}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-white transition-colors hover:bg-ink"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label htmlFor="composer-input" className="sr-only">
          Nội dung tin nhắn
        </label>
        <textarea
          id="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder="Hỏi trợ lý…"
          className="max-h-40 min-h-[36px] w-full resize-none bg-transparent px-1.5 py-1 text-sm text-ink outline-none placeholder:text-muted/70"
        />

        <div className="mt-1.5 flex flex-nowrap items-center gap-1.5">
          {/* Trái: thêm ảnh + chế độ Thường/Web (cố định, không co) */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Thêm ảnh"
            title="Thêm ảnh"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink active:scale-95"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => pickFiles(e.target.files)} />
          <div className="shrink-0">
            <FilterTabs
              value={webSearch ? "web" : "normal"}
              onChange={(v) => onWebSearchChange(v === "web")}
              ariaLabel="Chế độ trả lời: thường hay tìm web"
              options={[
                ["normal", "Thường"],
                ["web", "Web"],
              ] as const}
            />
          </div>

          {/* Phải: đổi model (co lại + truncate nếu chật) + gửi */}
          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            <div className="w-28 min-w-0">
              <ModelPicker placement="up" />
            </div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Dừng trả lời"
                title="Dừng"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline bg-surface text-ink transition-colors hover:bg-canvas active:scale-95"
              >
                <StopIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label="Gửi"
                title="Gửi"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
