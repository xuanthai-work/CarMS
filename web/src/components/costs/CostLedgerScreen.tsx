"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import FilterTabs from "@/components/common/FilterTabs";
import MonthNav from "@/components/common/MonthNav";
import { SearchInput, Toolbar } from "@/components/common/ui";
import { COST_GROUPS, type CostGroup, type CostLedger } from "@/utils/costLedger";
import { addMonth, fmtDate, monthLabel } from "@/utils/format";
import { normalizeVn } from "@/utils/search";
import { fmtMoney, fmtMoneyUnit } from "@/utils/trips";

const GROUP_BADGE: Record<CostGroup, string> = {
  fuel: "bg-amber-100 text-amber-800",
  partner: "bg-blue-100 text-blue-700",
  toll: "bg-purple-100 text-purple-700",
  other: "bg-slate-100 text-slate-700",
  salary: "bg-emerald-100 text-emerald-700",
};

const GROUP_LABEL = Object.fromEntries(COST_GROUPS.map((g) => [g.value, g.label])) as Record<
  CostGroup,
  string
>;

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-5 shadow-card ${
        highlight ? "border-brand-200 bg-brand-50/40" : "border-hairline bg-surface"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div
        className={`mt-3 truncate text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl ${
          highlight ? "text-signal" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default function CostLedgerScreen({
  ledger,
  monthKey,
}: {
  ledger: CostLedger;
  monthKey: string;
}) {
  const [group, setGroup] = useState<"all" | CostGroup>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const nq = normalizeVn(q);
    return ledger.lines.filter((line) => {
      if (group !== "all" && line.group !== group) return false;
      if (nq && !normalizeVn(`${line.title} ${line.category}`).includes(nq)) return false;
      return true;
    });
  }, [ledger.lines, group, q]);

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, line) => sum + line.amount, 0),
    [filtered]
  );

  const filterOptions = useMemo(
    () =>
      [
        ["all", "Tất cả"] as const,
        ...COST_GROUPS.map((g) => [g.value, g.label] as const),
      ] as const,
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Chi phí vận hành
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Tổng chi phí</h1>
        </div>
        <MonthNav
          label={monthLabel(monthKey)}
          prevHref={`/tong-chi-phi?m=${addMonth(monthKey, -1)}`}
          nextHref={`/tong-chi-phi?m=${addMonth(monthKey, 1)}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tổng chi phí" value={fmtMoneyUnit(ledger.total)} highlight />
        {COST_GROUPS.map((g) => (
          <Stat key={g.value} label={g.label} value={fmtMoneyUnit(ledger.byGroup[g.value])} />
        ))}
      </div>

      <Toolbar>
        <FilterTabs
          value={group}
          onChange={setGroup}
          ariaLabel="Lọc theo nhóm chi phí"
          options={filterOptions}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm nội dung, phân loại…" />
      </Toolbar>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel">
        {ledger.lines.length === 0 ? (
          <div className="p-12 text-center text-muted">Tháng này chưa có khoản chi nào.</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted">Không tìm thấy khoản chi phù hợp.</div>
        ) : (
          <>
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-canvas/70">
                  <tr className="border-b border-hairline text-left text-xs font-bold uppercase tracking-[0.02em] text-muted">
                    <th className="whitespace-nowrap px-4 py-3.5">Ngày</th>
                    <th className="whitespace-nowrap px-4 py-3.5">Nhóm</th>
                    <th className="whitespace-nowrap px-4 py-3.5">Phân loại</th>
                    <th className="px-4 py-3.5">Nội dung</th>
                    <th className="whitespace-nowrap px-4 py-3.5 text-right">Số tiền</th>
                    <th className="whitespace-nowrap px-4 py-3.5">Trạng thái</th>
                    <th className="whitespace-nowrap px-4 py-3.5 text-right">Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((line) => (
                    <tr
                      key={line.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted tabular-nums">
                        {fmtDate(line.date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${GROUP_BADGE[line.group]}`}
                        >
                          {GROUP_LABEL[line.group]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">
                        {line.category}
                      </td>
                      <td className="max-w-[280px] truncate px-4 py-3.5 font-medium text-ink">
                        {line.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                        {fmtMoney(line.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        {line.paid === true ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Đã chi
                          </span>
                        ) : line.paid === false ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            Chưa chi
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <Link
                          href={line.href}
                          aria-label="Mở màn nguồn"
                          className="text-xs font-semibold text-brand-600 hover:underline"
                        >
                          Mở
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-hairline bg-canvas/50 px-4 py-3 text-sm text-muted">
              <span>
                Đang hiển thị <strong className="text-ink">{filtered.length}</strong> khoản ·{" "}
                <strong className="tabular-nums text-ink">{fmtMoneyUnit(filteredTotal)}</strong>
              </span>
              <span className="tabular-nums">
                Tổng tháng: <strong className="text-ink">{fmtMoneyUnit(ledger.total)}</strong>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
