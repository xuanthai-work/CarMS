"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useAssistant } from "@/components/assistant/AssistantProvider";
import { CancelButton } from "@/components/ui";
import { WarningGlyph } from "@/components/assistant/icons";

export default function InstructionsDialog({ onClose }: { onClose: () => void }) {
  const { instructions, setInstructions } = useAssistant();
  const [draft, setDraft] = useState(instructions);

  function save() {
    setInstructions(draft);
    onClose();
  }

  return (
    <Modal title="Chỉ dẫn tuỳ chỉnh" onClose={onClose} maxWidthClass="max-w-md">
      <div className="space-y-3">
        <p className="text-sm text-muted">
          Trợ lý sẽ nhớ chỉ dẫn này ở mọi câu hỏi (lưu trên trình duyệt của bạn).
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder="VD: Trả lời ngắn gọn, xưng hô thân mật, giải thích từng bước…"
          className="w-full resize-none rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
        />
        <div className="flex items-start gap-1.5">
          <WarningGlyph className="mt-[3px] h-3.5 w-3.5 shrink-0 text-muted" />
          <p className="text-xs text-muted">
            Gói miễn phí: nội dung bạn gửi có thể được Google dùng để cải thiện sản phẩm. Đừng nhập dữ liệu nhạy cảm.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <CancelButton onClick={onClose} />
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </Modal>
  );
}
