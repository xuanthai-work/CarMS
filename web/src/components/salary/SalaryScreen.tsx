"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lockSalaryMonthAll } from "@/api/salary";
import FilterTabs from "@/components/common/FilterTabs";
import SalaryMonthTable from "@/components/salary/SalaryMonthTable";
import PartnerPayoutTable from "@/components/salary/PartnerPayoutTable";
import { monthLabel, addMonth } from "@/utils/format";
import { fmtMoneyUnit } from "@/utils/trips";
import type { SalaryRow } from "@/utils/salary";
import type { Driver, PartnerPayout, SalaryAdvance } from "@/types";
import Button from "@/components/common/Button";
import { Toolbar, SearchInput } from "@/components/common/ui";
import MonthNav from "@/components/common/MonthNav";
import { usePermissions } from "@/states/permissions/PermissionsProvider";

function Tile({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "amber" | "emerald" }) {
  const color = tone === "amber" ? "text-signal" : tone === "emerald" ? "text-emerald-600" : "text-ink";
  return (
    <div className="min-w-0 rounded-2xl border border-hairline bg-surface p-4 shadow-card sm:p-5">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className={`mt-3 whitespace-nowrap text-lg font-bold leading-none tracking-tight tabular-nums sm:text-2xl ${color}`}>{value}</div>
    </div>
  );
}

export default function SalaryScreen({
  rows,
  payouts,
  advances,
  drivers,
  monthKey,
  isManager,
  payoutTotal,
}: {
  rows: SalaryRow[];
  payouts: PartnerPayout[];
  advances: SalaryAdvance[];
  drivers: Driver[];
  monthKey: string;
  isManager: boolean;
  payoutTotal: number;
}) {
  const router = useRouter();
  const { canEdit } = usePermissions();
  const [isLockingAll, startLockAll] = useTransition();
  const [tab, setTab] = useState<"month" | "partner">("month");
  const [query, setQuery] = useState("");
  const [addingPartnerPayout, setAddingPartnerPayout] = useState(false);

  const hasUnlocked = rows.some((r) => !r.locked);

  function handleLockAll() {
    if (isLockingAll) return;
    if (!window.confirm("Chốt tất cả phiếu lương chưa chốt của tháng này?")) return;
    const fd = new FormData();
    fd.set("monthKey", monthKey);
    startLockAll(async () => {
      const r = await lockSalaryMonthAll(fd);
      if (r.ok) router.refresh();
    });
  }

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
        <MonthNav
          label={monthLabel(monthKey)}
          prevHref={`/luong?m=${addMonth(monthKey, -1)}`}
          nextHref={`/luong?m=${addMonth(monthKey, 1)}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isManager && <Tile label="Tổng lương tháng" value={fmtMoneyUnit(totalNet)} />}
        <Tile label="Lương ngày" value={fmtMoneyUnit(payoutTotal)} />
        {isManager && <Tile label="Đã trả" value={fmtMoneyUnit(paidTotal)} tone="emerald" />}
        {isManager && <Tile label="Còn phải trả" value={fmtMoneyUnit(owing)} tone={owing > 0 ? "amber" : "ink"} />}
      </div>

      <Toolbar>
        <FilterTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Chọn nhóm lương"
          options={[
            ["month", "Lương tháng"],
            ["partner", "Lương ngày"],
          ] as const}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Tìm tên nhân sự, chức vụ..." />
        {tab === "month" && canEdit && hasUnlocked && (
          <Button size="toolbar" variant="secondary" onClick={handleLockAll} disabled={isLockingAll}>
            {isLockingAll ? "Đang chốt…" : "Chốt tất cả"}
          </Button>
        )}
        {tab === "partner" && canEdit && (
          <Button size="toolbar" onClick={() => setAddingPartnerPayout(true)}>
            ＋ Thêm phiếu trả công
          </Button>
        )}
      </Toolbar>

      {tab === "month" ? (
        <div className="space-y-5">
          {isManager && (
            <SalaryGroup title="Văn phòng" count={officeRows.length}>
              <SalaryMonthTable rows={officeRows} advances={advances} monthKey={monthKey} query={query} />
            </SalaryGroup>
          )}
          <SalaryGroup title="Lái xe" count={driverRows.length}>
            <SalaryMonthTable rows={driverRows} advances={advances} monthKey={monthKey} query={query} />
          </SalaryGroup>
        </div>
      ) : (
        <PartnerPayoutTable
          payouts={payouts}
          drivers={drivers}
          monthKey={monthKey}
          adding={addingPartnerPayout}
          onAddingChange={setAddingPartnerPayout}
        />
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
