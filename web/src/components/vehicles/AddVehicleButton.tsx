"use client";

import { useState, useTransition } from "react";
import { saveVehicle } from "@/api/vehicles";
import Modal from "@/components/common/Modal";
import { VEHICLE_STATUS, OWNER_TYPES, SEAT_OPTIONS } from "@/utils/vehicles";
import { DetailCell, Field, FormError, inputCls } from "@/components/common/ui";
import SelectMenu from "@/components/common/SelectMenu";
import DatePicker from "@/components/common/DatePicker";
import { useFormState } from "@/hooks/common/useFormState";
import { usePermissions } from "@/states/permissions/PermissionsProvider";

export default function AddVehicleButton() {
  const { canEdit } = usePermissions();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { form, set, reset } = useFormState(() => ({ seats: "16", status: "active", type: "own", inspectionDue: "", insuranceDue: "" }));

  function handleClose() {
    setError(null);
    setOpen(false);
    reset();
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
      handleClose();
    });
  }

  if (!canEdit) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="h-9 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
      >
        + Thêm xe
      </button>

      {open && (
        <Modal title="Thêm xe" onClose={handleClose}>
          <FormError message={error} />
          <form onSubmit={handleSubmit} onInput={() => error && setError(null)} className="space-y-3">
            <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
              <DetailCell><Field label="Biển số *"><input name="plate" required placeholder="VD: 29B-301.48" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Loại xe"><SelectMenu name="seats" value={form.seats} onChange={set("seats")} options={SEAT_OPTIONS} /></Field></DetailCell>
              <DetailCell><Field label="Trạng thái"><SelectMenu name="status" value={form.status} onChange={set("status")} options={VEHICLE_STATUS} /></Field></DetailCell>
              <DetailCell><Field label="Sở hữu"><SelectMenu name="type" value={form.type} onChange={set("type")} options={OWNER_TYPES} /></Field></DetailCell>
              {form.type === "partner" ? (
                <DetailCell><Field label="SĐT / Zalo"><input name="phone" placeholder="Số điện thoại / Zalo" className={inputCls} /></Field></DetailCell>
              ) : (
                <>
                  <DetailCell><Field label="Hạn đăng kiểm"><DatePicker name="inspectionDue" value={form.inspectionDue} onChange={set("inspectionDue")} /></Field></DetailCell>
                  <DetailCell><Field label="Hạn bảo hiểm"><DatePicker name="insuranceDue" value={form.insuranceDue} onChange={set("insuranceDue")} /></Field></DetailCell>
                </>
              )}
              <DetailCell className="sm:col-span-2"><Field label="Ghi chú"><input name="note" placeholder="Ghi chú" className={inputCls} /></Field></DetailCell>
            </div>
            <div className="flex justify-end gap-2 border-t border-hairline pt-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted hover:bg-canvas"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {isPending ? "Đang thêm..." : "Thêm xe"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
