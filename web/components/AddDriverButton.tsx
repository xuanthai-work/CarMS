"use client";

import { useState } from "react";
import { saveDriver } from "@/lib/actions";
import Modal from "@/components/Modal";
import { LICENSE_CLASSES, DRIVER_TYPES } from "@/lib/drivers";
import { Field, inputCls } from "@/components/ui";

export default function AddDriverButton() {
  const [open, setOpen] = useState(false);

  async function handleAdd(fd: FormData) {
    await saveDriver(fd);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
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
              <Field label="Số điện thoại">
                <input name="phone" placeholder="VD: 0912xxxxxx" className={inputCls} />
              </Field>
              <Field label="Zalo">
                <input name="zalo" placeholder="Tên/SĐT Zalo" className={inputCls} />
              </Field>
              <Field label="Hạng bằng">
                <select name="licenseClass" defaultValue="" className={inputCls}>
                  <option value="">— Chưa rõ —</option>
                  {LICENSE_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Hạng {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loại">
                <select name="type" defaultValue="own" className={inputCls}>
                  {DRIVER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
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
