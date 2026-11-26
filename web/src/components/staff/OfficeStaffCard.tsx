"use client";

import { useRef, useState, useTransition } from "react";
import { saveOfficeStaff, deleteOfficeStaff } from "@/api/staff";
import { Field, FormError, Info, inputCls } from "@/components/common/ui";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import MoneyInput from "@/components/common/MoneyInput";
import DatePicker from "@/components/common/DatePicker";
import SelectMenu from "@/components/common/SelectMenu";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { fmtMoney } from "@/utils/trips";
import { fmtDate, todayStr } from "@/utils/format";
import { GENDERS, officePositionOptions } from "@/utils/office";
import { useFormState } from "@/hooks/common/useFormState";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { OfficeStaff, SalaryRate } from "@/types";

export default function OfficeStaffCard({ staff: p, rates = [] }: { staff: OfficeStaff; rates?: SalaryRate[] }) {
  const initialForm = () => ({
    startDate: p.startDate ?? "",
    position: p.position || "Nhân viên",
    dob: p.dob ?? "",
    gender: p.gender ?? "",
  });
  const { canEdit } = usePermissions();
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salaryChanged, setSalaryChanged] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState(() => todayStr());
  const [deleteEndDate, setDeleteEndDate] = useState(() => todayStr());
  const [isPending, startTransition] = useTransition();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  function closeModal() {
    setError(null);
    setSalaryChanged(false);
    setEffectiveFrom(todayStr());
    formRef.current?.reset();
    reset();
    setDetailOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    if (salaryChanged && !effectiveFrom) {
      return setError("Vui lòng chọn ngày hiệu lực của mức lương mới.");
    }
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await saveOfficeStaff(fd);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      closeModal();
    });
  }

  function onCardKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setDetailOpen(true);
    }
  }

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
        <SideDrawer
          title={`Nhân sự ${p.name}`}
          onClose={closeModal}
          footer={
            <div className="flex w-full items-center justify-between">
              {canEdit ? (
                <ConfirmDeleteButton
                  action={deleteOfficeStaff}
                  id={p.id}
                  label={`nhân sự ${p.name}`}
                  hint="Dữ liệu cũ được giữ nguyên."
                >
                  <Field label="Ngày làm cuối *">
                    <DatePicker name="endDate" value={deleteEndDate} onChange={setDeleteEndDate} />
                  </Field>
                </ConfirmDeleteButton>
              ) : <span />}
              {canEdit && (
                <Button type="submit" form={`os-${p.id}`} disabled={isPending}>
                  {isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              )}
            </div>
          }
        >
          <FormError message={error} />
          <form
            id={`os-${p.id}`}
            ref={formRef}
            noValidate
            onSubmit={handleSubmit}
            onInput={(e) => {
              if (error) setError(null);
              const t = e.target as HTMLInputElement;
              if (t.name === "baseSalary") {
                const digits = t.value.replace(/[^\d]/g, "");
                const v = digits ? Number(digits) : 0;
                setSalaryChanged(v > 0 && v !== (p.baseSalary ?? 0));
              }
            }}
          >
            <input type="hidden" name="id" value={p.id} />
            <fieldset disabled={!canEdit} className="space-y-3">
              <div className="grid gap-3">
                <Field label="Họ tên *"><input name="name" required defaultValue={p.name} className={inputCls} /></Field>
                <Field label="Chức vụ"><SelectMenu name="position" value={form.position} onChange={set("position")} options={officePositionOptions(p.position)} /></Field>
                <Field label="SĐT"><input name="phone" defaultValue={p.phone ?? ""} className={inputCls} /></Field>
                <Field label="Email"><input name="email" type="email" defaultValue={p.email ?? ""} className={inputCls} /></Field>
                <Field label="Giới tính"><SelectMenu name="gender" value={form.gender} onChange={set("gender")} options={GENDERS} placeholder="Chọn giới tính" /></Field>
                <Field label="Ngày sinh"><DatePicker name="dob" value={form.dob} onChange={set("dob")} /></Field>
                <Field label="CCCD"><input name="idNumber" defaultValue={p.idNumber ?? ""} className={inputCls} /></Field>
                <Field label="Số BHXH"><input name="socialInsurance" defaultValue={p.socialInsurance ?? ""} className={inputCls} /></Field>
                <Field label="Lương cơ bản"><MoneyInput name="baseSalary" defaultValue={p.baseSalary} placeholder="0" /></Field>
                {salaryChanged && (
                  <Field label="Có hiệu lực từ">
                    <DatePicker name="salaryEffectiveFrom" value={effectiveFrom} onChange={setEffectiveFrom} />
                  </Field>
                )}
                <Field label="Ngày nhận lương (trong tháng)"><input name="payday" type="number" min={1} max={31} defaultValue={p.payday ?? ""} placeholder="VD: 5" className={`${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`} /></Field>
                <Field label="Ngày vào làm"><DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} /></Field>
                <Field label="Ghi chú"><input name="note" defaultValue={p.note} className={inputCls} /></Field>
              </div>
            </fieldset>
          </form>
          {rates.length > 0 && (
            <div className="mt-4 space-y-1.5 border-t border-hairline pt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Lịch sử lương</div>
              <ul className="space-y-1 text-xs text-slate-600">
                {rates.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <span>{r.effectiveFrom === "1970-01-01" ? "Từ trước tới nay" : `Từ ${fmtDate(r.effectiveFrom)}`}</span>
                    <span className="font-semibold text-ink tabular-nums">{fmtMoney(r.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SideDrawer>
      )}
    </>
  );
}
