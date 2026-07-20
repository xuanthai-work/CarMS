"use client";

import { useState } from "react";
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
        className="rounded-md border border-rose-300 px-4 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
      >
        Xoá
      </button>

      {open && (
        <Modal title="Xác nhận xoá" onClose={() => setOpen(false)}>
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xoá <span className="font-semibold text-slate-800">{label}</span>? Thao tác
            này không thể hoàn tác.
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
              <button className="rounded-md bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
                Xoá
              </button>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
