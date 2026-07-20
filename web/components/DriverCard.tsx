"use client";

import { useRef, useState } from "react";
import { saveDriver, deleteDriver } from "@/lib/actions";
import { LICENSE_CLASSES, DRIVER_TYPES, driverTypeLabel } from "@/lib/drivers";
import { Field, Info, inputCls } from "@/components/ui";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import type { Driver } from "@/lib/types";

export default function DriverCard({ driver: d }: { driver: Driver }) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveDriver(fd);
    setEditing(false);
  }
  function cancel() {
    formRef.current?.reset();
    setEditing(false);
  }

  // ---------- CHẾ ĐỘ XEM ----------
  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-slate-900">{d.name}</span>
              {d.licenseClass && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                  Hạng {d.licenseClass}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {driverTypeLabel(d.type)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Chỉnh sửa
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Info label="Số điện thoại" value={d.phone || "—"} />
          <Info label="Zalo" value={d.zalo || "—"} />
          <Info label="Ghi chú" value={d.note || "—"} className="col-span-2 sm:col-span-1" />
        </div>
      </div>
    );
  }

  // ---------- CHẾ ĐỘ CHỈNH SỬA ----------
  return (
    <div className="rounded-xl border border-brand-300 bg-white p-4 ring-1 ring-brand-200">
      <form id={`drv-${d.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={d.id} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Họ tên">
            <input name="name" defaultValue={d.name} className={inputCls} />
          </Field>
          <Field label="Số điện thoại">
            <input name="phone" defaultValue={d.phone ?? ""} className={inputCls} />
          </Field>
          <Field label="Zalo">
            <input name="zalo" defaultValue={d.zalo ?? ""} className={inputCls} />
          </Field>
          <Field label="Hạng bằng">
            <select name="licenseClass" defaultValue={d.licenseClass} className={inputCls}>
              <option value="">— Chưa rõ —</option>
              {LICENSE_CLASSES.map((c) => (
                <option key={c} value={c}>
                  Hạng {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Loại">
            <select name="type" defaultValue={d.type} className={inputCls}>
              {DRIVER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Ghi chú">
            <input name="note" defaultValue={d.note} className={inputCls} />
          </Field>
        </div>
      </form>

      <div className="mt-3 flex items-center justify-between">
        <ConfirmDeleteButton action={deleteDriver} id={d.id} label={`lái xe ${d.name}`} />
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
            form={`drv-${d.id}`}
            className="rounded-md bg-brand-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
