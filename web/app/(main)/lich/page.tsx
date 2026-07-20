import Link from "next/link";
import { readDb } from "@/lib/db";
import { LinkButton } from "@/components/ui";
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
  const db = readDb();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lịch điều xe</h1>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <LinkButton href={`/lich?m=${addMonth(monthKey, -1)}`} variant="ghost">←</LinkButton>
          <span className="min-w-[120px] text-center text-sm font-semibold text-slate-700">{monthLabel(monthKey)}</span>
          <LinkButton href={`/lich?m=${addMonth(monthKey, 1)}`} variant="ghost">→</LinkButton>
        </div>
      </div>

      {db.vehicles.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">
          Chưa có xe nào.{" "}
          <Link href="/xe" className="font-medium text-brand-600 hover:underline">
            Thêm xe ở trang Quản lý xe
          </Link>
          .
        </div>
      ) : (
        <ScheduleGrid
          vehicles={db.vehicles}
          drivers={db.drivers}
          days={days}
          today={today}
          trips={db.trips ?? []}
        />
      )}
    </div>
  );
}
