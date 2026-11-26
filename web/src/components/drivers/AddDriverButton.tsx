"use client";

import { useState, useTransition } from "react";
import { saveDriver } from "@/api/drivers";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import { LICENSE_OPTIONS, DRIVER_TYPES } from "@/utils/drivers";
import { Field, FormError, inputCls } from "@/components/common/ui";
import SelectMenu from "@/components/common/SelectMenu";
import MoneyInput from "@/components/common/MoneyInput";
import DatePicker from "@/components/common/DatePicker";
import { useFormState } from "@/hooks/common/useFormState";
import { usePermissions } from "@/states/permissions/PermissionsProvider";

export default function AddDriverButton() {
  const { canEdit } = usePermissions();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { form, set, reset } = useFormState(() => ({ licenseClass: "", type: "own", startDate: "" }));

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
      const r = await saveDriver(fd);
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
        + Thêm lái xe
      </Button>

      {open && (
        <SideDrawer
          title="Thêm lái xe"
          onClose={handleClose}
          footer={
            <>
              <Button variant="secondary" onClick={handleClose}>
                Hủy
              </Button>
              <Button type="submit" form="add-driver-form" disabled={isPending}>
                {isPending ? "Đang thêm..." : "Thêm lái xe"}
              </Button>
            </>
          }
        >
          <FormError message={error} />
          <form
            id="add-driver-form"
            onSubmit={handleSubmit}
            onInput={() => error && setError(null)}
            className="space-y-3"
          >
            <div className="grid gap-3">
              <Field label="Họ tên *"><input name="name" required placeholder="VD: Nguyễn Văn A" className={inputCls} /></Field>
              <Field label="SĐT / Zalo"><input name="phone" placeholder="VD: 0912xxxxxx" className={inputCls} /></Field>
              <Field label="Hạng bằng"><SelectMenu name="licenseClass" value={form.licenseClass} onChange={set("licenseClass")} options={LICENSE_OPTIONS} /></Field>
              <Field label="Loại"><SelectMenu name="type" value={form.type} onChange={set("type")} options={DRIVER_TYPES} /></Field>
              {form.type === "own" && (
                <Field label="Lương tháng"><MoneyInput name="baseSalary" placeholder="VD: 12.000.000" /></Field>
              )}
              <Field label="Ngày vào làm"><DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} /></Field>
              <Field label="Ghi chú"><input name="note" placeholder="Ghi chú" className={inputCls} /></Field>
            </div>
          </form>
        </SideDrawer>
      )}
    </>
  );
}
