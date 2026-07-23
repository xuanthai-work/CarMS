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
    <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-sm">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className={`mt-2 text-[22px] font-bold leading-none tabular-nums ${color}`}>{value}</div>
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

  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const paidNet = rows.filter((r) => r.paid).reduce((s, r) => s + r.net, 0);
  const owing = totalNet - paidNet;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Lương</h1>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <Link href={`/luong?m=${addMonth(monthKey, -1)}`} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-100 active:scale-95">←</Link>
          <span className="min-w-[120px] text-center text-sm font-semibold text-slate-700">{monthLabel(monthKey)}</span>
          <Link href={`/luong?m=${addMonth(monthKey, 1)}`} className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition-all duration-150 hover:bg-slate-100 active:scale-95">→</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isManager && <Tile label="Tổng lương tháng" value={fmtMoney(totalNet)} />}
        {isManager && <Tile label="Đã trả" value={fmtMoney(paidNet)} tone="emerald" />}
        {isManager && <Tile label="Còn phải trả" value={fmtMoney(owing)} tone={owing > 0 ? "amber" : "ink"} />}
        <Tile label="Trả công đối tác (tháng)" value={fmtMoney(payoutTotal)} />
      </div>

      <FilterTabs
        value={tab}
        onChange={setTab}
        ariaLabel="Chọn nhóm lương"
        options={[
          ["month", "Lương tháng"],
          ["partner", "Trả công đối tác"],
        ] as const}
      />

      {tab === "month" ? (
        <SalaryMonthTable rows={rows} monthKey={monthKey} />
      ) : (
        <PartnerPayoutTable payouts={payouts} drivers={drivers} monthKey={monthKey} />
      )}
    </div>
  );
}
