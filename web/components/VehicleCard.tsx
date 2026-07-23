"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardMotion } from "@/lib/motion";
import { saveVehicle, deleteVehicle } from "@/lib/actions";
import { VEHICLE_STATUS, OWNER_TYPES, SEAT_OPTIONS, seatLabel, statusLabel, ownerLabel } from "@/lib/vehicles";
import { Field, Info, inputCls } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import DatePicker from "@/components/DatePicker";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { fmtDate } from "@/lib/format";
import { useFormState } from "@/lib/useFormState";
import type { Vehicle } from "@/lib/types";

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-amber-100 text-amber-700",
  inactive: "bg-slate-200 text-slate-600",
};

export default function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  // Các trường qua component tự làm (dropdown / lịch) cần state; input thường vẫn để uncontrolled.
  const initialForm = () => ({
    seats: v.seats ? String(v.seats) : "16",
    status: v.status || "active",
    type: v.type || "own",
    phone: v.phone ?? "",
    inspectionDue: v.inspectionDue ?? "",
    insuranceDue: v.insuranceDue ?? "",
  });
  const [editing, setEditing] = useState(false);
  const reduceMotion = useReducedMotion();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveVehicle(fd);
    setEditing(false);
  }
  function cancel() {
    formRef.current?.reset();
    reset();
    setEditing(false);
  }

  // ---------- CHẾ ĐỘ XEM ----------
  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-900">{v.plate}</span>
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
              {seatLabel(v.seats)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[v.status] ?? STATUS_TONE.inactive}`}>
              {statusLabel(v.status)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {ownerLabel(v.type)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Chỉnh sửa
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {v.type === "partner" ? (
            <Info label="SĐT / Zalo" value={v.phone || "—"} />
          ) : (
            <>
              <Info label="Hạn đăng kiểm" value={fmtDate(v.inspectionDue)} />
              <Info label="Hạn bảo hiểm" value={fmtDate(v.insuranceDue)} />
            </>
          )}
          <Info label="Ghi chú" value={v.note || "—"} className="col-span-2 sm:col-span-1" />
        </div>
      </div>
    );
  }

  // ---------- CHẾ ĐỘ CHỈNH SỬA ----------
  return (
    <motion.div
      {...cardMotion(reduceMotion)}
      className="rounded-xl border border-brand-300 bg-white p-4 ring-1 ring-brand-200"
    >
      <form id={`veh-${v.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={v.id} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Biển số">
            <input name="plate" defaultValue={v.plate} className={inputCls} />
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
              <input name="phone" defaultValue={v.phone ?? ""} placeholder="Số điện thoại / Zalo" className={inputCls} />
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
        <div className="mt-3">
          <Field label="Ghi chú">
            <input name="note" defaultValue={v.note} className={inputCls} />
          </Field>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <ConfirmDeleteButton action={deleteVehicle} id={v.id} label={`xe ${v.plate}`} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancel}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={`veh-${v.id}`}
            className="rounded-md bg-brand-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
