"use client";

import { useRef, useState, useTransition } from "react";
import { saveDriver, deleteDriver } from "@/api/drivers";
import { LICENSE_OPTIONS, DRIVER_TYPES, driverTypeLabel } from "@/utils/drivers";
import { hasLeft } from "@/utils/office";
import { DetailCell, Field, FormError, Info, inputCls } from "@/components/common/ui";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import SelectMenu from "@/components/common/SelectMenu";
import MoneyInput from "@/components/common/MoneyInput";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import DatePicker from "@/components/common/DatePicker";
import { fmtMoney } from "@/utils/trips";
import { fmtDate, todayStr } from "@/utils/format";
import { useFormState } from "@/hooks/common/useFormState";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { Driver, SalaryRate } from "@/types";

export default function DriverCard({ driver: d, rates = [] }: { driver: Driver; rates?: SalaryRate[] }) {
  const initialForm = () => ({ licenseClass: d.licenseClass ?? "", type: d.type || "own", startDate: d.startDate ?? "", endDate: d.endDate ?? "" });
  const { canEdit } = usePermissions();
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salaryChanged, setSalaryChanged] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState(() => todayStr());
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
      const r = await saveDriver(fd);
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
        aria-label={`Xem đầy đủ thông tin lái xe ${d.name}`}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate text-lg font-bold tracking-tight text-ink" title={d.name}>{d.name}</span>
          {d.licenseClass && <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">Hạng {d.licenseClass}</span>}
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">{driverTypeLabel(d.type)}</span>
          {hasLeft(d.endDate, todayStr()) && (
            <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Đã nghỉ việc</span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Info label="SĐT / Zalo" value={d.phone || "—"} />
          {d.type === "own" ? (
            <>
              <Info label="Lương tháng" value={fmtMoney(d.baseSalary)} />
              {d.startDate && <Info label="Ngày vào làm" value={fmtDate(d.startDate)} />}
              <Info label="Ngày nghỉ việc" value={fmtDate(d.endDate)} />
              <Info label="Ghi chú" value={d.note || "—"} />
            </>
          ) : (
            <>
              {d.startDate && <Info label="Ngày vào làm" value={fmtDate(d.startDate)} />}
              <Info label="Ngày nghỉ việc" value={fmtDate(d.endDate)} />
              <Info label="Ghi chú" value={d.note || "—"} className="col-span-2" />
            </>
          )}
        </div>
      </div>

      {detailOpen && (
        <SideDrawer
          title={`Lái xe ${d.name}`}
          onClose={closeModal}
          footer={
            <div className="flex w-full items-center justify-between">
              {canEdit ? <ConfirmDeleteButton action={deleteDriver} id={d.id} label={`lái xe ${d.name}`} /> : <span />}
              {canEdit && (
                <Button type="submit" form={`drv-${d.id}`} disabled={isPending}>
                  {isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              )}
            </div>
          }
        >
          <FormError message={error} />
          <form
            id={`drv-${d.id}`}
            ref={formRef}
            noValidate
            onSubmit={handleSubmit}
            onInput={(e) => {
              if (error) setError(null);
              const t = e.target as HTMLInputElement;
              if (t.name === "baseSalary") {
                const digits = t.value.replace(/[^\d]/g, "");
                const v = digits ? Number(digits) : 0;
                setSalaryChanged(v > 0 && v !== (d.baseSalary ?? 0));
              }
            }}
          >
            <input type="hidden" name="id" value={d.id} />
            <fieldset disabled={!canEdit} className="space-y-3">
              <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2">
                <DetailCell><Field label="Họ tên *"><input name="name" required defaultValue={d.name} className={inputCls} /></Field></DetailCell>
                <DetailCell><Field label="Loại"><SelectMenu name="type" value={form.type} onChange={set("type")} options={DRIVER_TYPES} /></Field></DetailCell>
                <DetailCell><Field label="SĐT / Zalo"><input name="phone" defaultValue={d.phone ?? ""} className={inputCls} /></Field></DetailCell>
                <DetailCell><Field label="Hạng bằng"><SelectMenu name="licenseClass" value={form.licenseClass} onChange={set("licenseClass")} options={LICENSE_OPTIONS} /></Field></DetailCell>
                {form.type === "own" && <DetailCell><Field label="Lương tháng"><MoneyInput name="baseSalary" defaultValue={d.baseSalary} placeholder="VD: 12.000.000" /></Field></DetailCell>}
                {form.type === "own" && salaryChanged && (
                  <DetailCell>
                    <Field label="Có hiệu lực từ">
                      <DatePicker name="salaryEffectiveFrom" value={effectiveFrom} onChange={setEffectiveFrom} />
                    </Field>
                  </DetailCell>
                )}
                <DetailCell>
                  <Field label="Ngày vào làm">
                    <DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} />
                  </Field>
                </DetailCell>
                <DetailCell>
                  <Field label="Ngày nghỉ việc">
                    <DatePicker name="endDate" value={form.endDate} onChange={set("endDate")} />
                    {form.endDate && (
                      <button
                        type="button"
                        onClick={() => set("endDate")("")}
                        className="mt-1 block text-xs text-rose-600 hover:underline"
                      >
                        Xóa ngày nghỉ
                      </button>
                    )}
                  </Field>
                </DetailCell>
                <DetailCell><Field label="Ghi chú"><input name="note" defaultValue={d.note} className={inputCls} /></Field></DetailCell>
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
