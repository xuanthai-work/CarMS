"use client";

import { useState } from "react";
import { saveVehicle } from "@/lib/actions";
import Modal from "@/components/Modal";
import { VEHICLE_TYPES, VEHICLE_STATUS } from "@/lib/vehicles";
import { Field, inputCls } from "@/components/ui";

export default function AddVehicleButton() {
  const [open, setOpen] = useState(false);

  async function handleAdd(fd: FormData) {
    await saveVehicle(fd);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        + Thêm xe
      </button>

      {open && (
        <Modal title="Thêm xe" onClose={() => setOpen(false)}>
          <form action={handleAdd} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Biển số *">
                <input name="plate" required placeholder="VD: 29B-301.48" className={inputCls} />
              </Field>
              <Field label="Loại xe">
                <select name="seats" defaultValue="16" className={inputCls}>
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t} chỗ
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Trạng thái">
                <select name="status" defaultValue="active" className={inputCls}>
                  {VEHICLE_STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Hạn đăng kiểm">
                <input name="inspectionDue" type="date" className={inputCls} />
              </Field>
              <Field label="Hạn bảo hiểm">
                <input name="insuranceDue" type="date" className={inputCls} />
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
                Thêm xe
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
