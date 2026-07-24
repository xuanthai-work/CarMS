"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import { STORAGE_KEYS, loadJSON, saveJSON } from "@/lib/ai/storage";
import { EASE } from "@/lib/motion";
import Messages from "@/components/assistant/Messages";
import Composer from "@/components/assistant/Composer";
import InstructionsDialog from "@/components/assistant/InstructionsDialog";
import { PlusIcon, GearIcon, CloseIcon, WarningGlyph } from "@/components/assistant/icons";

/** Thông điệp lỗi thân thiện — không lộ chi tiết kỹ thuật/hạn mức ra người dùng. */
const CHAT_ERROR_MESSAGE = "Đã có lỗi khi kết nối với Meow. Thử lại?";

/** ≥1280px: panel đóng vai trò docked (đẩy nội dung), dưới ngưỡng này: overlay trượt từ phải.
 *  Chọn 1280 (không phải 1024) để khi docked, <main> còn đủ rộng, không bị bóp quá hẹp. */
function useIsDesktop() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const sync = () => setV(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return v;
}

export default function Drawer() {
  const { open, setOpen, model, instructions } = useAssistant();
  const reduceMotion = useReducedMotion();
  const [webSearch, setWebSearch] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isDesktop = useIsDesktop();

  // Transport chỉ giữ `api` cố định (memo hoá để không tạo instance mới mỗi lần render).
  // KHÔNG nhét model/webSearch/customInstructions vào body ở đây — closure tại thời điểm
  // tạo transport sẽ đóng băng giá trị lúc đó. Giá trị mới nhất được truyền qua đối số thứ 2
  // của `sendMessage(message, { body })` bên dưới (đọc từ closure render() mới nhất, và
  // `HttpChatTransport.sendMessages` merge `{ ...transportBody, ...options.body }` nên
  // options.body luôn được gửi kèm mỗi request — xem node_modules/ai/dist/index.js).
  const transport = useMemo(() => new DefaultChatTransport<UIMessage>({ api: "/api/chat" }), []);

  // useMemo để chỉ đọc localStorage 1 lần lúc mount — useChat chỉ dùng giá trị này làm
  // seed ban đầu, còn Drawer re-render liên tục theo mỗi chunk stream nên không nên
  // parse lại JSON mỗi lần render.
  const initialMessages = useMemo(() => loadJSON<UIMessage[]>(STORAGE_KEYS.messages, []), []);

  const chat = useChat({
    transport,
    messages: initialMessages,
  });

  // Lưu hội thoại vào localStorage mỗi khi đổi. Lưu ý: ảnh đính kèm (base64) có thể vượt
  // hạn mức localStorage — saveJSON tự nuốt lỗi nên chỉ mất khả năng khôi phục, không crash.
  useEffect(() => {
    // Đừng ghi localStorage theo từng token khi đang stream — chỉ lưu khi đã xong/ lỗi.
    if (chat.status === "streaming" || chat.status === "submitted") return;
    saveJSON(STORAGE_KEYS.messages, chat.messages);
  }, [chat.messages, chat.status]);

  // Khoá cuộn nền + Esc để đóng — theo đúng quy ước của Modal.tsx.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Chỉ khoá cuộn nền ở chế độ overlay (mobile/hẹp). Docked (desktop) nằm cạnh nội dung
    // nên phải cho phép cuộn trang khi vừa xem vừa chat — không khoá.
    if (!isDesktop) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen, isDesktop]);

  function newChat() {
    chat.setMessages([]);
    chat.clearError();
  }

  const PANEL_W = 500; // px, bề rộng khi docked

  // Nội dung panel dùng chung cho cả 2 chế độ (docked/overlay) — chỉ khác khung ngoài.
  const panel = (
    <>
      {/* Header 1 hàng: tiêu đề (trái) + Chat mới / cài đặt / đóng (phải).
          Đổi model đã chuyển xuống thanh nhập (Composer) nên không còn ở đây. */}
      <header className="flex items-center justify-between gap-2 border-b border-hairline px-4 py-3">
        <span className="text-sm font-bold text-ink">Meow</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={newChat}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <PlusIcon className="h-4 w-4" />
            Chat mới
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Chỉ dẫn tuỳ chỉnh"
            title="Chỉ dẫn tuỳ chỉnh"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <GearIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Đóng Meow"
            title="Đóng"
            className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <Messages messages={chat.messages} status={chat.status} />

      {chat.error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-t border-signal/30 bg-signal/10 px-4 py-2.5"
        >
          <WarningGlyph className="h-4 w-4 shrink-0 text-signal" />
          <p className="flex-1 text-xs leading-snug text-ink">{CHAT_ERROR_MESSAGE}</p>
          <button
            type="button"
            onClick={() =>
              chat.regenerate({ body: { model, webSearch, customInstructions: instructions } })
            }
            className="shrink-0 rounded-lg bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal transition-colors hover:bg-signal/25"
          >
            Thử lại
          </button>
        </div>
      )}

      <Composer
        webSearch={webSearch}
        onWebSearchChange={setWebSearch}
        onSend={(text, files) =>
          // Bỏ qua phần "text" khi rỗng (gửi chỉ có ảnh) để không tạo text part rỗng.
          // Nhánh không-text luôn có files (Composer chỉ gọi onSend khi có ít nhất
          // text hoặc attachments), nên ép kiểu FileList là an toàn.
          chat.sendMessage(
            text ? { text, files } : { files: files! },
            { body: { model, webSearch, customInstructions: instructions } },
          )
        }
        isStreaming={chat.status === "streaming" || chat.status === "submitted"}
        onStop={() => chat.stop()}
      />
    </>
  );

  // Docked (≥1280px): flex child đẩy <main>, không scrim. Hẹp hơn: overlay trượt phải + scrim.
  // Dialog chỉ dẫn render 1 lần ngoài nhánh (không lặp ở cả hai).
  return (
    <>
      {isDesktop ? (
        <AnimatePresence>
          {open && (
            <motion.aside
              initial={reduceMotion ? false : { width: 0, opacity: 0 }}
              animate={{ width: PANEL_W, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "tween", duration: reduceMotion ? 0 : 0.22, ease: EASE.out }}
              className="sticky top-3 my-3 h-[calc(100vh-1.5rem)] shrink-0 overflow-hidden"
            >
              <div
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel"
                style={{ width: PANEL_W }}
              >
                {panel}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      ) : (
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE.out }}
                className="fixed inset-0 z-40 bg-slate-900/30"
                onClick={() => setOpen(false)}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Meow AI"
                initial={reduceMotion ? false : { x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: reduceMotion ? 0 : 0.22, ease: EASE.out }}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-hairline bg-surface shadow-panel"
              >
                {panel}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      )}
      {settingsOpen && <InstructionsDialog onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
