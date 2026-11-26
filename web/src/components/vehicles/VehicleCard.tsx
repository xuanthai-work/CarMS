"use client";

import { useRef, useState, useTransition } from "react";
import { saveVehicle, deleteVehicle } from "@/api/vehicles";
import { VEHICLE_STATUS, OWNER_TYPES, SEAT_OPTIONS, seatLabel, statusLabel, ownerLabel } from "@/utils/vehicles";
import { Field, FormError, Info, inputCls } from "@/components/common/ui";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import SelectMenu from "@/components/common/SelectMenu";
import DatePicker from "@/components/common/DatePicker";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { fmtDate } from "@/utils/format";
import { useFormState } from "@/hooks/common/useFormState";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
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
  const { canEdit } = usePermissions();
  const [detailOpen, setDetailOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  function closeModal() {
    setError(null);
    formRef.current?.reset();
    reset();
    setDetailOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await saveVehicle(fd);
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
        <SideDrawer
          title={`Xe ${v.plate}`}
          onClose={closeModal}
          footer={
            <div className="flex w-full items-center justify-between">
              {canEdit ? <ConfirmDeleteButton action={deleteVehicle} id={v.id} label={`xe ${v.plate}`} hint="Dữ liệu cũ được giữ nguyên." /> : <span />}
              {canEdit && (
                <Button type="submit" form={`veh-${v.id}`} disabled={isPending}>
                  {isPending ? "Đang lưu..." : "Lưu"}
                </Button>
              )}
            </div>
          }
        >
          <FormError message={error} />
          <form id={`veh-${v.id}`} ref={formRef} onSubmit={handleSubmit} onInput={() => error && setError(null)}>
            <input type="hidden" name="id" value={v.id} />
            <fieldset disabled={!canEdit} className="space-y-3">
              <div className="grid gap-3">
                <Field label="Biển số"><input name="plate" defaultValue={v.plate} className={inputCls} /></Field>
                <Field label="Loại xe"><SelectMenu name="seats" value={form.seats} onChange={set("seats")} options={SEAT_OPTIONS} /></Field>
                <Field label="Trạng thái"><SelectMenu name="status" value={form.status} onChange={set("status")} options={VEHICLE_STATUS} /></Field>
                <Field label="Sở hữu"><SelectMenu name="type" value={form.type} onChange={set("type")} options={OWNER_TYPES} /></Field>
                {form.type === "partner" ? (
                  <Field label="SĐT / Zalo"><input name="phone" defaultValue={v.phone ?? ""} placeholder="Số điện thoại / Zalo" className={inputCls} /></Field>
                ) : (
                  <>
                    <Field label="Hạn đăng kiểm"><DatePicker name="inspectionDue" value={form.inspectionDue} onChange={set("inspectionDue")} /></Field>
                    <Field label="Hạn bảo hiểm"><DatePicker name="insuranceDue" value={form.insuranceDue} onChange={set("insuranceDue")} /></Field>
                  </>
                )}
                <Field label="Ghi chú"><input name="note" defaultValue={v.note} className={inputCls} /></Field>
              </div>
            </fieldset>
          </form>
        </SideDrawer>
      )}
    </>
  );
}
