"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSalaryMonth, saveSalaryAdvance, deleteSalaryAdvance } from "@/api/salary";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import { DetailCell, PaymentStatusBadge, Field, FormError, inputCls } from "@/components/common/ui";
import MoneyInput from "@/components/common/MoneyInput";
import DatePicker from "@/components/common/DatePicker";
import FuelPaymentStatusSelect from "@/components/fuel/FuelPaymentStatusSelect";
import { fmtMoney } from "@/utils/trips";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import { fmtDate, monthKeyOf, todayStr } from "@/utils/format";
import { normalizeVn } from "@/utils/search";
import type { SalaryRow } from "@/utils/salary";
import type { SalaryAdvance } from "@/types";

function SalaryEditForm({
  row,
  advances,
  monthKey,
  onDone,
  onCancel,
}: {
  row: SalaryRow;
  advances: SalaryAdvance[];
  monthKey: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const formId = "salary-edit-form";
  const [isPending, start] = useTransition();
  const [isAdvPending, startAdv] = useTransition();
  const [paidDate, setPaidDate] = useState(row.paidDate ?? "");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(row.paid ? "paid" : "unpaid");
  const [err, setErr] = useState<string | null>(null);
  const [advErr, setAdvErr] = useState<string | null>(null);
  const today = todayStr();
  const [advDate, setAdvDate] = useState(
    monthKeyOf(today) === monthKey ? today : `${monthKey}-01`
  );
  const [advFormKey, setAdvFormKey] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    if (paymentStatus === "paid" && !paidDate) return setErr("Vui lòng chọn ngày trả lương.");
    const fd = new FormData(e.currentTarget);
    setErr(null);
    start(async () => {
      const r = await saveSalaryMonth(fd); // form đã có paymentStatus + paidDate → 1 lần ghi
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      onDone();
    });
  }

  function handleAddAdvance(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isAdvPending) return;
    if (!advDate) return setAdvErr("Vui lòng chọn ngày ứng.");
    const fd = new FormData(e.currentTarget);
    const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
    if (!amt || Number(amt) <= 0) return setAdvErr("Vui lòng nhập số tiền.");
    setAdvErr(null);
    startAdv(async () => {
      const r = await saveSalaryAdvance(fd);
      if (!r.ok) {
        setAdvErr(r.error);
        return;
      }
      setAdvFormKey((k) => k + 1);
      router.refresh();
    });
  }

  function handleDeleteAdvance(id: string) {
    if (isAdvPending) return;
    const fd = new FormData();
    fd.set("id", id);
    setAdvErr(null);
    startAdv(async () => {
      const r = await deleteSalaryAdvance(fd);
      if (!r.ok) {
        setAdvErr(r.error);
        return;
      }
      router.refresh();
    });
  }

  const advTotal = advances.reduce((s, a) => s + a.amount, 0);

  return (
    <SideDrawer
      title={`Sửa lương — ${row.name}`}
      onClose={onCancel}
      footer={
        <Button type="submit" form={formId} disabled={isPending}>
          {isPending ? "Đang lưu…" : "Lưu"}
        </Button>
      }
    >
      <FormError message={err} />
      <form
        id={formId}
        noValidate
        onSubmit={handleSubmit}
        onInput={() => err && setErr(null)}
        className="space-y-3"
      >
        <input type="hidden" name="personType" value={row.personType} />
        <input type="hidden" name="personId" value={row.personId} />
        <input type="hidden" name="monthKey" value={monthKey} />
        {(row.workDays < 25 || row.earned !== row.baseSalary) && (
          <div className="rounded-xl border border-hairline bg-canvas/60 px-3 py-2 text-xs text-muted tabular-nums">
            Công tháng: <strong className="text-ink">{Math.min(25, row.workDays)}/25</strong> · Lương theo công:{" "}
            <strong className="text-ink">{fmtMoney(row.earned)}</strong>
          </div>
        )}
        <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2">
          <DetailCell>
            <Field label="Thưởng / phụ cấp (cộng)">
              <MoneyInput name="additions" defaultValue={row.additions || null} placeholder="0" />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Khấu trừ khác (trừ)">
              <MoneyInput name="deductions" defaultValue={row.deductions || null} placeholder="0" />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Ngày trả lương">
              <DatePicker name="paidDate" value={paidDate} onChange={setPaidDate} />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Trạng thái">
              <FuelPaymentStatusSelect name="paymentStatus" value={paymentStatus} onChange={setPaymentStatus} />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Ghi chú"><input name="note" defaultValue={row.note} className={inputCls} /></Field>
          </DetailCell>
        </div>
      </form>

      <div className="mt-5 space-y-3 border-t border-hairline pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-ink">Tạm ứng trong tháng</h3>
          <span className="text-sm font-semibold text-rose-600 tabular-nums">
            {fmtMoney(advTotal)}
          </span>
        </div>

        {advances.length > 0 ? (
          <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-canvas/40">
            {advances.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted tabular-nums">
                      {fmtDate(a.date)}
                    </span>
                    <span className="font-semibold text-ink tabular-nums">
                      {fmtMoney(a.amount)}
                    </span>
                  </div>
                  {a.note && <div className="truncate text-xs text-muted">{a.note}</div>}
                </div>
                <button
                  type="button"
                  disabled={isAdvPending}
                  onClick={() => handleDeleteAdvance(a.id)}
                  aria-label={`Xóa tạm ứng ${fmtMoney(a.amount)}`}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">Chưa có lần tạm ứng nào trong tháng.</p>
        )}

        <FormError message={advErr} />
        <form
          noValidate
          onSubmit={handleAddAdvance}
          onInput={() => advErr && setAdvErr(null)}
          className="space-y-2 rounded-2xl border border-hairline bg-canvas/60 p-2.5"
        >
          <input type="hidden" name="personType" value={row.personType} />
          <input type="hidden" name="personId" value={row.personId} />
          <DetailCell>
            <Field label="Ngày ứng">
              <DatePicker name="date" value={advDate} onChange={setAdvDate} />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Số tiền">
              <MoneyInput key={advFormKey} name="amount" placeholder="0" />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Ghi chú">
              <input key={`note-${advFormKey}`} name="note" placeholder="Ghi chú (tùy chọn)" className={inputCls} />
            </Field>
          </DetailCell>
          <div className="flex justify-end pt-1">
            <Button type="submit" variant="secondary" disabled={isAdvPending}>
              {isAdvPending ? "Đang thêm…" : "Thêm tạm ứng"}
            </Button>
          </div>
        </form>
      </div>
    </SideDrawer>
  );
}

