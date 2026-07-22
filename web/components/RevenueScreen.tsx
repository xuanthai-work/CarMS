"use client";

import { useMemo, useState, useTransition } from "react";
import type { Trip, Vehicle, Driver } from "@/lib/types";
import { tripMoney, summarize, revenueMonthKey, monthProfit } from "@/lib/revenue";
import { fmtMoney, tourTypeLabel, tripStatusLabel } from "@/lib/trips";
import { monthLabel, addMonth, fmtDate } from "@/lib/format";
import { normalizeVn } from "@/lib/search";
import { useRouter } from "next/navigation";
import TripModal from "@/components/TripModal";
import Modal from "@/components/Modal";
import StatusSelect from "@/components/StatusSelect";
import { setTripStatus } from "@/lib/actions";

const STAT_TONE = {
  neutral: { box: "border-slate-200 bg-white", text: "text-slate-900" },
  amber: { box: "border-amber-300 bg-amber-50", text: "text-amber-700" },
  emerald: { box: "border-emerald-300 bg-emerald-50", text: "text-emerald-700" },
  rose: { box: "border-rose-300 bg-rose-50", text: "text-rose-700" },
} as const;

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof STAT_TONE;
}) {
  const t = STAT_TONE[tone];
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${t.box}`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${t.text}`}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export default function RevenueScreen({
  trips,
  vehicles,
  drivers,
  defaultMonthKey,
  fuelTotalsByMonth,
}: {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  defaultMonthKey: string;
  fuelTotalsByMonth: Record<string, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [detail, setDetail] = useState<Trip | null>(null);
  const [statusChange, setStatusChange] = useState<{ trip: Trip; next: string } | null>(null);
  const [monthKey, setMonthKey] = useState(defaultMonthKey);

  const monthTrips = useMemo(
    () => trips.filter((t) => revenueMonthKey(t) === monthKey),
    [trips, monthKey]
  );
  // Tính tiền 1 lần cho cả tháng; summary + rows dùng lại (khỏi map tripMoney lại mỗi lần gõ/lọc).
  const monthMoney = useMemo(
    () => monthTrips.map((t) => ({ trip: t, money: tripMoney(t) })),
    [monthTrips]
  );
  const summary = useMemo(() => summarize(monthMoney.map((r) => r.money)), [monthMoney]);
  const fuelTotal = fuelTotalsByMonth[monthKey] ?? 0;
  const totalCost = summary.cost + fuelTotal;
  const profit = monthProfit(summary, fuelTotal);
  // "Đã thanh toán" = tiền các chuyến có trạng thái completed_paid (theo status, không tính cọc).
  const paidTotal = useMemo(
    () =>
      monthMoney
        .filter((r) => r.trip.status === "completed_paid")
        .reduce((s, r) => s + r.money.recognized, 0),
    [monthMoney]
  );
  const noPriceCount = useMemo(() => monthTrips.filter((t) => t.price == null).length, [monthTrips]);

  const [filter, setFilter] = useState<"all" | "owing" | "paid">("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const nq = normalizeVn(q);
    const searched = nq
      ? monthMoney.filter((r) => normalizeVn(r.trip.customerName).includes(nq))
      : monthMoney;
    const filtered = searched.filter((r) => {
      if (filter === "owing") return r.trip.status !== "completed_paid";
      if (filter === "paid") return r.trip.status === "completed_paid";
      return true;
    });
    filtered.sort((a, b) =>
      filter === "owing"
        ? b.money.outstanding - a.money.outstanding ||
          a.trip.outbound.date.localeCompare(b.trip.outbound.date)
        : a.trip.outbound.date.localeCompare(b.trip.outbound.date) ||
          (a.trip.outbound.time ?? "").localeCompare(b.trip.outbound.time ?? "")
    );
    return filtered;
  }, [monthMoney, filter, q]);

  function doSetStatus() {
    if (!statusChange) return;
    const { trip, next } = statusChange;
    startTransition(async () => {
      await setTripStatus(trip.id, next);
      setStatusChange(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Doanh thu</h1>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMonthKey((m) => addMonth(m, -1))}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            ←
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-slate-700">
            {monthLabel(monthKey)}
          </span>
          <button
            type="button"
            onClick={() => setMonthKey((m) => addMonth(m, 1))}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Stat label="Doanh thu ghi nhận" value={fmtMoney(summary.recognized)} />
        <Stat label="Chi phí khác" value={fmtMoney(summary.cost)} />
        <Stat label="Tiền dầu tháng" value={fmtMoney(fuelTotal)} />
        <Stat label="Tổng chi phí tháng" value={fmtMoney(totalCost)} />
        <Stat
          label="Lợi nhuận"
          value={fmtMoney(profit)}
          tone={profit >= 0 ? "emerald" : "rose"}
        />
        <Stat label="Đã thanh toán" value={fmtMoney(paidTotal)} />
        <Stat label="Còn phải thu" value={fmtMoney(summary.outstanding)} tone="amber" />
        <Stat label="Số chuyến" value={String(summary.count)} hint={noPriceCount > 0 ? `${noPriceCount} chuyến chưa có giá` : undefined} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm font-medium">
          {([
            ["all", "Tất cả"],
            ["owing", "Còn nợ"],
            ["paid", "Đã thanh toán"],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilter(val)}
              className={`rounded-md px-3 py-1.5 ${
                filter === val ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên khách…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Không có chuyến nào {filter === "owing" ? "còn nợ " : filter === "paid" ? "đã thanh toán " : ""}
            trong tháng này.
          </div>
        ) : (
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                <th className="px-3 py-2.5">Khách</th>
                <th className="px-3 py-2.5">Ngày đi</th>
                <th className="px-3 py-2.5">Loại</th>
                <th className="px-3 py-2.5 text-right">Giá</th>
                <th className="px-3 py-2.5 text-right">Chi phí</th>
                <th className="px-3 py-2.5 text-right">Còn phải thu</th>
                <th className="py-2.5 pl-8 pr-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ trip, money }) => (
                <tr
                  key={trip.id}
                  onClick={() => setDetail(trip)}
                  className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-slate-800">{trip.customerName}</div>
                    {trip.customerPhone && (
                      <div className="text-xs text-slate-400">{trip.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{fmtDate(trip.outbound.date)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{tourTypeLabel(trip.tourType)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700">
                    {trip.price == null ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                        chưa có giá
                      </span>
                    ) : (
                      fmtMoney(money.recognized)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-600">
                    {money.cost > 0 ? fmtMoney(money.cost) : "—"}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold ${
                      money.outstanding > 0 ? "text-amber-700" : "text-slate-400"
                    }`}
                  >
                    {money.outstanding > 0 ? fmtMoney(money.outstanding) : "—"}
                  </td>
                  <td className="py-2.5 pl-8 pr-3" onClick={(e) => e.stopPropagation()}>
                    <StatusSelect status={trip.status} onPick={(next) => setStatusChange({ trip, next })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detail && (
        <TripModal
          trip={detail}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setDetail(null)}
        />
      )}

      {statusChange && (
        <Modal title="Đổi trạng thái" onClose={() => setStatusChange(null)} maxWidthClass="max-w-md">
          <p className="text-sm text-slate-600">
            Đổi trạng thái chuyến của <b>{statusChange.trip.customerName}</b> sang{" "}
            <b>{tripStatusLabel(statusChange.next)}</b>?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStatusChange(null)}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={doSetStatus}
              disabled={isPending}
              className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {isPending ? "Đang lưu…" : "Xác nhận"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
