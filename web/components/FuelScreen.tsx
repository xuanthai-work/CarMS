"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FuelEntryEditorRow, { FuelColgroup } from "@/components/FuelEntryEditorRow";
import { useDismiss } from "@/lib/useDismiss";
import { addMonth, fmtDate, monthLabel } from "@/lib/format";
import { normalizeVn } from "@/lib/search";
import { fmtMoney } from "@/lib/trips";
import type { FuelEntry, Vehicle } from "@/lib/types";

function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber";
}) {
  const tones = {
    slate: "border-slate-200 bg-white text-slate-900",
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-700",
    amber: "border-amber-300 bg-amber-50 text-amber-700",
  } as const;
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone]}`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

function VehicleFilterSelect({
  value,
  vehicles,
  onChange,
}: {
  value: string;
  vehicles: Vehicle[];
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));

  const selectedLabel =
    value === "all" ? "Tất cả xe" : vehicles.find((v) => v.id === value)?.plate ?? "Tất cả xe";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex min-w-[140px] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition ${
          open
            ? "border-brand-500 bg-white ring-1 ring-brand-500"
            : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className={`text-[10px] text-slate-500 transition ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-72 min-w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              onChange("all");
              setOpen(false);
            }}
            className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
              value === "all"
                ? "bg-brand-600 font-semibold text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Tất cả xe
          </button>
          {vehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onChange(v.id);
                setOpen(false);
              }}
              className={`mt-0.5 block w-full rounded-md px-3 py-1.5 text-left text-sm transition ${
                value === v.id
                  ? "bg-brand-600 font-semibold text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {v.plate}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FuelScreen({
  entries,
  vehicles,
  monthKey,
}: {
  entries: FuelEntry[];
  vehicles: Vehicle[];
  monthKey: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const nq = normalizeVn(q);

  const rows = useMemo(() => {
    return entries.filter((entry) => {
      if (vehicleFilter !== "all" && entry.vehicleId !== vehicleFilter) return false;
      if (statusFilter !== "all" && entry.paymentStatus !== statusFilter) return false;
      if (!nq) return true;
      const plate = vehicleMap.get(entry.vehicleId)?.plate ?? "";
      return [plate, entry.payerName, entry.note].some((v) => normalizeVn(v).includes(nq));
    });
  }, [entries, nq, statusFilter, vehicleFilter, vehicleMap]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += row.amount;
        acc.count += 1;
        if (row.paymentStatus === "paid") acc.paid += row.amount;
        else acc.unpaid += row.amount;
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0, count: 0 }
    );
  }, [rows]);

  function moveMonth(delta: number) {
    router.push(`/tien-dau?m=${addMonth(monthKey, delta)}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tiền dầu</h1>
          
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            ←
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-slate-700">
            {monthLabel(monthKey)}
          </span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tổng tiền dầu" value={fmtMoney(summary.total)} />
        <Stat label="Đã thanh toán" value={fmtMoney(summary.paid)} tone="emerald" />
        <Stat label="Còn nợ" value={fmtMoney(summary.unpaid)} tone="amber" />
        <Stat label="Số lần đổ" value={String(summary.count)} />
      </div>

      <div className="flex flex-wrap items-center justify-start gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm font-medium">
          {([
            ["all", "Tất cả"],
            ["paid", "Đã thanh toán"],
            ["unpaid", "Chưa thanh toán"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-md px-3 py-1.5 ${
                statusFilter === value ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <VehicleFilterSelect
          value={vehicleFilter}
          vehicles={vehicles}
          onChange={setVehicleFilter}
        />
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm biển số, người đổ, ghi chú…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={() => setAdding((open) => !open)}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {adding ? "Đóng phiếu mới" : "+ Thêm phiếu dầu"}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {!adding && rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Không có phiếu dầu trong tháng này.</div>
        ) : (
          <table className="w-full table-fixed text-[14px]">
            <FuelColgroup />
            <thead>
              <tr className="border-b border-slate-200 text-left text-[12px] font-bold uppercase tracking-[0.02em] text-slate-500">
                <th className="whitespace-nowrap px-4 py-3.5">Ngày đổ</th>
                <th className="whitespace-nowrap px-4 py-3.5">Biển số</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">Số tiền</th>
                <th className="whitespace-nowrap px-4 py-3.5">Người đổ</th>
                <th className="whitespace-nowrap px-4 py-3.5">Ngày thanh toán</th>
                <th className="whitespace-nowrap px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {adding && (
                <FuelEntryEditorRow
                  vehicles={vehicles}
                  defaultDate={`${monthKey}-01`}
                  onDone={() => {
                    setAdding(false);
                    router.refresh();
                  }}
                  onCancel={() => setAdding(false)}
                />
              )}
              {rows.map((entry) =>
                editingId === entry.id ? (
                  <FuelEntryEditorRow
                    key={entry.id}
                    entry={entry}
                    vehicles={vehicles}
                    defaultDate={entry.refuelDate}
                    onDone={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr
                    key={entry.id}
                    onClick={() => setEditingId(entry.id)}
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] text-slate-700">
                      {fmtDate(entry.refuelDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[15px] font-bold text-slate-900">
                      {vehicleMap.get(entry.vehicleId)?.plate ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-[15px] font-bold text-slate-800">
                      {fmtMoney(entry.amount)}
                    </td>
                    <td className="truncate px-4 py-4 text-[15px] text-slate-700">
                      {entry.payerName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-[14px] text-slate-500">
                      {entry.paymentDate ? fmtDate(entry.paymentDate) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${
                          entry.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {entry.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[14px] leading-relaxed text-slate-700">
                      {entry.note || <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
