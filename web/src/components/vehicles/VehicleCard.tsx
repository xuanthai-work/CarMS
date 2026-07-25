"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardMotion } from "@/utils/motion";
import { saveVehicle, deleteVehicle } from "@/api/vehicles";
import { VEHICLE_STATUS, OWNER_TYPES, SEAT_OPTIONS, seatLabel, statusLabel, ownerLabel } from "@/utils/vehicles";
import { DetailCell, EditIconButton, Field, Info, inputCls, CancelButton, SaveButton } from "@/components/common/ui";
import SelectMenu from "@/components/common/SelectMenu";
import DatePicker from "@/components/common/DatePicker";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import Modal from "@/components/common/Modal";
import { fmtDate } from "@/utils/format";
import { useFormState } from "@/hooks/common/useFormState";
import type { Vehicle } from "@/types";

const STATUS_TONE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-amber-100 text-amber-700",
  inactive: "bg-slate-200 text-slate-600",
};

export default function VehicleCard({ vehicle: v }: { vehicle: Vehicle }) {
  const initialForm = () => ({
    seats: v.seats ? String(v.seats) : "16",
    status: v.status || "active",
    type: v.type || "own",
    inspectionDue: v.inspectionDue ?? "",
    insuranceDue: v.insuranceDue ?? "",
  });
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveVehicle(fd);
    setEditing(false);
    setDetailOpen(false);
  }

  function closeModal() {
    formRef.current?.reset();
    reset();
    setEditing(false);
    setDetailOpen(false);
  }

  function onCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDetailOpen(true);
    }
  }

  const editForm = () => (
    <>
      <form id={`veh-${v.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={v.id} />
        <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
          <DetailCell><Field label="Biển số"><input name="plate" defaultValue={v.plate} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Loại xe"><SelectMenu name="seats" value={form.seats} onChange={set("seats")} options={SEAT_OPTIONS} /></Field></DetailCell>
          <DetailCell><Field label="Trạng thái"><SelectMenu name="status" value={form.status} onChange={set("status")} options={VEHICLE_STATUS} /></Field></DetailCell>
          <DetailCell><Field label="Sở hữu"><SelectMenu name="type" value={form.type} onChange={set("type")} options={OWNER_TYPES} /></Field></DetailCell>
          {form.type === "partner" ? (
            <DetailCell><Field label="SĐT / Zalo"><input name="phone" defaultValue={v.phone ?? ""} placeholder="Số điện thoại / Zalo" className={inputCls} /></Field></DetailCell>
          ) : (
            <>
              <DetailCell><Field label="Hạn đăng kiểm"><DatePicker name="inspectionDue" value={form.inspectionDue} onChange={set("inspectionDue")} /></Field></DetailCell>
              <DetailCell><Field label="Hạn bảo hiểm"><DatePicker name="insuranceDue" value={form.insuranceDue} onChange={set("insuranceDue")} /></Field></DetailCell>
            </>
          )}
          <DetailCell className="sm:col-span-2"><Field label="Ghi chú"><input name="note" defaultValue={v.note} className={inputCls} /></Field></DetailCell>
        </div>
      </form>
      <div className="mt-3 flex items-center justify-between">
        <ConfirmDeleteButton action={deleteVehicle} id={v.id} label={`xe ${v.plate}`} />
        <div className="flex gap-2"><CancelButton onClick={closeModal} /><SaveButton form={`veh-${v.id}`} /></div>
      </div>
    </>
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setDetailOpen(true)}
        onKeyDown={onCardKeyDown}
        className="cursor-pointer rounded-2xl border border-hairline bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label={`Xem đầy đủ thông tin xe ${v.plate}`}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-lg font-bold tracking-tight text-ink" title={v.plate}>{v.plate}</span>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{seatLabel(v.seats)}</span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_TONE[v.status] ?? STATUS_TONE.inactive}`}>{statusLabel(v.status)}</span>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">{ownerLabel(v.type)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {v.type === "partner" ? <Info label="SĐT / Zalo" value={v.phone || "—"} /> : <>
            <Info label="Hạn đăng kiểm" value={fmtDate(v.inspectionDue)} />
            <Info label="Hạn bảo hiểm" value={fmtDate(v.insuranceDue)} />
          </>}
          <Info label="Ghi chú" value={v.note || "—"} className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      {detailOpen && (
        <Modal title={editing ? "Chỉnh sửa xe" : "Thông tin xe"} onClose={closeModal} maxWidthClass="max-w-2xl">
          {editing ? (
            <motion.div {...cardMotion(reduceMotion)}>{editForm()}</motion.div>
          ) : (
            <>
              <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
                <DetailCell><Info label="Biển số" value={v.plate} size="md" /></DetailCell>
                <DetailCell><Info label="Loại xe" value={seatLabel(v.seats)} size="md" /></DetailCell>
                <DetailCell><Info label="Trạng thái" value={statusLabel(v.status)} size="md" /></DetailCell>
                <DetailCell><Info label="Sở hữu" value={ownerLabel(v.type)} size="md" /></DetailCell>
                {v.type === "partner" ? <DetailCell><Info label="SĐT / Zalo" value={v.phone || "—"} size="md" /></DetailCell> : <>
                  <DetailCell><Info label="Hạn đăng kiểm" value={fmtDate(v.inspectionDue)} size="md" /></DetailCell>
                  <DetailCell><Info label="Hạn bảo hiểm" value={fmtDate(v.insuranceDue)} size="md" /></DetailCell>
                </>}
                <DetailCell className={v.type === "partner" ? "" : "sm:col-span-2"}><Info label="Ghi chú" value={v.note || "—"} size="md" /></DetailCell>
              </div>
              <div className="mt-5 flex justify-end border-t border-hairline pt-4">
                <EditIconButton onClick={() => setEditing(true)} />
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
