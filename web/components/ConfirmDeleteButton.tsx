"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react";
import Modal from "@/components/Modal";

export default function ConfirmDeleteButton({
  action,
  id,
  label,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  label: string; // mô tả đối tượng, vd: "xe 29B30148"
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Xóa"
        title="Xóa"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50"
      >
        <Trash size={18} weight="regular" aria-hidden="true" />
      </button>

      {open && (
        <Modal title="Xác nhận xoá" onClose={() => setOpen(false)}>
          <p className="text-sm text-slate-600">Đã nghĩ kĩ chưa mà chọn em? 🥺</p>
          <p className="mt-1.5 text-xs text-muted">
            Xoá <span className="font-semibold text-slate-800">{label}</span> — không hoàn tác được.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Hủy
            </button>
            <form action={action}>
              <input type="hidden" name="id" value={id} />
              <button
                aria-label="Xóa"
                title="Xóa"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700"
              >
                <Trash size={18} weight="regular" aria-hidden="true" />
              </button>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
