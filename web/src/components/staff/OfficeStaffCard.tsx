"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardMotion } from "@/utils/motion";
import { saveOfficeStaff, deleteOfficeStaff } from "@/api/staff";
import { DetailCell, Field, Info, inputCls, CancelButton, SaveButton } from "@/components/common/ui";
import EditIconButton from "@/components/common/EditIconButton";
import MoneyInput from "@/components/common/MoneyInput";
import DatePicker from "@/components/common/DatePicker";
import SelectMenu from "@/components/common/SelectMenu";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import Modal from "@/components/common/Modal";
import { fmtMoney } from "@/utils/trips";
import { fmtDate } from "@/utils/format";
import { GENDERS, officePositionOptions } from "@/utils/office";
import { useFormState } from "@/hooks/common/useFormState";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { OfficeStaff } from "@/types";

export default function OfficeStaffCard({ staff: p }: { staff: OfficeStaff }) {
  const initialForm = () => ({
    startDate: p.startDate ?? "",
    position: p.position || "Nhân viên",
    dob: p.dob ?? "",
    gender: p.gender ?? "",
  });
  const { canEdit } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveOfficeStaff(fd);
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
      <form id={`os-${p.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={p.id} />
        {/* Thứ tự field phải khớp block xem ở dưới, lệch là bấm ✎ thấy field nhảy ô. */}
        <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
          <DetailCell><Field label="Họ tên"><input name="name" defaultValue={p.name} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Chức vụ"><SelectMenu name="position" value={form.position} onChange={set("position")} options={officePositionOptions(p.position)} /></Field></DetailCell>
          <DetailCell><Field label="SĐT"><input name="phone" defaultValue={p.phone ?? ""} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Email"><input name="email" type="email" defaultValue={p.email ?? ""} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Giới tính"><SelectMenu name="gender" value={form.gender} onChange={set("gender")} options={GENDERS} placeholder="Chọn giới tính" /></Field></DetailCell>
          <DetailCell><Field label="Ngày sinh"><DatePicker name="dob" value={form.dob} onChange={set("dob")} /></Field></DetailCell>
          <DetailCell><Field label="CCCD"><input name="idNumber" defaultValue={p.idNumber ?? ""} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Số BHXH"><input name="socialInsurance" defaultValue={p.socialInsurance ?? ""} className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Lương cơ bản"><MoneyInput name="baseSalary" defaultValue={p.baseSalary} placeholder="0" /></Field></DetailCell>
          <DetailCell><Field label="Ngày nhận lương (trong tháng)"><input name="payday" type="number" min={1} max={31} defaultValue={p.payday ?? ""} placeholder="VD: 5" className={inputCls} /></Field></DetailCell>
          <DetailCell><Field label="Ngày vào làm"><DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} /></Field></DetailCell>
          <DetailCell><Field label="Ghi chú"><input name="note" defaultValue={p.note} className={inputCls} /></Field></DetailCell>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <ConfirmDeleteButton action={deleteOfficeStaff} id={p.id} label={`nhân sự ${p.name}`} />
        <div className="flex gap-2">
          <CancelButton onClick={closeModal} />
          <SaveButton form={`os-${p.id}`} />
        </div>
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
        aria-label={`Xem đầy đủ thông tin nhân sự ${p.name}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate text-lg font-bold tracking-tight text-ink" title={p.name}>{p.name}</span>
            {p.position && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{p.position}</span>}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Info label="SĐT" value={p.phone || "—"} />
          <Info label="Email" className="min-w-0" value={<span className="block truncate" title={p.email || undefined}>{p.email || "—"}</span>} />
          <Info label="Giới tính" value={p.gender || "—"} />
          <Info label="Ngày sinh" value={fmtDate(p.dob)} />
          <Info label="CCCD" value={p.idNumber || "—"} />
          <Info label="Số BHXH" value={p.socialInsurance || "—"} />
          <Info label="Lương cơ bản" value={fmtMoney(p.baseSalary)} />
          <Info label="Ngày nhận lương" value={p.payday ? `Ngày ${p.payday}` : "—"} />
          <Info label="Ngày vào làm" value={fmtDate(p.startDate)} />
          <Info label="Ghi chú" value={p.note || "—"} className="col-span-2" />
        </div>
      </div>

      {detailOpen && (
        <Modal title={editing ? "Chỉnh sửa nhân sự" : "Thông tin nhân sự"} onClose={closeModal} maxWidthClass="max-w-2xl">
          {editing ? (
            <motion.div {...cardMotion(reduceMotion)}>{editForm()}</motion.div>
          ) : (
            <>
              <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
                <DetailCell><Info label="Họ tên" value={p.name} size="md" /></DetailCell>
                <DetailCell><Info label="Chức vụ" value={p.position || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="SĐT" value={p.phone || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Email" value={p.email || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Giới tính" value={p.gender || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Ngày sinh" value={fmtDate(p.dob)} size="md" /></DetailCell>
                <DetailCell><Info label="CCCD" value={p.idNumber || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Số BHXH" value={p.socialInsurance || "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Lương cơ bản" value={fmtMoney(p.baseSalary)} size="md" /></DetailCell>
                <DetailCell><Info label="Ngày nhận lương" value={p.payday ? `Ngày ${p.payday}` : "—"} size="md" /></DetailCell>
                <DetailCell><Info label="Ngày vào làm" value={fmtDate(p.startDate)} size="md" /></DetailCell>
                <DetailCell><Info label="Ghi chú" value={p.note || "—"} size="md" /></DetailCell>
              </div>
              {canEdit && (
                <div className="mt-5 flex justify-end border-t border-hairline pt-4">
                  <EditIconButton onClick={() => setEditing(true)} />
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  );
}
