"use client";

import { useState, useTransition } from "react";
import { saveOfficeStaff } from "@/api/staff";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import MoneyInput from "@/components/common/MoneyInput";
import DatePicker from "@/components/common/DatePicker";
import SelectMenu from "@/components/common/SelectMenu";
import { DetailCell, Field, FormError, inputCls } from "@/components/common/ui";
import { OFFICE_POSITIONS, GENDERS } from "@/utils/office";
import { usePermissions } from "@/states/permissions/PermissionsProvider";

const EMPTY_FORM = { startDate: "", position: "Nhân viên", dob: "", gender: "" };

export default function AddOfficeStaffButton() {
  const { canEdit } = usePermissions();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleClose() {
    setError(null);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await saveOfficeStaff(fd);
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
        + Thêm nhân sự văn phòng
      </Button>

      {open && (
        <SideDrawer
          title="Thêm nhân sự văn phòng"
          onClose={handleClose}
          footer={
            <>
              <Button variant="secondary" onClick={handleClose}>
                Hủy
              </Button>
              <Button type="submit" form="add-staff-form" disabled={isPending}>
                {isPending ? "Đang thêm..." : "Thêm nhân sự"}
              </Button>
            </>
          }
        >
          <FormError message={error} />
          <form
            id="add-staff-form"
            onSubmit={handleSubmit}
            onInput={() => error && setError(null)}
            className="space-y-3"
          >
            <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2">
              <DetailCell><Field label="Họ tên *"><input name="name" required placeholder="VD: Trần Thị B" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="SĐT"><input name="phone" placeholder="VD: 0912xxxxxx" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Email"><input name="email" type="email" placeholder="VD: a@congty.vn" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Giới tính"><SelectMenu name="gender" value={form.gender} onChange={set("gender")} options={GENDERS} placeholder="Chọn giới tính" /></Field></DetailCell>
              <DetailCell><Field label="Ngày sinh"><DatePicker name="dob" value={form.dob} onChange={set("dob")} /></Field></DetailCell>
              <DetailCell><Field label="CCCD"><input name="idNumber" placeholder="Số CCCD" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Số BHXH"><input name="socialInsurance" placeholder="Số bảo hiểm xã hội" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Chức vụ"><SelectMenu name="position" value={form.position} onChange={set("position")} options={OFFICE_POSITIONS} /></Field></DetailCell>
              <DetailCell><Field label="Lương cơ bản"><MoneyInput name="baseSalary" placeholder="0" /></Field></DetailCell>
              <DetailCell><Field label="Ngày nhận lương (trong tháng)"><input name="payday" type="number" min={1} max={31} placeholder="VD: 5" className={inputCls} /></Field></DetailCell>
              <DetailCell><Field label="Ngày vào làm"><DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} /></Field></DetailCell>
              <DetailCell><Field label="Ghi chú"><input name="note" placeholder="Ghi chú" className={inputCls} /></Field></DetailCell>
            </div>
          </form>
        </SideDrawer>
      )}
    </>
  );
}
