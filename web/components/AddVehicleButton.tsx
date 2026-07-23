"use client";

import { useState } from "react";
import { saveVehicle } from "@/lib/actions";
import Modal from "@/components/Modal";
import { VEHICLE_STATUS, OWNER_TYPES, SEAT_OPTIONS } from "@/lib/vehicles";
import { Field, inputCls } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import DatePicker from "@/components/DatePicker";
import { useFormState } from "@/lib/useFormState";

export default function AddVehicleButton() {
  const [open, setOpen] = useState(false);
  const { form, set, reset } = useFormState(() => ({ seats: "16", status: "active", type: "own", phone: "", inspectionDue: "", insuranceDue: "" }));

  async function handleAdd(fd: FormData) {
    await saveVehicle(fd);
    setOpen(false);
    reset();
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
                <SelectMenu name="seats" value={form.seats} onChange={set("seats")} options={SEAT_OPTIONS} />
              </Field>
              <Field label="Trạng thái">
                <SelectMenu name="status" value={form.status} onChange={set("status")} options={VEHICLE_STATUS} />
              </Field>
              <Field label="Sở hữu">
                <SelectMenu name="type" value={form.type} onChange={set("type")} options={OWNER_TYPES} />
              </Field>
              {form.type === "partner" ? (
                <Field label="SĐT / Zalo">
                  <input name="phone" placeholder="Số điện thoại / Zalo" className={inputCls} />
                </Field>
              ) : (
                <>
                  <Field label="Hạn đăng kiểm">
                    <DatePicker name="inspectionDue" value={form.inspectionDue} onChange={set("inspectionDue")} />
                  </Field>
                  <Field label="Hạn bảo hiểm">
                    <DatePicker name="insuranceDue" value={form.insuranceDue} onChange={set("insuranceDue")} />
                  </Field>
                </>
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
                Thêm xe
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
