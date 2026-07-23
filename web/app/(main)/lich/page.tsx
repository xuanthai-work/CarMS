import Link from "next/link";
import { getVehicles, getDrivers, getTrips } from "@/lib/db";
import ScheduleGrid from "@/components/ScheduleGrid";
import { daysInMonth, monthKeyOf, monthLabel, addMonth, todayStr } from "@/lib/format";

export default async function LichPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const today = todayStr();
  const monthKey = sp.m || monthKeyOf(today);
  const days = daysInMonth(monthKey);
  const [vehicles, drivers, trips] = await Promise.all([
    getVehicles(),
    getDrivers(),
    getTrips(),
  ]);

  // Chiều cao trừ 2.5rem = padding dọc py-5 của <main> (xem (main)/layout.tsx) — đổi padding đó thì chỉnh theo.
  return (
    <div className="flex h-[calc(100vh-2.5rem)] min-h-[420px] flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Điều phối vận hành</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Lịch điều xe</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface p-1.5 shadow-sm">
          <Link
            href={`/lich?m=${addMonth(monthKey, -1)}`}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-canvas active:scale-95"
          >
            ←
          </Link>
          <span className="min-w-[132px] text-center text-sm font-semibold text-ink">{monthLabel(monthKey)}</span>
          <Link
            href={`/lich?m=${addMonth(monthKey, 1)}`}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-canvas active:scale-95"
          >
            →
          </Link>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-12 text-center text-muted shadow-sm">
          Chưa có xe nào.{" "}
          <Link href="/xe" className="font-medium text-brand-600 hover:underline">
            Thêm xe ở trang Quản lý xe
          </Link>
          .
        </div>
      ) : (
        <ScheduleGrid
          vehicles={vehicles}
          drivers={drivers}
          days={days}
          today={today}
          trips={trips}
        />
      )}
    </div>
  );
}
