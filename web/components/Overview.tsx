import Link from "next/link";
import type { ReactNode } from "react";
import type { Trip, Vehicle, Driver } from "@/lib/types";
import { revenueMonthKey } from "@/lib/revenue";
import { tourTypeLabel, legRoute } from "@/lib/trips";
import { fmtDate } from "@/lib/format";

/**
 * Màn "Tổng quan" (control-room) — thuần VẬN HÀNH, giống nhau cho mọi role.
 * KHÔNG hiển thị doanh thu/lợi nhuận/công nợ/tiền dầu ở đây: đó là dữ liệu xem
 * theo quyền, đã có màn "Doanh thu" (chỉ quản lý) lo. Server component thuần.
 */

type Warning = { plate: string; kind: string; due: string; days: number };

export default function Overview({
  trips,
  vehicles,
  drivers,
  today,
  monthKey,
}: {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  today: string;
  monthKey: string;
}) {
  // ---- Chuyến trong tháng ----
  const monthTrips = trips.filter((t) => revenueMonthKey(t) === monthKey);
  const noPrice = monthTrips.filter((t) => t.price == null).length;

  // ---- Đội xe: đang chạy / trống / bảo dưỡng ----
  const runningIds = new Set<string>();
  for (const t of trips) {
    if (t.outbound.date === today && t.outbound.vehicleId) runningIds.add(t.outbound.vehicleId);
    if (t.return?.date === today && t.return.vehicleId) runningIds.add(t.return.vehicleId);
  }
  const activeVehicles = vehicles.filter((v) => v.status === "active");
  const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const running = activeVehicles.filter((v) => runningIds.has(v.id)).length;
  const idle = activeVehicles.length - running;

  // ---- Chuyến (lượt) hôm nay ----
  const vMap = new Map(vehicles.map((v) => [v.id, v]));
  const dMap = new Map(drivers.map((d) => [d.id, d]));
  const todayLegs = collectTodayLegs(trips, today, vMap, dMap);

  // ---- Cảnh báo đăng kiểm / bảo hiểm sắp hết hạn (≤ 30 ngày hoặc đã quá hạn) ----
  const warnings: Warning[] = [];
  for (const v of vehicles) {
    for (const [kind, due] of [
      ["Đăng kiểm", v.inspectionDue],
      ["Bảo hiểm", v.insuranceDue],
    ] as const) {
      const days = daysUntil(due, today);
      if (days !== null && days <= 30) {
        warnings.push({ plate: v.plate, kind, due: due as string, days });
      }
    }
  }
  warnings.sort((a, b) => a.days - b.days);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 py-6 text-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.8)] sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-dispatch-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Điều hành hôm nay</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tổng quan</h1>
          </div>
          <Link
            href="/lich"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sidebar shadow-sm transition hover:bg-dispatch-50 active:scale-[0.98]"
          >
            Mở lịch điều xe
            <span aria-hidden className="text-dispatch-600">→</span>
          </Link>
        </div>
      </div>

      {/* KPI vận hành */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Chuyến trong tháng"
          value={String(monthTrips.length)}
          unit="chuyến"
          hint={
            noPrice > 0 ? (
              <span className="text-signal">{noPrice} chưa có giá</span>
            ) : (
              <span className="text-muted">đã đủ thông tin</span>
            )
          }
        />
        <StatTile
          label="Xe đang hoạt động"
          value={String(activeVehicles.length)}
          unit={`/ ${activeVehicles.length + maintenance} xe`}
          hint={
            <span className="text-muted">
              <b className="font-semibold text-dispatch-600">{running}</b> chạy hôm nay ·{" "}
              {maintenance} bảo dưỡng
            </span>
          }
        />
        <StatTile
          label="Chuyến hôm nay"
          value={String(todayLegs.length)}
          unit="lượt"
          hint={<span className="text-muted">cần điều phối</span>}
        />
        <StatTile
          label="Cảnh báo"
          value={String(warnings.length)}
          unit="xe"
          accent={warnings.length > 0 ? "amber" : "ink"}
          hint={<span className="text-muted">đăng kiểm / bảo hiểm</span>}
        />
      </div>

      {/* Chuyến hôm nay + đội xe */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <Card className="xl:col-span-1" title="Chuyến sắp tới hôm nay" subtitle={`${todayLegs.length} lượt`}>
          <TodayList legs={todayLegs} />
        </Card>
        <Card title="Trạng thái đội xe">
          <FleetDonut running={running} idle={idle} maintenance={maintenance} />
        </Card>
      </div>

      {/* Cảnh báo */}
      <Card title="Cảnh báo" subtitle="Đăng kiểm / bảo hiểm ≤ 30 ngày">
        <WarningList warnings={warnings} />
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tổng hợp dữ liệu (thuần)                                            */
/* ------------------------------------------------------------------ */

function daysUntil(dateStr: string | null, today: string): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000);
}

type LegRow = {
  time: string | null;
  customer: string;
  route: string;
  vehicle: string;
  partner: boolean;
  driver: string;
  tour: string;
};

