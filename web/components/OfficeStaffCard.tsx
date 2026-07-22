"use client";

import { useRef, useState } from "react";
import { saveOfficeStaff, deleteOfficeStaff } from "@/lib/actions";
import { Field, Info, inputCls } from "@/components/ui";
import MoneyInput from "@/components/MoneyInput";
import DatePicker from "@/components/DatePicker";
import SelectMenu from "@/components/SelectMenu";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { fmtMoney } from "@/lib/trips";
import { fmtDate } from "@/lib/format";
import { GENDERS, officePositionOptions } from "@/lib/office";
import type { OfficeStaff } from "@/lib/types";

export default function OfficeStaffCard({ staff: p }: { staff: OfficeStaff }) {
  const initialForm = () => ({
    startDate: p.startDate ?? "",
    position: p.position || "Nhân viên",
    dob: p.dob ?? "",
    gender: p.gender ?? "",
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const set = (k: keyof ReturnType<typeof initialForm>) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveOfficeStaff(fd);
    setEditing(false);
  }
  function cancel() {
    formRef.current?.reset();
    setForm(initialForm());
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-slate-900">{p.name}</span>
            {p.position && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                {p.position}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Chỉnh sửa
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Info label="SĐT" value={p.phone || "—"} />
          <Info label="Email" value={p.email || "—"} />
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
    );
  }

  return (
    <div className="rounded-xl border border-brand-300 bg-white p-4 ring-1 ring-brand-200">
      <form id={`os-${p.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={p.id} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Họ tên">
            <input name="name" defaultValue={p.name} className={inputCls} />
          </Field>
          <Field label="SĐT">
            <input name="phone" defaultValue={p.phone ?? ""} className={inputCls} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" defaultValue={p.email ?? ""} className={inputCls} />
          </Field>
          <Field label="Giới tính">
            <SelectMenu name="gender" value={form.gender} onChange={set("gender")} options={GENDERS} placeholder="Chọn giới tính" />
          </Field>
          <Field label="Ngày sinh">
            <DatePicker name="dob" value={form.dob} onChange={set("dob")} />
          </Field>
          <Field label="CCCD">
            <input name="idNumber" defaultValue={p.idNumber ?? ""} className={inputCls} />
          </Field>
          <Field label="Số BHXH">
            <input name="socialInsurance" defaultValue={p.socialInsurance ?? ""} className={inputCls} />
          </Field>
          <Field label="Chức vụ">
            <SelectMenu
              name="position"
              value={form.position}
              onChange={set("position")}
              options={officePositionOptions(p.position)}
            />
          </Field>
          <Field label="Lương cơ bản">
            <MoneyInput name="baseSalary" defaultValue={p.baseSalary} placeholder="0" />
          </Field>
          <Field label="Ngày nhận lương (trong tháng)">
            <input name="payday" type="number" min={1} max={31} defaultValue={p.payday ?? ""} placeholder="VD: 5" className={inputCls} />
          </Field>
          <Field label="Ngày vào làm">
            <DatePicker name="startDate" value={form.startDate} onChange={set("startDate")} />
          </Field>
          <Field label="Ghi chú">
            <input name="note" defaultValue={p.note} className={inputCls} />
          </Field>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <ConfirmDeleteButton action={deleteOfficeStaff} id={p.id} label={`nhân sự ${p.name}`} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cancel}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={`os-${p.id}`}
            className="rounded-md bg-brand-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
