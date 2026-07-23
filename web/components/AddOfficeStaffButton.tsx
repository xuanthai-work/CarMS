"use client";

import { useState } from "react";
import { saveOfficeStaff } from "@/lib/actions";
import Modal from "@/components/Modal";
import MoneyInput from "@/components/MoneyInput";
import DatePicker from "@/components/DatePicker";
import SelectMenu from "@/components/SelectMenu";
import { Field, inputCls } from "@/components/ui";
import { OFFICE_POSITIONS, GENDERS } from "@/lib/office";

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
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ tên *">
                <input name="name" required placeholder="VD: Trần Thị B" className={inputCls} />
              </Field>
              <Field label="SĐT">
                <input name="phone" placeholder="VD: 0912xxxxxx" className={inputCls} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" placeholder="VD: a@congty.vn" className={inputCls} />
              </Field>
              <Field label="Giới tính">
                <SelectMenu name="gender" value={form.gender} onChange={set("gender")} options={GENDERS} placeholder="Chọn giới tính" />
              </Field>
              <Field label="Ngày sinh">
                <DatePicker name="dob" value={form.dob} onChange={set("dob")} />
              </Field>
              <Field label="CCCD">
                <input name="idNumber" placeholder="Số CCCD" className={inputCls} />
              </Field>
              <Field label="Số BHXH">
                <input name="socialInsurance" placeholder="Số bảo hiểm xã hội" className={inputCls} />
              </Field>
              <Field label="Chức vụ">
                <SelectMenu name="position" value={form.position} onChange={set("position")} options={OFFICE_POSITIONS} />
              </Field>
              <Field label="Lương cơ bản">
                <MoneyInput name="baseSalary" placeholder="0" />
              </Field>
              <Field label="Ngày nhận lương (trong tháng)">
                <input name="payday" type="number" min={1} max={31} placeholder="VD: 5" className={inputCls} />
              </Field>
              <Field label="Ngày vào làm">
                <DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} />
              </Field>
              <Field label="Ghi chú">
                <input name="note" placeholder="Ghi chú" className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Thêm nhân sự
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
