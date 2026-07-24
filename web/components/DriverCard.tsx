"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardMotion } from "@/lib/motion";
import { saveDriver, deleteDriver } from "@/lib/actions";
import { LICENSE_OPTIONS, DRIVER_TYPES, driverTypeLabel } from "@/lib/drivers";
import { DetailCell, EditIconButton, Field, Info, inputCls, CancelButton, SaveButton } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import MoneyInput from "@/components/MoneyInput";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import Modal from "@/components/Modal";
import { fmtMoney } from "@/lib/trips";
import { useFormState } from "@/lib/useFormState";
import type { Driver } from "@/lib/types";

export default function DriverCard({ driver: d }: { driver: Driver }) {
  const initialForm = () => ({ licenseClass: d.licenseClass ?? "", type: d.type || "own" });
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveDriver(fd);
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
      <form id={`drv-${d.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={d.id} />
        <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
          <DetailCell><Field label="Họ tên"><input name="name" defaultValue={d.name} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="SĐT / Zalo"><input name="phone" defaultValue={d.phone ?? ""} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Hạng bằng"><SelectMenu name="licenseClass" value={form.licenseClass} onChange={set("licenseClass")} options={LICENSE_OPTIONS} /></Field></DetailCell>
          <DetailCell><Field label="Loại"><SelectMenu name="type" value={form.type} onChange={set("type")} options={DRIVER_TYPES} /></Field></DetailCell>
          {form.type === "own" && <DetailCell><Field label="Lương tháng"><MoneyInput name="baseSalary" defaultValue={d.baseSalary} placeholder="VD: 12.000.000" /></Field></DetailCell>}
          <DetailCell className={d.type === "partner" ? "sm:col-span-2" : ""}><Field label="Ghi chú"><input name="note" defaultValue={d.note} className={inputCls} /></Field></DetailCell>
        </div>
      </form>
      <div className="mt-3 flex items-center justify-between">
        <ConfirmDeleteButton action={deleteDriver} id={d.id} label={`lái xe ${d.name}`} />
        <div className="flex gap-2"><CancelButton onClick={closeModal} /><SaveButton form={`drv-${d.id}`} /></div>
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
        aria-label={`Xem đầy đủ thông tin lái xe ${d.name}`}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-lg font-bold tracking-tight text-ink" title={d.name}>{d.name}</span>
          {d.licenseClass && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Hạng {d.licenseClass}</span>}
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">{driverTypeLabel(d.type)}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Info label="SĐT / Zalo" value={d.phone || "—"} />
          {d.type === "own" && <Info label="Lương tháng" value={fmtMoney(d.baseSalary)} />}
          <Info label="Ghi chú" value={d.note || "—"} className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      {detailOpen && (
        <Modal title={editing ? "Chỉnh sửa lái xe" : "Thông tin lái xe"} onClose={closeModal} maxWidthClass="max-w-xl">
          {editing ? (
            <motion.div {...cardMotion(reduceMotion)}>{editForm()}</motion.div>
          ) : (
            <>
              <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
                <DetailCell><Info label="Họ tên" value={d.name} size="md" /></DetailCell>
                <DetailCell><Info label="Loại" value={driverTypeLabel(d.type)} size="md" /></DetailCell>
                <DetailCell><Info label="SĐT / Zalo" value={d.phone || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Hạng bằng" value={d.licenseClass || "—"} size="md" /></DetailCell>
                {d.type === "own" && <DetailCell><Info label="Lương tháng" value={fmtMoney(d.baseSalary)} size="md" /></DetailCell>}
                <DetailCell className={d.type === "partner" ? "sm:col-span-2" : ""}><Info label="Ghi chú" value={d.note || "—"} size="md" /></DetailCell>
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
