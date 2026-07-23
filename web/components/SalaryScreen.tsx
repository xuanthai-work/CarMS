"use client";

import { useState } from "react";
import Link from "next/link";
import FilterTabs from "@/components/FilterTabs";
import SalaryMonthTable from "@/components/SalaryMonthTable";
import PartnerPayoutTable from "@/components/PartnerPayoutTable";
import { monthLabel, addMonth } from "@/lib/format";
import { fmtMoney } from "@/lib/trips";
import type { SalaryRow } from "@/lib/salary";
import type { Driver, PartnerPayout } from "@/lib/types";

function Tile({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "amber" | "emerald" }) {
  const color = tone === "amber" ? "text-signal" : tone === "emerald" ? "text-emerald-600" : "text-ink";
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5 shadow-[0_10px_26px_-24px_rgba(15,23,42,0.8)]">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className={`mt-3 text-2xl font-bold leading-none tracking-tight tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export default function SalaryScreen({
  rows,
  payouts,
  drivers,
  monthKey,
  isManager,
  payoutTotal,
}: {
  rows: SalaryRow[];
  payouts: PartnerPayout[];
  drivers: Driver[];
  monthKey: string;
  isManager: boolean;
  payoutTotal: number;
}) {
  const [tab, setTab] = useState<"month" | "partner">("month");
  const [query, setQuery] = useState("");

  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const paidNet = rows.filter((r) => r.paid).reduce((s, r) => s + r.net, 0);
  const paidPayout = payouts
    .filter((p) => p.paymentStatus === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const paidTotal = paidNet + paidPayout;
  const owing = totalNet + payoutTotal - paidTotal;
  const officeRows = rows.filter((row) => row.personType === "office");
  const driverRows = rows.filter((row) => row.personType === "driver");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Chi phí nhân sự</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Lương</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface p-1.5 shadow-sm">
          <Link href={`/luong?m=${addMonth(monthKey, -1)}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-all duration-150 hover:bg-canvas active:scale-95">←</Link>
          <span className="min-w-[132px] text-center text-sm font-semibold text-ink">{monthLabel(monthKey)}</span>
          <Link href={`/luong?m=${addMonth(monthKey, 1)}`} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-all duration-150 hover:bg-canvas active:scale-95">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isManager && <Tile label="Tổng lương tháng" value={fmtMoney(totalNet)} />}
        <Tile label="Trả công đối tác" value={fmtMoney(payoutTotal)} />
        {isManager && <Tile label="Đã trả" value={fmtMoney(paidTotal)} tone="emerald" />}
        {isManager && <Tile label="Còn phải trả" value={fmtMoney(owing)} tone={owing > 0 ? "amber" : "ink"} />}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-2.5 shadow-[0_10px_28px_-25px_rgba(15,23,42,0.8)]">
        <FilterTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Chọn nhóm lương"
          options={[
            ["month", "Lương tháng"],
            ["partner", "Trả công đối tác"],
          ] as const}
        />
        <div className="relative min-w-[220px] flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên nhân sự, chức vụ..."
            className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {tab === "month" ? (
        <div className="space-y-5">
          {isManager && (
            <SalaryGroup title="Văn phòng" count={officeRows.length}>
              <SalaryMonthTable rows={officeRows} monthKey={monthKey} query={query} />
            </SalaryGroup>
          )}
          <SalaryGroup title="Lái xe" count={driverRows.length}>
            <SalaryMonthTable rows={driverRows} monthKey={monthKey} query={query} />
          </SalaryGroup>
        </div>
      ) : (
        <PartnerPayoutTable payouts={payouts} drivers={drivers} monthKey={monthKey} />
      )}
    </div>
  );
}

function SalaryGroup({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-muted">{count}</span>
      </div>
      {children}
    </section>
  );
}