function collectTodayLegs(
  trips: Trip[],
  today: string,
  vMap: Map<string, Vehicle>,
  dMap: Map<string, Driver>
): LegRow[] {
  const rows: LegRow[] = [];
  for (const t of trips) {
    for (const leg of [t.outbound, t.return]) {
      if (!leg || leg.date !== today) continue;
      const v = leg.vehicleId ? vMap.get(leg.vehicleId) : null;
      const d = leg.driverId ? dMap.get(leg.driverId) : null;
      rows.push({
        time: leg.time,
        customer: t.customerName,
        route: legRoute(leg),
        vehicle: v?.plate ?? (leg.seatClass ? `${leg.seatClass} chỗ` : "Chưa xếp"),
        partner: v?.type === "partner",
        driver: d?.name ?? "Chưa gán",
        tour: tourTypeLabel(t.tourType),
      });
    }
  }
  rows.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  return rows;
}

/* ------------------------------------------------------------------ */
/* Thành phần trình bày                                               */
/* ------------------------------------------------------------------ */

function Card({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)] ${className}`}>
      <div className="flex items-baseline justify-between gap-2 border-b border-hairline px-5 py-4">
        <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
        {subtitle && <span className="text-xs font-medium text-muted tabular-nums">{subtitle}</span>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

const ACCENT: Record<string, string> = {
  ink: "text-ink",
  amber: "text-signal",
};

function StatTile({
  label,
  value,
  unit,
  hint,
  accent = "ink",
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: ReactNode;
  accent?: keyof typeof ACCENT;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-5 shadow-[0_10px_26px_-24px_rgba(15,23,42,0.8)]">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={`text-3xl font-bold leading-none tracking-tight tabular-nums ${ACCENT[accent]}`}>
          {value}
        </span>
        {unit && <span className="text-xs font-medium text-muted">{unit}</span>}
      </div>
      {hint && <div className="mt-2 text-[11px] leading-tight">{hint}</div>}
    </div>
  );
}

/* ---- Donut trạng thái đội xe ---- */

function FleetDonut({ running, idle, maintenance }: { running: number; idle: number; maintenance: number }) {
  const total = running + idle + maintenance;
  const segs = [
    { v: running, color: "#2F5BEA", label: "Đang chạy" },
    { v: idle, color: "#CBD5E1", label: "Trống" },
    { v: maintenance, color: "#F59E0B", label: "Bảo dưỡng" },
  ];

  if (total === 0) {
    return <p className="py-8 text-center text-sm text-muted">Chưa có xe nào trong đội.</p>;
  }

  const r = 54;
  const cx = 70;
  const cy = 70;
  const sw = 18;
  const C = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={140} height={140} viewBox="0 0 140 140" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EEF1F6" strokeWidth={sw} />
        {segs.map((s, i) => {
          if (s.v === 0) return null;
          const len = (s.v / total) * C;
          const dash = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={sw}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          acc += len;
          return dash;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" className="fill-ink" style={{ fontSize: 26, fontWeight: 700 }}>
          {total}
        </text>
        <text x={cx} y={cy + 15} textAnchor="middle" className="fill-muted" style={{ fontSize: 11 }}>
          xe
        </text>
      </svg>
      <ul className="flex-1 space-y-2.5">
        {segs.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-muted">{s.label}</span>
            <span className="ml-auto font-semibold text-ink tabular-nums">{s.v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- Danh sách chuyến hôm nay ---- */

function TodayList({ legs }: { legs: LegRow[] }) {
  if (legs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Hôm nay chưa có lượt xe nào.{" "}
        <Link href="/lich" className="font-medium text-dispatch-600 hover:underline">
          Tạo chuyến →
        </Link>
      </p>
    );
  }
  const shown = legs.slice(0, 7);
  return (
    <div className="-mx-1">
      <ul className="divide-y divide-hairline">
        {shown.map((l, i) => (
          <li key={i} className="flex items-center gap-3 px-1 py-2.5">
            <span className="w-12 shrink-0 text-sm font-bold text-ink tabular-nums">
              {l.time ?? "Chưa giờ"}
            </span>
            <span
              className={`h-8 w-1 shrink-0 rounded-full ${l.partner ? "bg-slate-400" : "bg-dispatch-500"}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{l.customer}</div>
              <div className="truncate text-xs text-muted">{l.route}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-bold text-ink tabular-nums">{l.vehicle}</div>
              <div className="text-xs text-muted">{l.driver}</div>
            </div>
          </li>
        ))}
      </ul>
      {legs.length > shown.length && (
        <Link href="/lich" className="mt-2 block px-1 text-xs font-medium text-dispatch-600 hover:underline">
          + {legs.length - shown.length} lượt nữa · xem lịch →
        </Link>
      )}
    </div>
  );
}

/* ---- Danh sách cảnh báo ---- */

function WarningList({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Không có xe nào sắp hết hạn đăng kiểm hoặc bảo hiểm trong 30 ngày tới.
      </p>
    );
  }
  const shown = warnings.slice(0, 9);
  return (
    <div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((w, i) => {
          const overdue = w.days < 0;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                overdue ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <span className="text-sm font-bold text-ink tabular-nums">{w.plate}</span>
              <span className="text-xs text-muted">{w.kind}</span>
              <span className="ml-auto text-right">
                <span className={`text-xs font-semibold ${overdue ? "text-rose-600" : "text-signal"}`}>
                  {overdue ? `Quá hạn ${Math.abs(w.days)} ngày` : `Còn ${w.days} ngày`}
                </span>
                <span className="block text-[11px] text-muted tabular-nums">{fmtDate(w.due)}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {warnings.length > shown.length && (
        <Link href="/xe" className="mt-2 block text-xs font-medium text-dispatch-600 hover:underline">
          + {warnings.length - shown.length} xe khác · quản lý xe →
        </Link>
      )}
    </div>
  );
}
