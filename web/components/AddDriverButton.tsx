"use client";

import { useState } from "react";
import { saveDriver } from "@/lib/actions";
import Modal from "@/components/Modal";
import { LICENSE_OPTIONS, DRIVER_TYPES } from "@/lib/drivers";
import { Field, inputCls } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import MoneyInput from "@/components/MoneyInput";
import { useFormState } from "@/lib/useFormState";

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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ tên *">
                <input name="name" required placeholder="VD: Nguyễn Văn A" className={inputCls} />
              </Field>
              <Field label="SĐT / Zalo">
                <input name="phone" placeholder="VD: 0912xxxxxx" className={inputCls} />
              </Field>
              <Field label="Hạng bằng">
                <SelectMenu name="licenseClass" value={form.licenseClass} onChange={set("licenseClass")} options={LICENSE_OPTIONS} />
              </Field>
              <Field label="Loại">
                <SelectMenu name="type" value={form.type} onChange={set("type")} options={DRIVER_TYPES} />
              </Field>
              {form.type === "own" && (
                <Field label="Lương tháng">
                  <MoneyInput name="baseSalary" placeholder="VD: 12.000.000" />
                </Field>
              )}
            </div>
            <Field label="Ghi chú">
              <input name="note" placeholder="Ghi chú" className={inputCls} />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Thêm lái xe
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
