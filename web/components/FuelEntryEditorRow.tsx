"use client";

import { useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cardMotion } from "@/lib/motion";
import DatePicker from "@/components/DatePicker";
import Combobox from "@/components/Combobox";
import MoneyInput from "@/components/MoneyInput";
import FuelPaymentStatusSelect from "@/components/FuelPaymentStatusSelect";
import { deleteFuelEntry, saveFuelEntry } from "@/lib/actions";
import { inputCls } from "@/components/ui";
import type { FuelEntry, Vehicle } from "@/lib/types";

/** Bề rộng cột bảng tiền dầu — DÙNG CHUNG cho header (FuelScreen) và hàng sửa để thẳng cột. */
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

export default function FuelEntryEditorRow({
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
  const formId = `fuel-row-${entry?.id ?? "new"}`;
  const reduceMotion = useReducedMotion();
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
    <motion.tr
      {...cardMotion(reduceMotion)}
      className={`align-top ${entry ? "border-b border-hairline bg-brand-50/40" : "border-b border-brand-200 bg-brand-50/60"}`}
    >
      <td colSpan={7} className="p-0">
        <form id={formId} action={submitForm}>
          {entry && <input type="hidden" name="id" value={entry.id} />}
          <table className="w-full table-fixed">
            <FuelColgroup />
            <tbody>
              <tr>
                <td className="px-4 py-3 align-top">
                  <DatePicker name="refuelDate" value={refuelDate} onChange={setRefuelDate} />
                </td>
                <td className="px-4 py-3 align-top">
                  <Combobox
                    name="vehicleId"
                    value={vehicleId}
                    onChange={setVehicleId}
                    options={vehicles.map((v) => ({ id: v.id, label: v.plate }))}
                    placeholder="Chọn xe…"
                    emptyText="Không thấy xe"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <MoneyInput
                    name="amount"
                    defaultValue={entry?.amount ?? null}
                    required
                    placeholder={!entry ? "Số tiền" : undefined}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    name="payerName"
                    defaultValue={entry?.payerName ?? ""}
                    placeholder={!entry ? "Người đổ" : undefined}
                    className={inputCls}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <DatePicker
                    name="paymentDate"
                    value={paymentStatus === "paid" ? paymentDate : ""}
                    onChange={setPaymentDate}
                    disabled={paymentStatus !== "paid"}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <FuelPaymentStatusSelect
                    name="paymentStatus"
                    value={paymentStatus}
                    onChange={setPaymentStatus}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="space-y-2">
                    <input
                      name="note"
                      defaultValue={entry?.note ?? ""}
                      placeholder={!entry ? "Ghi chú" : undefined}
                      className={inputCls}
                    />
                    {err && <div className="text-right text-xs font-medium text-rose-600">{err}</div>}
                    <div className="flex flex-wrap justify-end gap-2">
                      {entry && (
                        <button
                          type="button"
                          onClick={remove}
                          disabled={isPending}
                          className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                        >
                          Xóa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
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
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </td>
    </motion.tr>
  );
}
