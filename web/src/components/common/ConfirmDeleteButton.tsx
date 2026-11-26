"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Trash } from "@phosphor-icons/react";
import Modal from "@/components/common/Modal";
import { FormError } from "@/components/common/ui";
import type { ActionResult } from "@/utils/actionResult";

export default function ConfirmDeleteButton({
  action,
  id,
  label,
  hint,
  children,
}: {
  action: (fd: FormData) => Promise<ActionResult | void>;
  id: string;
  label: string; // mô tả đối tượng, vd: "xe 29B30148"
  hint?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    setError(null);
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await action(fd);
      if (r && !r.ok) {
        setError(r.error);
        return;
      }
      closeModal();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label="Xóa"
        title="Xóa"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50"
      >
        <Trash size={18} weight="regular" aria-hidden="true" />
      </button>

      {open && (
        <Modal title="Xác nhận xoá" onClose={closeModal}>
          <p className="text-sm text-slate-600">Đã nghĩ kĩ chưa mà chọn em? 🥺</p>
          <p className="mt-1.5 text-xs text-muted">
            Xoá <span className="font-semibold text-slate-800">{label}</span> — không hoàn tác được.
          </p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
          <form onSubmit={handleSubmit} onInput={() => error && setError(null)} className="mt-3">
            <FormError message={error} />
            <input type="hidden" name="id" value={id} />
            {children}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                aria-label="Xóa"
                title="Xóa"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash size={18} weight="regular" aria-hidden="true" />
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
