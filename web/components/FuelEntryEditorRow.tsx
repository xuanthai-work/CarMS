"use client";

import { useState, useTransition } from "react";
import { Trash } from "@phosphor-icons/react";
import DatePicker from "@/components/DatePicker";
import Combobox from "@/components/Combobox";
import MoneyInput from "@/components/MoneyInput";
import FuelPaymentStatusSelect from "@/components/FuelPaymentStatusSelect";
import { deleteFuelEntry, saveFuelEntry } from "@/lib/actions";
import { Field, inputCls } from "@/components/ui";
import type { FuelEntry, Vehicle } from "@/lib/types";

/** Bề rộng cột bảng tiền dầu — DÙNG CHUNG cho header (FuelScreen). Giữ nguyên. */
export const FuelColgroup = () => (
  <colgroup>
    <col style={{ width: "14%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "11%" }} />
    <col style={{ width: "15%" }} />
    <col style={{ width: "15%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "19%" }} />
  </colgroup>
);

export default function FuelEntryForm({
  entry,
  vehicles,
  defaultDate,
  onDone,
  onCancel,
}: {
  entry?: FuelEntry;
  vehicles: Vehicle[];
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [vehicleId, setVehicleId] = useState(entry?.vehicleId ?? "");
  const [refuelDate, setRefuelDate] = useState(entry?.refuelDate ?? defaultDate);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    entry?.paymentStatus ?? "paid"
  );
  const [paymentDate, setPaymentDate] = useState(entry?.paymentDate ?? entry?.refuelDate ?? defaultDate);
  const [err, setErr] = useState<string | null>(null);

  function submitForm(fd: FormData) {
    if (!vehicleId) return setErr("Vui lòng chọn xe.");
    const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
    if (!amt) return setErr("Vui lòng nhập số tiền.");
    setErr(null);
    startTransition(async () => {
      await saveFuelEntry(fd);
      onDone();
    });
  }

  function remove() {
    if (!entry) return;
    const fd = new FormData();
    fd.set("id", entry.id);
    startTransition(async () => {
      await deleteFuelEntry(fd);
      onDone();
    });
  }

  return (
    <form action={submitForm} className="space-y-3">
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ngày đổ">
          <DatePicker name="refuelDate" value={refuelDate} onChange={setRefuelDate} />
        </Field>
        <Field label="Xe">
          <Combobox
            name="vehicleId"
            value={vehicleId}
            onChange={setVehicleId}
            options={vehicles.map((v) => ({ id: v.id, label: v.plate }))}
            placeholder="Chọn xe…"
            emptyText="Không thấy xe"
          />
        </Field>
        <Field label="Số tiền">
          <MoneyInput name="amount" defaultValue={entry?.amount ?? null} required placeholder="Số tiền" />
        </Field>
        <Field label="Người đổ">
          <input
            name="payerName"
            defaultValue={entry?.payerName ?? ""}
            placeholder="Người đổ"
            className={inputCls}
          />
        </Field>
        <Field label="Trạng thái">
          <FuelPaymentStatusSelect name="paymentStatus" value={paymentStatus} onChange={setPaymentStatus} />
        </Field>
        <Field label="Ngày thanh toán">
          <DatePicker
            name="paymentDate"
            value={paymentStatus === "paid" ? paymentDate : ""}
            onChange={setPaymentDate}
            disabled={paymentStatus !== "paid"}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Ghi chú">
            <input name="note" defaultValue={entry?.note ?? ""} placeholder="Ghi chú" className={inputCls} />
          </Field>
        </div>
      </div>
      {err && <div className="text-sm font-medium text-rose-600">{err}</div>}
      <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
        {entry ? (
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            aria-label="Xóa"
            title="Xóa"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-60"
          >
            <Trash size={18} weight="regular" aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted hover:bg-canvas"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending
              ? entry
                ? "Đang lưu…"
                : "Đang thêm…"
              : entry
              ? "Lưu"
              : "Thêm phiếu dầu"}
          </button>
        </div>
      </div>
    </form>
  );
}
