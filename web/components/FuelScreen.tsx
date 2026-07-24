"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/lib/motion";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import FuelEntryEditorRow, {
  FuelColgroup,
} from "@/components/FuelEntryEditorRow";
import FilterTabs from "@/components/FilterTabs";
import { useDismiss } from "@/lib/useDismiss";
import { addMonth, fmtDate, monthLabel } from "@/lib/format";
import { normalizeVn } from "@/lib/search";
import { fmtMoney } from "@/lib/trips";
import type { FuelEntry, Vehicle } from "@/lib/types";
import { Toolbar, SearchInput } from "@/components/ui";
import MonthNav from "@/components/MonthNav";

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
    slate: "text-ink",
    emerald: "text-emerald-700",
    amber: "text-signal",
  } as const;
  return (
    <div
      className={`rounded-2xl border border-hairline bg-surface p-5 shadow-card ${tones[tone]}`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
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
  const reduceMotion = useReducedMotion();
  const selectedLabel =
    value === "all"
      ? "Tất cả xe"
      : (vehicles.find((v) => v.id === value)?.plate ?? "Tất cả xe");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex h-9 min-w-[148px] items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-medium text-ink shadow-sm transition ${
          open
            ? "border-brand-500 bg-white ring-1 ring-brand-500"
            : "border-hairline bg-surface hover:border-slate-400"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span
          className={`text-xs text-muted transition ${open ? "rotate-180" : ""}`}
        >
          ⌄
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className="absolute left-0 top-full z-30 mt-2 max-h-72 min-w-full overflow-auto rounded-xl border border-hairline bg-surface p-1.5 shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                value === "all"
                  ? "bg-brand-600 font-semibold text-white"
                  : "text-ink hover:bg-canvas"
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
                className={`mt-0.5 block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  value === v.id
                    ? "bg-brand-600 font-semibold text-white"
                    : "text-ink hover:bg-canvas"
                }`}
              >
                {v.plate}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
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
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">(
    "all",
  );
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const vehicleMap = useMemo(
    () => new Map(vehicles.map((v) => [v.id, v])),
    [vehicles],
  );
  const nq = normalizeVn(q);

  const rows = useMemo(() => {
    return entries.filter((entry) => {
      if (vehicleFilter !== "all" && entry.vehicleId !== vehicleFilter)
        return false;
      if (statusFilter !== "all" && entry.paymentStatus !== statusFilter)
        return false;
      if (!nq) return true;
      const plate = vehicleMap.get(entry.vehicleId)?.plate ?? "";
      return [plate, entry.payerName, entry.note].some((v) =>
        normalizeVn(v).includes(nq),
      );
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
      { total: 0, paid: 0, unpaid: 0, count: 0 },
    );
  }, [rows]);

  function moveMonth(delta: number) {
    router.push(`/tien-dau?m=${addMonth(monthKey, delta)}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Chi phí vận hành
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Tiền dầu
          </h1>
        </div>
        <MonthNav
          label={monthLabel(monthKey)}
          onPrev={() => moveMonth(-1)}
          onNext={() => moveMonth(1)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Tổng tiền dầu" value={fmtMoney(summary.total)} />
        <Stat
          label="Đã thanh toán"
          value={fmtMoney(summary.paid)}
          tone="emerald"
        />
        <Stat label="Còn nợ" value={fmtMoney(summary.unpaid)} tone="amber" />
        <Stat label="Số lần đổ" value={String(summary.count)} />
      </div>

      <Toolbar>
        <FilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Lọc trạng thái thanh toán"
          options={
            [
              ["all", "Tất cả"],
              ["paid", "Đã thanh toán"],
              ["unpaid", "Chưa thanh toán"],
            ] as const
          }
        />
        <VehicleFilterSelect
          value={vehicleFilter}
          vehicles={vehicles}
          onChange={setVehicleFilter}
        />
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm biển số, người đổ, ghi chú..."
        />
        <button
          type="button"
          onClick={() => setAdding((open) => !open)}
          className="h-9 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 active:scale-[0.98]"
        >
          {adding ? "Đóng phiếu mới" : "+ Thêm phiếu dầu"}
        </button>
      </Toolbar>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel">
        {!adding && rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Không có phiếu dầu trong tháng này.
          </div>
        ) : (
          <table className="w-full table-fixed text-[14px]">
            <FuelColgroup />
            <thead className="bg-canvas/70">
              <tr className="border-b border-hairline text-left text-[12px] font-bold uppercase tracking-[0.02em] text-muted">
                <th className="whitespace-nowrap px-4 py-3.5">Ngày đổ</th>
                <th className="whitespace-nowrap px-4 py-3.5">Biển số</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">
                  Số tiền
                </th>
                <th className="whitespace-nowrap px-4 py-3.5">Người đổ</th>
                <th className="whitespace-nowrap px-4 py-3.5">
                  Ngày thanh toán
                </th>
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
                        {entry.paymentStatus === "paid"
                          ? "Đã thanh toán"
                          : "Chưa thanh toán"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[14px] leading-relaxed text-slate-700">
                      {entry.note || <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
