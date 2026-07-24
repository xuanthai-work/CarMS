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
import FilterTabs from "@/components/FilterTabs";
import { Toolbar, SearchInput } from "@/components/ui";
import MonthNav from "@/components/MonthNav";

const STAT_TONE = {
  neutral: "text-ink",
  amber: "text-signal",
  emerald: "text-emerald-700",
  rose: "text-rose-700",
} as const;

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof STAT_TONE;
  onClick?: () => void;
}) {
  const toneText = STAT_TONE[tone];
  const content = (
    <>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className={`mt-2 text-xl font-bold tracking-tight tabular-nums ${toneText}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </>
  );
  const className = `w-full rounded-2xl border border-hairline bg-surface p-4 text-left shadow-card ${
    onClick ? "cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2" : ""
  }`;
  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default function RevenueScreen({
  trips,
  vehicles,
  drivers,
  defaultMonthKey,
  fuelTotalsByMonth,
  salaryCostByMonth,
}: {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  defaultMonthKey: string;
  fuelTotalsByMonth: Record<string, number>;
  salaryCostByMonth: Record<string, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [detail, setDetail] = useState<Trip | null>(null);
  const [costDetailOpen, setCostDetailOpen] = useState(false);
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
  const salaryCost = salaryCostByMonth[monthKey] ?? 0;
  const totalCost = summary.cost + fuelTotal + salaryCost;
  const profit = monthProfit(summary, fuelTotal, salaryCost);
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
          b.trip.outbound.date.localeCompare(a.trip.outbound.date)
        : b.trip.outbound.date.localeCompare(a.trip.outbound.date) ||
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Tài chính vận hành</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Doanh thu</h1>
        </div>
        <MonthNav
          label={monthLabel(monthKey)}
          onPrev={() => setMonthKey((m) => addMonth(m, -1))}
          onNext={() => setMonthKey((m) => addMonth(m, 1))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Doanh thu" value={fmtMoney(summary.recognized)} />
        <Stat label="Đã thanh toán" value={fmtMoney(paidTotal)} />
        <Stat
          label="Tổng chi phí tháng"
          value={fmtMoney(totalCost)}
          hint="Bấm để xem chi tiết"
          onClick={() => setCostDetailOpen(true)}
        />
        <Stat label="Còn phải thu" value={fmtMoney(summary.outstanding)} tone="amber" />
        <Stat
          label="Lợi nhuận"
          value={fmtMoney(profit)}
          tone={profit >= 0 ? "emerald" : "rose"}
        />
        <Stat label="Số chuyến" value={String(summary.count)} hint={noPriceCount > 0 ? `${noPriceCount} chuyến chưa có giá` : undefined} />
      </div>

      <Toolbar>
        <FilterTabs
          value={filter}
          onChange={setFilter}
          ariaLabel="Lọc trạng thái doanh thu"
          options={[
            ["all", "Tất cả"],
            ["owing", "Còn nợ"],
            ["paid", "Đã thanh toán"],
          ] as const}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm tên khách..." />
      </Toolbar>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel">
        {rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              Không có chuyến nào {filter === "owing" ? "còn nợ " : filter === "paid" ? "đã thanh toán " : ""}
              trong tháng này.
            </div>
          ) : (
            <table className="w-full table-fixed text-sm">
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "11%" }} />
            </colgroup>
            <thead className="bg-canvas/70">
              <tr className="border-b border-hairline text-left text-xs font-semibold text-muted">
                <th className="px-3 py-2.5">Khách</th>
                <th className="px-3 py-2.5">Ngày đi</th>
                <th className="px-3 py-2.5">Loại</th>
                <th className="px-3 py-2.5 text-right">Giá</th>
                <th className="px-3 py-2.5 text-right">Đã cọc</th>
                <th className="px-3 py-2.5 text-right">Chi phí</th>
                <th className="px-3 py-2.5 text-right">Còn phải thu</th>
                <th className="px-3 py-2.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ trip, money }) => (
                <tr
                  key={trip.id}
                  onClick={() => setDetail(trip)}
                  className="cursor-pointer border-b border-hairline last:border-0 transition hover:bg-canvas/60"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-ink">{trip.customerName}</div>
                    {trip.customerPhone && (
                      <div className="text-xs text-muted">{trip.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted">{fmtDate(trip.outbound.date)}</td>
                  <td className="px-3 py-2.5 text-muted">{tourTypeLabel(trip.tourType)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink">
                    {trip.price == null ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-400">
                        chưa có giá
                      </span>
                    ) : (
                      fmtMoney(money.recognized)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-700">
                    {trip.deposit != null && trip.deposit > 0 ? fmtMoney(trip.deposit) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted">
                    {money.cost > 0 ? fmtMoney(money.cost) : "—"}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-semibold ${
                      money.outstanding > 0 ? "text-amber-700" : "text-slate-400"
                    }`}
                  >
                    {money.outstanding > 0 ? fmtMoney(money.outstanding) : "—"}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
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

      {costDetailOpen && (
        <Modal title="Chi tiết tổng chi phí tháng" onClose={() => setCostDetailOpen(false)} maxWidthClass="max-w-md">
          <div className="space-y-3">
            <CostLine label="Chi phí khác" value={summary.cost} />
            <CostLine label="Tiền dầu" value={fuelTotal} />
            <CostLine label="Chi phí lương" value={salaryCost} />
            <div className="flex items-center justify-between border-t border-hairline pt-3 text-base font-bold text-ink">
              <span>Tổng chi phí tháng</span>
              <span>{fmtMoney(totalCost)}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CostLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-canvas px-3 py-2.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{fmtMoney(value)}</span>
    </div>
  );
}
