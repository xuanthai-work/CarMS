"use client";

import { useState, useTransition } from "react";
import { saveVehicle } from "@/api/vehicles";
import SideDrawer from "@/components/common/SideDrawer";
import { VEHICLE_STATUS, OWNER_TYPES, SEAT_OPTIONS } from "@/utils/vehicles";
import { Field, FormError, inputCls } from "@/components/common/ui";
import Button from "@/components/common/Button";
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
      <Button
        size="toolbar"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        + Thêm xe
      </Button>

      {open && (
        <SideDrawer
          title="Thêm xe"
          onClose={handleClose}
          footer={
            <>
              <Button variant="secondary" onClick={handleClose}>
                Hủy
              </Button>
              <Button type="submit" form="add-vehicle-form" disabled={isPending}>
                {isPending ? "Đang thêm..." : "Thêm xe"}
              </Button>
            </>
          }
        >
          <FormError message={error} />
          <form
            id="add-vehicle-form"
            onSubmit={handleSubmit}
            onInput={() => error && setError(null)}
            className="space-y-3"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Biển số *"><input name="plate" required placeholder="VD: 29B-301.48" className={inputCls} /></Field>
              <Field label="Loại xe"><SelectMenu name="seats" value={form.seats} onChange={set("seats")} options={SEAT_OPTIONS} /></Field>
              <Field label="Trạng thái"><SelectMenu name="status" value={form.status} onChange={set("status")} options={VEHICLE_STATUS} /></Field>
              <Field label="Sở hữu"><SelectMenu name="type" value={form.type} onChange={set("type")} options={OWNER_TYPES} /></Field>
              {form.type === "partner" ? (
                <Field label="SĐT / Zalo"><input name="phone" placeholder="Số điện thoại / Zalo" className={inputCls} /></Field>
              ) : (
                <>
                  <Field label="Hạn đăng kiểm"><DatePicker name="inspectionDue" value={form.inspectionDue} onChange={set("inspectionDue")} /></Field>
                  <Field label="Hạn bảo hiểm"><DatePicker name="insuranceDue" value={form.insuranceDue} onChange={set("insuranceDue")} /></Field>
                </>
              )}
              <div className="sm:col-span-2"><Field label="Ghi chú"><input name="note" placeholder="Ghi chú" className={inputCls} /></Field></div>
            </div>
          </form>
        </SideDrawer>
      )}
    </>
  );
}
