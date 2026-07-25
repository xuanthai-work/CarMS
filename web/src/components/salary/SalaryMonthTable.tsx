"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSalaryMonth } from "@/api/salary";
import { DetailCell, PaymentStatusBadge, Field, inputCls, CancelButton, SaveButton } from "@/components/common/ui";
import MoneyInput from "@/components/common/MoneyInput";
import DatePicker from "@/components/common/DatePicker";
import FuelPaymentStatusSelect from "@/components/fuel/FuelPaymentStatusSelect";
import Modal from "@/components/common/Modal";
import { fmtMoney } from "@/utils/trips";
import { fmtDate } from "@/utils/format";
import { normalizeVn } from "@/utils/search";
import type { SalaryRow } from "@/utils/salary";

function SalaryEditForm({
  row,
  monthKey,
  onDone,
  onCancel,
}: {
  row: SalaryRow;
  monthKey: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [isPending, start] = useTransition();
  const [paidDate, setPaidDate] = useState(row.paidDate ?? "");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(row.paid ? "paid" : "unpaid");

  function submit(fd: FormData) {
    start(async () => {
      await saveSalaryMonth(fd); // form đã có paymentStatus + paidDate → 1 lần ghi
      onDone();
    });
  }

  return (
    <form action={submit} className="space-y-3">
      <input type="hidden" name="personType" value={row.personType} />
      <input type="hidden" name="personId" value={row.personId} />
      <input type="hidden" name="monthKey" value={monthKey} />
      <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
        <DetailCell>
          <Field label="Thưởng / phụ cấp (cộng)">
            <MoneyInput name="additions" defaultValue={row.additions || null} placeholder="0" />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Tạm ứng / khấu trừ (trừ)">
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
        <DetailCell className="sm:col-span-2">
          <Field label="Ghi chú"><input name="note" defaultValue={row.note} className={inputCls} /></Field>
        </DetailCell>
      </div>
      <div className="flex justify-end gap-2 border-t border-hairline pt-3">
        <CancelButton onClick={onCancel} />
        <SaveButton>{isPending ? "Đang lưu…" : "Lưu"}</SaveButton>
      </div>
    </form>
  );
}

export default function SalaryMonthTable({
  rows,
  monthKey,
  query,
}: {
  rows: SalaryRow[];
  monthKey: string;
  query: string;
}) {
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
                  onClick={() => setEditingKey(keyOf(r))}
                  className="group cursor-pointer border-b border-hairline last:border-0 transition hover:bg-canvas/60"
                >
                  <td className="sticky left-0 z-10 bg-surface px-3 py-2.5 group-hover:bg-canvas/60">
                    <div className="font-semibold text-ink">{r.name}</div>
                    <div className="text-xs text-muted">{r.role}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted tabular-nums">
                    {fmtMoney(r.baseSalary)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {r.additions ? (
                      <span className="text-emerald-600">
                        +{fmtMoney(r.additions)}
                      </span>
                    ) : null}
                    {r.additions && r.deductions ? " " : null}
                    {r.deductions ? (
                      <span className="text-rose-600">
                        −{fmtMoney(r.deductions)}
                      </span>
                    ) : null}
                    {!r.additions && !r.deductions ? (
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
            <Modal
              title={`Sửa lương — ${editing.name}`}
              onClose={() => setEditingKey(null)}
              maxWidthClass="max-w-lg"
            >
              <SalaryEditForm
                row={editing}
                monthKey={monthKey}
                onDone={() => {
                  setEditingKey(null);
                  router.refresh();
                }}
                onCancel={() => setEditingKey(null)}
              />
            </Modal>
          );
        })()}
    </div>
  );
}
