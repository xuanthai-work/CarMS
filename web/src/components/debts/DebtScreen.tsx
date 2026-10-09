"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/common/Modal";
import FilterTabs from "@/components/common/FilterTabs";
import DebtPayModal from "@/components/debts/DebtPayModal";
import { addMonth, fmtDate, monthLabel } from "@/utils/format";
import { normalizeVn } from "@/utils/search";
import { fmtMoney, fmtMoneyUnit } from "@/utils/trips";
import { Toolbar, SearchInput } from "@/components/common/ui";
import MonthNav from "@/components/common/MonthNav";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { PartnerDebt } from "@/types";

const DebtColgroup = () => (
  <colgroup>
    <col style={{ width: "11%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "16%" }} />
    <col style={{ width: "18%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "11%" }} />
    <col style={{ width: "12%" }} />
    <col style={{ width: "8%" }} />
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
    <div className={`rounded-2xl border border-hairline bg-surface p-5 shadow-card ${tones[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
      <div className="mt-3 text-2xl font-bold leading-none tracking-tight tabular-nums">{value}</div>
    </div>
  );
}

export default function DebtScreen({
  debts,
  monthKey,
  viewAll,
}: {
  debts: PartnerDebt[];
  monthKey: string;
  viewAll: boolean;
}) {
  const { canEdit } = usePermissions();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [modal, setModal] = useState<{ id: string; mode: "pay" | "edit" } | null>(null);

  const nq = normalizeVn(q);

  const rows = useMemo(() => {
    return debts.filter((d) => {
      if (statusFilter !== "all" && d.paymentStatus !== statusFilter) return false;
      if (!nq) return true;
      const route = [d.trip?.outboundFrom, d.trip?.outboundTo].filter(Boolean).join(" ");
      return [d.partnerName, d.trip?.customerName, route].some((v) =>
        normalizeVn(v ?? "").includes(nq),
      );
    });
  }, [debts, nq, statusFilter]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.total += row.amount;
        if (row.paymentStatus === "paid") acc.paid += row.amount;
        else {
          acc.unpaid += row.amount;
          acc.unpaidCount += 1;
        }
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0, unpaidCount: 0 },
    );
  }, [rows]);

  function moveMonth(delta: number) {
    router.push(`/cong-no?m=${addMonth(monthKey, delta)}`);
  }

  function toggleViewAll() {
    router.push(viewAll ? `/cong-no?m=${monthKey}` : "/cong-no?view=all");
  }

  const editing = modal ? debts.find((d) => d.id === modal.id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Theo dõi tiền thuê đối tác
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Công nợ</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={toggleViewAll}
            className={`h-9 rounded-xl border px-3.5 text-sm font-semibold shadow-sm transition ${
              viewAll
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-hairline bg-surface text-muted hover:border-slate-400"
            }`}
          >
            {viewAll ? "● Tất cả nợ tồn đọng" : "Tất cả nợ tồn đọng"}
          </button>
          {!viewAll && (
            <MonthNav
              label={monthLabel(monthKey)}
              onPrev={() => moveMonth(-1)}
              onNext={() => moveMonth(1)}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tổng tiền thuê" value={fmtMoneyUnit(summary.total)} />
        <Stat label="Đã thanh toán" value={fmtMoneyUnit(summary.paid)} tone="emerald" />
        <Stat label="Còn nợ đối tác" value={fmtMoneyUnit(summary.unpaid)} tone="amber" />
        <Stat label="Cuốc chưa thanh toán" value={String(summary.unpaidCount)} tone="amber" />
      </div>

      <Toolbar>
        <FilterTabs
          value={statusFilter}
          onChange={setStatusFilter}
          ariaLabel="Lọc trạng thái công nợ"
          options={
            [
              ["all", "Tất cả"],
              ["unpaid", "Chưa trả"],
              ["paid", "Đã trả"],
            ] as const
          }
        />
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Tìm biển số đối tác, khách hàng, lộ trình..."
        />
      </Toolbar>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            {viewAll ? "Không có khoản công nợ đối tác nào." : "Không có công nợ đối tác trong tháng này."}
          </div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[1040px] table-fixed text-[14px]">
              <DebtColgroup />
              <thead className="bg-canvas/70">
                <tr className="border-b border-hairline text-left text-[12px] font-bold uppercase tracking-[0.02em] text-muted">
                  <th className="sticky left-0 z-10 whitespace-nowrap bg-canvas px-4 py-3.5">Ngày chạy</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Xe đối tác</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Khách hàng</th>
                  <th className="px-4 py-3.5">Lộ trình</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right">Tiền thuê</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Trạng thái</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Ngày trả / Người trả</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const route =
                    [d.trip?.outboundFrom, d.trip?.outboundTo].filter(Boolean).join(" → ") || "—";
                  const paid = d.paymentStatus === "paid";
                  return (
                    <tr
                      key={d.id}
                      onClick={canEdit ? () => setModal({ id: d.id, mode: paid ? "edit" : "pay" }) : undefined}
                      className={
                        canEdit
                          ? "group cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                          : "border-b border-slate-100"
                      }
                    >
                      <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-4 py-4 text-[15px] text-slate-700 group-hover:bg-slate-50">
                        {fmtDate(d.workDate)}
                      </td>
                      <td className="truncate px-4 py-4 text-[15px] font-bold text-slate-900">
                        {d.partnerName || "—"}
                      </td>
                      <td className="truncate px-4 py-4 text-[15px] text-slate-700">
                        {d.trip?.customerName ?? "—"}
                        {d.trip?.customerPhone && (
                          <span className="block text-[12px] text-muted">{d.trip.customerPhone}</span>
                        )}
                      </td>
                      <td className="truncate px-4 py-4 text-[14px] text-slate-600" title={route}>
                        {route}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right text-[15px] font-bold text-slate-800">
                        {fmtMoney(d.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[12px] font-bold leading-none ${
                            paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {paid ? "Đã trả" : "Chưa trả"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-slate-600">
                        {paid ? (
                          <>
                            <span className="block tabular-nums">{fmtDate(d.paymentDate)}</span>
                            <span className="block text-[12px] text-muted">{d.payerName || "—"}</span>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {canEdit &&
                          (paid ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ id: d.id, mode: "edit" });
                              }}
                              className="rounded-lg border border-hairline px-3 py-1.5 text-[13px] font-semibold text-muted transition hover:bg-canvas"
                            >
                              Sửa
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ id: d.id, mode: "pay" });
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
                            >
                              Thanh toán
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && editing && (
        <Modal
          title={modal.mode === "pay" ? "Xác nhận thanh toán" : "Sửa thông tin công nợ"}
          onClose={() => setModal(null)}
          maxWidthClass="max-w-xl"
        >
          <DebtPayModal
            debt={editing}
            mode={modal.mode}
            onDone={() => {
              setModal(null);
              router.refresh();
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
