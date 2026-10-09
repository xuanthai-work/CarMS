"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { dropdownMotion } from "@/utils/motion";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import FilterTabs from "@/components/common/FilterTabs";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import { useDismiss } from "@/hooks/common/useDismiss";
import { addMonth, fmtDate, monthLabel } from "@/utils/format";
import { normalizeVn } from "@/utils/search";
import { fmtMoney, fmtMoneyUnit } from "@/utils/trips";
import { OTHER_EXPENSE_CATEGORIES, otherExpenseCategoryMeta } from "@/utils/expenses";
import { Toolbar, SearchInput } from "@/components/common/ui";
import MonthNav from "@/components/common/MonthNav";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { OtherExpense } from "@/types";

const ExpenseColgroup = () => (
  <colgroup>
    <col style={{ width: "12%" }} />
    <col style={{ width: "25%" }} />
    <col style={{ width: "16%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "11%" }} />
  </colgroup>
);

function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "emerald" | "amber";
}) {
  const tones = {
    slate: "text-ink",
    emerald: "text-emerald-700",
    amber: "text-signal",
  } as const;
  return (
    <div
      className={`rounded-2xl border border-hairline bg-surface p-5 shadow-card ${tones[tone]}`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold leading-none tracking-tight tabular-nums">
        {value}
      </div>
    </div>
  );
}

function CategoryFilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useDismiss(open, ref, () => setOpen(false));
  const reduceMotion = useReducedMotion();
  const selectedLabel =
    value === "all"
      ? "Tất cả phân loại"
      : otherExpenseCategoryMeta(value).label;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex h-9 min-w-[168px] items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-medium text-ink shadow-sm transition ${
          open
            ? "border-brand-500 bg-white ring-1 ring-brand-500"
            : "border-hairline bg-surface hover:border-slate-400"
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className={`text-xs text-muted transition ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion(reduceMotion)}
            className="absolute left-0 top-full z-30 mt-2 max-h-72 min-w-full overflow-auto rounded-xl border border-hairline bg-surface p-1.5 shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                value === "all" ? "bg-brand-600 font-semibold text-white" : "text-ink hover:bg-canvas"
              }`}
            >
              Tất cả phân loại
            </button>
            {OTHER_EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  onChange(c.value);
                  setOpen(false);
                }}
                className={`mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  value === c.value ? "bg-brand-600 font-semibold text-white" : "text-ink hover:bg-canvas"
                }`}
              >
                <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${value === c.value ? "bg-white" : c.swatch}`} />
                {c.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ExpenseScreen({
  entries,
  monthKey,
}: {
  entries: OtherExpense[];
  monthKey: string;
}) {
  const { canEdit } = usePermissions();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const nq = normalizeVn(q);

  const rows = useMemo(() => {
    return entries.filter((entry) => {
      if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
      if (statusFilter !== "all" && entry.paymentStatus !== statusFilter) return false;
      if (!nq) return true;
      return [entry.title, entry.payerName, entry.note].some((v) =>
        normalizeVn(v).includes(nq),
      );
    });
  }, [entries, nq, statusFilter, categoryFilter]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += row.amount;
        acc.count += 1;
        if (row.paymentStatus === "paid") acc.paid += row.amount;
        else acc.unpaid += row.amount;
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0, count: 0 },
    );
  }, [rows]);

  function moveMonth(delta: number) {
    router.push(`/chi-phi-khac?m=${addMonth(monthKey, delta)}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Chi phí vận hành
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Chi phí khác
          </h1>
        </div>
        <MonthNav
          label={monthLabel(monthKey)}
          onPrev={() => moveMonth(-1)}
          onNext={() => moveMonth(1)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tổng chi phí" value={fmtMoneyUnit(summary.total)} />
        <Stat label="Đã chi" value={fmtMoneyUnit(summary.paid)} tone="emerald" />
        <Stat label="Chưa chi" value={fmtMoneyUnit(summary.unpaid)} tone="amber" />
        <Stat label="Số khoản" value={String(summary.count)} />
      </div>

      <Toolbar>
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
        <CategoryFilterSelect value={categoryFilter} onChange={setCategoryFilter} />
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm nội dung, người chi, ghi chú..."
        />
        {canEdit && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="h-9 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-brand-700 active:scale-[0.98]"
          >
            + Thêm khoản chi
          </button>
        )}
      </Toolbar>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel">
        {!adding && rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Không có khoản chi nào trong tháng này.
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[920px] table-fixed text-[14px]">
              <ExpenseColgroup />
              <thead className="bg-canvas/70">
                <tr className="border-b border-hairline text-left text-[12px] font-bold uppercase tracking-[0.02em] text-muted">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-canvas px-4 py-3.5">Ngày chi</th>
                  <th className="px-4 py-3.5">Nội dung</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Phân loại</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right">Số tiền</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Người chi</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => {
                  const meta = otherExpenseCategoryMeta(entry.category);
                  return (
                    <tr
                      key={entry.id}
                      onClick={canEdit ? () => setEditingId(entry.id) : undefined}
                      className={
                        canEdit
                          ? "group cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                          : "border-b border-slate-100"
                      }
                    >
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-4 py-4 text-[15px] text-slate-700 group-hover:bg-slate-50">
                        {fmtDate(entry.date)}
                      </td>
                      <td className="truncate px-4 py-4 text-[15px] font-semibold text-slate-900">
                        {entry.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-[15px] font-bold text-slate-800">
                        {fmtMoney(entry.amount)}
                      </td>
                      <td className="truncate px-4 py-4 text-[15px] text-slate-700">
                        {entry.payerName || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${
                            entry.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {entry.paymentStatus === "paid" ? "Đã chi" : "Chưa chi"}
                        </span>
                      </td>
                      <td className="truncate px-4 py-4 text-[14px] leading-relaxed text-slate-700">
                        {entry.note || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(adding || editingId) &&
        (() => {
          const editing = editingId ? entries.find((e) => e.id === editingId) : undefined;
          if (editingId && !editing) return null;
          return (
            <Modal
              title={editing ? "Sửa khoản chi" : "Thêm khoản chi"}
              onClose={() => {
                setAdding(false);
                setEditingId(null);
              }}
              maxWidthClass="max-w-2xl"
            >
              <ExpenseModal
                expense={editing}
                defaultDate={`${monthKey}-01`}
                onDone={() => {
                  setAdding(false);
                  setEditingId(null);
                  router.refresh();
                }}
                onCancel={() => {
                  setAdding(false);
                  setEditingId(null);
                }}
              />
            </Modal>
          );
        })()}
    </div>
  );
}