export default function SalaryMonthTable({
  rows,
  advances,
  monthKey,
  query,
}: {
  rows: SalaryRow[];
  advances: SalaryAdvance[];
  monthKey: string;
  query: string;
}) {
  const { canEdit } = usePermissions();
  const router = useRouter();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const keyOf = (r: SalaryRow) => `${r.personType}:${r.personId}`;
  const normalizedQuery = normalizeVn(query);
  const filteredRows = normalizedQuery
    ? rows.filter((row) =>
        normalizeVn(`${row.name} ${row.role}`).includes(normalizedQuery),
      )
    : rows;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface p-12 text-center text-muted shadow-sm">
        Chưa có ai ăn lương tháng.
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border border-hairline bg-surface shadow-panel">
      {filteredRows.length === 0 ? (
        <div className="p-12 text-center text-muted">
          Không tìm thấy nhân sự phù hợp.
        </div>
      ) : (
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[880px] table-fixed text-sm">
            <colgroup>
              <col style={{ width: "17%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead className="bg-canvas/70">
              <tr className="border-b border-hairline text-left text-xs font-semibold text-muted">
                <th className="sticky left-0 z-10 bg-canvas px-3 py-2.5">Nhân sự</th>
                <th className="px-3 py-2.5 text-right">Cơ bản</th>
                <th className="px-3 py-2.5 text-right">Điều chỉnh</th>
                <th className="px-3 py-2.5 text-right">Thực nhận</th>
                <th className="px-4 py-2.5">Ngày trả lương</th>
                <th className="px-4 py-2.5">Trạng thái</th>
                <th className="px-4 py-2.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={keyOf(r)}
                  onClick={canEdit ? () => setEditingKey(keyOf(r)) : undefined}
                  className={
                    canEdit
                      ? "group cursor-pointer border-b border-hairline last:border-0 transition hover:bg-canvas/60"
                      : "border-b border-hairline last:border-0"
                  }
                >
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2.5 group-hover:bg-canvas/60">
                    <div className="font-semibold text-ink">{r.name}</div>
                    <div className="text-xs text-muted">{r.role}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted tabular-nums">
                    <div>{fmtMoney(r.baseSalary)}</div>
                    {(r.workDays < 25 || r.earned !== r.baseSalary) && (
                      <div className="text-[11px] text-muted">
                        {Math.min(25, r.workDays)}/25 công · {fmtMoney(r.earned)}
                      </div>
                    )}
                  </td>
                  <td
                    className="px-3 py-2.5 text-right tabular-nums"
                    title={
                      r.advances > 0 || r.deductions > 0
                        ? `Tạm ứng ${fmtMoney(r.advances)} · Khấu trừ khác ${fmtMoney(r.deductions)}`
                        : undefined
                    }
                  >
                    {r.additions ? (
                      <span className="text-emerald-600">
                        +{fmtMoney(r.additions)}
                      </span>
                    ) : null}
                    {r.additions && r.deductions + r.advances > 0 ? " " : null}
                    {r.deductions + r.advances > 0 ? (
                      <span className="text-rose-600">
                        −{fmtMoney(r.deductions + r.advances)}
                      </span>
                    ) : null}
                    {!r.additions && r.deductions + r.advances === 0 ? (
                      <span className="text-slate-300">-</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-ink tabular-nums">
                    {fmtMoney(r.net)}
                  </td>
                  <td className="px-4 py-2.5 text-muted tabular-nums">
                    {fmtDate(r.paidDate)}
                  </td>
                  <td className="px-4 py-2.5">
                    <PaymentStatusBadge paid={r.paid} />
                  </td>
                  <td
                    className="max-w-0 truncate px-4 py-2.5 text-muted"
                    title={r.note || undefined}
                  >
                    {r.note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingKey &&
        (() => {
          const editing = filteredRows.find((r) => keyOf(r) === editingKey);
          if (!editing) return null;
          return (
            <SalaryEditForm
              row={editing}
              advances={advances.filter(
                (a) => a.personType === editing.personType && a.personId === editing.personId
              )}
              monthKey={monthKey}
              onDone={() => {
                setEditingKey(null);
                router.refresh();
              }}
              onCancel={() => setEditingKey(null)}
            />
          );
        })()}
    </div>
  );
}
