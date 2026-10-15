"use client";

import { useMemo } from "react";
import { fmtDate, monthKeyOf, monthLabel } from "@/utils/format";
import { fmtMoney, legRoute, statusBg, tripStatusLabel } from "@/utils/trips";
import { seatLabel } from "@/utils/vehicles";
import type { Trip, Vehicle, Driver, Leg } from "@/types";

type VehicleTripKind = "both" | "out" | "ret";

type VehicleTripRow = {
  trip: Trip;
  kind: VehicleTripKind;
  date: string;
  legs: { leg: Leg; label: string }[];
  driverNames: string[];
};

const ROLE_META: Record<VehicleTripKind, { label: string; cls: string }> = {
  both: { label: "Cả 2 lượt", cls: "bg-violet-100 text-violet-700" },
  out: { label: "Lượt đi", cls: "bg-blue-100 text-blue-700" },
  ret: { label: "Lượt về", cls: "bg-amber-100 text-amber-700" },
};

const COLS: { w: string; label: string; align?: string }[] = [
  { w: "15%", label: "Thời gian" },
  { w: "11%", label: "Lượt chạy" },
  { w: "15%", label: "Khách hàng" },
  { w: "22%", label: "Lộ trình" },
  { w: "12%", label: "Lái xe" },
  { w: "12%", label: "Trạng thái" },
  { w: "13%", label: "Giá trị / Cọc", align: "text-right" },
];

function StatChip({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "emerald" | "amber";
}) {
  const tones = { slate: "text-ink", emerald: "text-emerald-700", amber: "text-amber-600" } as const;
  return (
    <div className="rounded-xl border border-hairline bg-canvas/60 px-3.5 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold leading-none tabular-nums ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export default function VehicleSchedule({
  vehicles,
  drivers,
  trips,
  days,
  today,
  vid,
  onOpen,
  onAdd,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  days: string[];
  today: string;
  vid: string;
  onOpen: (trip: Trip) => void;
  onAdd?: () => void;
}) {
  const selected = vehicles.find((v) => v.id === vid);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  const first = days[0];
  const last = days[days.length - 1];

  // Các chuyến mà xe đang chọn tham gia (chạy lượt đi, lượt về hoặc cả hai) trong tháng.
  const rows = useMemo<VehicleTripRow[]>(() => {
    if (!first || !last) return [];
    const list: VehicleTripRow[] = [];
    for (const trip of trips) {
      const hasOut = trip.outbound.vehicleId === vid;
      const hasRet = !!trip.return && trip.return.vehicleId === vid;
      if (!hasOut && !hasRet) continue;

      const legs: { leg: Leg; label: string }[] = [];
      if (hasOut) legs.push({ leg: trip.outbound, label: "Đi" });
      if (hasRet && trip.return) legs.push({ leg: trip.return, label: "Về" });

      // Chỉ nhận chuyến có ít nhất 1 lượt của xe rơi vào tháng đang xem.
      if (!legs.some(({ leg }) => leg.date >= first && leg.date <= last)) continue;

      const date = legs.reduce((min, { leg }) => (leg.date < min ? leg.date : min), legs[0].leg.date);
      const kind: VehicleTripKind = hasOut && hasRet ? "both" : hasOut ? "out" : "ret";

      const driverNames: string[] = [];
      for (const { leg } of legs) {
        const name = leg.driverId ? driverMap.get(leg.driverId)?.name : undefined;
        if (name && !driverNames.includes(name)) driverNames.push(name);
      }

      list.push({ trip, kind, date, legs, driverNames });
    }
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [trips, vid, first, last, driverMap]);

  const total = rows.length;
  const completed = rows.filter((r) => r.trip.status === "completed_paid").length;
  const upcoming = rows.filter((r) => r.trip.outbound.date >= today).length;

  // Lái xe "mặc định" của xe trong tháng: người được phân công nhiều lượt nhất.
  const defaultDriver = useMemo(() => {
    const count = new Map<string, number>();
    for (const row of rows) {
      for (const { leg } of row.legs) {
        if (leg.driverId) count.set(leg.driverId, (count.get(leg.driverId) ?? 0) + 1);
      }
    }
    let best: string | undefined;
    let bestN = 0;
    for (const [id, n] of count) {
      if (n > bestN) {
        best = id;
        bestN = n;
      }
    }
    return best ? driverMap.get(best)?.name : undefined;
  }, [rows, driverMap]);

  if (!selected) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted shadow-sm">
        Chưa có xe nào.
      </div>
    );
  }

  const monthTitle = first ? monthLabel(monthKeyOf(first)) : "này";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Tóm tắt thông tin xe + thống kê nhanh trong tháng */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface p-4 shadow-card">
        <div className="min-w-0">
          <div className="text-lg font-bold tracking-tight text-ink">{selected.plate}</div>
          <div className="mt-0.5 text-sm text-muted">
            {seatLabel(selected.seats)}
            {defaultDriver ? ` · Lái xe: ${defaultDriver}` : ""}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatChip label="Tổng chuyến" value={total} />
          <StatChip label="Hoàn thành" value={completed} tone="emerald" />
          <StatChip label="Sắp tới" value={upcoming} tone="amber" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-hairline bg-surface shadow-panel">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <p className="text-muted">Xe chưa có chuyến nào trong {monthTitle}.</p>
            {onAdd && (
              <button
                type="button"
                onClick={onAdd}
                className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-[0.98]"
              >
                + Thêm chuyến
              </button>
            )}
          </div>
        ) : (
          <table className="w-full table-fixed text-[14px]">
            <colgroup>
              {COLS.map((c, i) => (
                <col key={i} style={{ width: c.w }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-canvas/90 backdrop-blur">
              <tr className="border-b border-hairline text-left text-[12px] font-bold uppercase tracking-[0.02em] text-muted">
                {COLS.map((c) => (
                  <th key={c.label} className={`whitespace-nowrap px-4 py-3.5 ${c.align ?? ""}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { trip } = row;
                const role = ROLE_META[row.kind];
                const multi = row.legs.length > 1;
                return (
                  <tr
                    key={trip.id}
                    onClick={() => onOpen(trip)}
                    title="Xem / chỉnh sửa chi tiết chuyến"
                    className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        {row.legs.map(({ leg, label }) => (
                          <div key={label} className="text-[13px] text-slate-700">
                            {multi && <span className="mr-1 text-[11px] font-semibold text-muted">{label}</span>}
                            <span className="whitespace-nowrap tabular-nums">{fmtDate(leg.date)}</span>
                            {leg.time && <span className="ml-1 text-muted">{leg.time}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${role.cls}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="truncate font-semibold text-slate-900">{trip.customerName}</div>
                      {trip.customerPhone && (
                        <a
                          href={`tel:${trip.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 block truncate text-[12px] text-brand-600 hover:underline"
                        >
                          {trip.customerPhone}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        {row.legs.map(({ leg, label }) => (
                          <div key={label} className="truncate text-[13px] text-slate-600" title={legRoute(leg)}>
                            {multi && <span className="mr-1 text-[11px] font-semibold text-muted">{label}</span>}
                            {legRoute(leg)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-slate-700">
                      {row.driverNames.length ? row.driverNames.join(" · ") : "—"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${statusBg(trip.status)}`}>
                        {tripStatusLabel(trip.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <div className="font-bold tabular-nums text-slate-800">{fmtMoney(trip.price)}</div>
                      {trip.deposit != null && (
                        <div className="mt-0.5 text-[12px] text-muted">cọc {fmtMoney(trip.deposit)}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
