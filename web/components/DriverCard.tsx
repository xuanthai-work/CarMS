"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardMotion } from "@/lib/motion";
import { saveDriver, deleteDriver } from "@/lib/actions";
import { LICENSE_OPTIONS, DRIVER_TYPES, driverTypeLabel } from "@/lib/drivers";
import { Field, Info, inputCls } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import MoneyInput from "@/components/MoneyInput";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { fmtMoney } from "@/lib/trips";
import { useFormState } from "@/lib/useFormState";
import type { Driver } from "@/lib/types";

export default function DriverCard({ driver: d }: { driver: Driver }) {
  const initialForm = () => ({
    licenseClass: d.licenseClass ?? "",
    type: d.type || "own",
  });
  const [editing, setEditing] = useState(false);
  const reduceMotion = useReducedMotion();
  const { form, set, reset } = useFormState(initialForm);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSave(fd: FormData) {
    await saveDriver(fd);
    setEditing(false);
  }
  function cancel() {
    formRef.current?.reset();
    reset();
    setEditing(false);
  }

  // ---------- CHẾ ĐỘ XEM ----------
  if (!editing) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_10px_26px_-24px_rgba(15,23,42,0.8)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-ink">{d.name}</span>
              {d.licenseClass && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                  Hạng {d.licenseClass}
                </span>
              )}
              <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
                {driverTypeLabel(d.type)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted transition hover:bg-canvas active:scale-[0.98]"
          >
            Chỉnh sửa
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <Info label="SĐT / Zalo" value={d.phone || "—"} />
          {d.type === "own" && <Info label="Lương tháng" value={fmtMoney(d.baseSalary)} />}
          <Info label="Ghi chú" value={d.note || "—"} className="col-span-2 sm:col-span-1" />
        </div>
      </div>
    );
  }

  // ---------- CHẾ ĐỘ CHỈNH SỬA ----------
  return (
    <motion.div
      {...cardMotion(reduceMotion)}
      className="rounded-2xl border border-brand-300 bg-surface p-5 ring-1 ring-brand-200"
    >
      <form id={`drv-${d.id}`} ref={formRef} action={handleSave}>
        <input type="hidden" name="id" value={d.id} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Họ tên">
            <input name="name" defaultValue={d.name} className={inputCls} />
          </Field>
          <Field label="SĐT / Zalo">
            <input name="phone" defaultValue={d.phone ?? ""} className={inputCls} />
          </Field>
          <Field label="Hạng bằng">
            <SelectMenu name="licenseClass" value={form.licenseClass} onChange={set("licenseClass")} options={LICENSE_OPTIONS} />
          </Field>
          <Field label="Loại">
            <SelectMenu name="type" value={form.type} onChange={set("type")} options={DRIVER_TYPES} />
          </Field>
          {form.type === "own" && (
            <Field label="Lương tháng">
              <MoneyInput name="baseSalary" defaultValue={d.baseSalary} placeholder="VD: 12.000.000" />
            </Field>
          )}
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
            className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted hover:bg-canvas"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={`drv-${d.id}`}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Lưu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
