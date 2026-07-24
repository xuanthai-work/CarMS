"use client";

import { useState } from "react";
import { saveOfficeStaff } from "@/lib/actions";
import Modal from "@/components/Modal";
import MoneyInput from "@/components/MoneyInput";
import DatePicker from "@/components/DatePicker";
import SelectMenu from "@/components/SelectMenu";
import { Field, inputCls } from "@/components/ui";
import { OFFICE_POSITIONS, GENDERS } from "@/lib/office";

function DetailCell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-surface px-3 py-3 shadow-sm">{children}</div>;
}

const EMPTY_FORM = { startDate: "", position: "Nhân viên", dob: "", gender: "" };

export default function AddOfficeStaffButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k: keyof typeof EMPTY_FORM) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleAdd(fd: FormData) {
    await saveOfficeStaff(fd);
    setForm(EMPTY_FORM);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
      >
        + Thêm nhân sự văn phòng
      </button>

      {open && (
        <Modal title="Thêm nhân sự văn phòng" onClose={() => setOpen(false)}>
          <form action={handleAdd} className="space-y-3">
            <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
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
            <div className="flex justify-end gap-2 border-t border-hairline pt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted hover:bg-canvas"
              >
                Hủy
              </button>
              <button className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Thêm nhân sự
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
