"use client";

import { useState } from "react";
import { saveDriver } from "@/lib/actions";
import Modal from "@/components/Modal";
import { LICENSE_OPTIONS, DRIVER_TYPES } from "@/lib/drivers";
import { Field, inputCls } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import MoneyInput from "@/components/MoneyInput";
import { useFormState } from "@/lib/useFormState";

function DetailCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl bg-surface px-3 py-3 shadow-sm ${className}`}>{children}</div>;
}

export default function AddDriverButton() {
  const [open, setOpen] = useState(false);
  const { form, set, reset } = useFormState(() => ({ licenseClass: "", type: "own" }));

  async function handleAdd(fd: FormData) {
    await saveDriver(fd);
    setOpen(false);
    reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
      >
        + Thêm lái xe
      </button>

      {open && (
        <Modal title="Thêm lái xe" onClose={() => setOpen(false)}>
          <form action={handleAdd} className="space-y-3">
            <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
              <DetailCell><Field label="Họ tên *"><input name="name" required placeholder="VD: Nguyễn Văn A" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="SĐT / Zalo"><input name="phone" placeholder="VD: 0912xxxxxx" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Hạng bằng"><SelectMenu name="licenseClass" value={form.licenseClass} onChange={set("licenseClass")} options={LICENSE_OPTIONS} /></Field></DetailCell>
              <DetailCell><Field label="Loại"><SelectMenu name="type" value={form.type} onChange={set("type")} options={DRIVER_TYPES} /></Field></DetailCell>
              {form.type === "own" && (
                <DetailCell><Field label="Lương tháng"><MoneyInput name="baseSalary" placeholder="VD: 12.000.000" /></Field></DetailCell>
              )}
              <DetailCell className={form.type === "partner" ? "sm:col-span-2" : ""}><Field label="Ghi chú"><input name="note" placeholder="Ghi chú" className={inputCls} /></Field></DetailCell>
            </div>
            <div className="flex justify-end gap-2 border-t border-hairline pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted hover:bg-canvas"
              >
                Hủy
              </button>
              <button className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Thêm lái xe
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
