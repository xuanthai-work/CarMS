"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import FilterTabs from "@/components/common/FilterTabs";
import MonthNav from "@/components/common/MonthNav";
import { SearchInput, Toolbar } from "@/components/common/ui";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import FuelEntryForm from "@/components/fuel/FuelEntryEditorRow";
import VehicleFilterSelect from "@/components/fuel/VehicleFilterSelect";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { FuelEntry, OtherExpense, Vehicle } from "@/types";
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
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  tone?: "default" | "highlight" | "amber";
  hint?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-5 shadow-card ${
        tone === "highlight" ? "border-brand-200 bg-brand-50/40" : "border-hairline bg-surface"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div
        className={`mt-3 truncate text-xl font-bold leading-none tracking-tight tabular-nums sm:text-2xl ${
          tone === "default" ? "text-ink" : "text-signal"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-1.5 truncate text-[11px] text-muted">{hint}</div>}
    </div>
  );
}

export default function CostLedgerScreen({
  ledger,
  monthKey,
  fuel,
  expenses,
  vehicles,
  initialGroup,
}: {
  ledger: CostLedger;
  monthKey: string;
  fuel: FuelEntry[];
  expenses: OtherExpense[];
  vehicles: Vehicle[];
  initialGroup: "all" | CostGroup;
}) {
  const router = useRouter();
  const { canEdit } = usePermissions();
  const [group, setGroup] = useState<"all" | CostGroup>(initialGroup);
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [vehicleId, setVehicleId] = useState("all");
  const [q, setQ] = useState("");
  const [form, setForm] = useState<{ type: "fuel" | "expense"; id?: string } | null>(null);

  const filtered = useMemo(() => {
    const nq = normalizeVn(q);
    return ledger.lines.filter((line) => {
      if (group !== "all" && line.group !== group) return false;
      if (statusFilter === "paid" && line.paid !== true) return false;
      if (statusFilter === "unpaid" && line.paid !== false) return false;
      if (vehicleId !== "all" && (line.kind !== "fuel" || line.vehicleId !== vehicleId)) {
        return false;
      }
      if (nq && !normalizeVn(`${line.title} ${line.category}`).includes(nq)) return false;
      return true;
    });
  }, [ledger.lines, group, statusFilter, vehicleId, q]);

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

  function done() {
    setForm(null);
    router.refresh();
  }

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <Stat label="Tổng chi phí" value={fmtMoneyUnit(ledger.total)} tone="highlight" />
        <Stat
          label="Chưa chi"
          value={fmtMoneyUnit(ledger.unpaid)}
          tone="amber"
          hint="dầu & chi phí khác"
        />
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
        <FilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Lọc trạng thái thanh toán"
          options={
            [
              ["all", "Tất cả"],
              ["paid", "Đã chi"],
              ["unpaid", "Chưa chi"],
            ] as const
          }
        />
        <VehicleFilterSelect value={vehicleId} vehicles={vehicles} onChange={setVehicleId} />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm nội dung, phân loại…" />
        {canEdit && (
          <>
            <Button size="toolbar" onClick={() => setForm({ type: "fuel" })}>
              + Phiếu dầu
            </Button>
            <Button size="toolbar" onClick={() => setForm({ type: "expense" })}>
              + Chi phí khác
            </Button>
          </>
        )}
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
                  {filtered.map((line) => {
                    const editable = canEdit && (line.kind === "fuel" || line.kind === "expense");
                    return (
                      <tr
                        key={line.id}
                        onClick={
                          editable
                            ? () =>
                                setForm({
                                  type: line.kind as "fuel" | "expense",
                                  id: line.refId ?? undefined,
                                })
                            : undefined
                        }
                        className={
                          editable
                            ? "cursor-pointer border-b border-slate-100 last:border-0 transition hover:bg-slate-50"
                            : "border-b border-slate-100 last:border-0"
                        }
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
                          {line.kind === "trip" || line.kind === "salary" ? (
                            <Link
                              href={line.href}
                              aria-label="Mở màn nguồn"
                              className="text-xs font-semibold text-brand-600 hover:underline"
                            >
                              Mở
                            </Link>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {form?.type === "fuel" &&
        (() => {
          const entry = form.id ? fuel.find((f) => f.id === form.id) : undefined;
          if (form.id && !entry) return null;
          return (
            <FuelEntryForm
              entry={entry}
              vehicles={vehicles}
              defaultDate={entry ? entry.refuelDate : `${monthKey}-01`}
              onDone={done}
              onCancel={() => setForm(null)}
            />
          );
        })()}

      {form?.type === "expense" &&
        (() => {
          const expense = form.id ? expenses.find((e) => e.id === form.id) : undefined;
          if (form.id && !expense) return null;
          return (
            <ExpenseModal
              expense={expense}
              defaultDate={`${monthKey}-01`}
              onDone={done}
              onCancel={() => setForm(null)}
            />
          );
        })()}
    </div>
  );
}
