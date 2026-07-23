"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSalaryMonth, setSalaryPaid } from "@/lib/actions";
import { Field } from "@/components/ui";
import MoneyInput from "@/components/MoneyInput";
import { fmtMoney } from "@/lib/trips";
import type { SalaryRow } from "@/lib/salary";

function EditorRow({
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
  async function submit(fd: FormData) {
    await saveSalaryMonth(fd);
    onDone();
  }
  return (
    <tr className="border-b border-brand-200 bg-brand-50/40 align-top">
      <td colSpan={5} className="p-3">
        <form action={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="personType" value={row.personType} />
          <input type="hidden" name="personId" value={row.personId} />
          <input type="hidden" name="monthKey" value={monthKey} />
          <Field label="Thưởng / phụ cấp (cộng)">
            <MoneyInput name="additions" defaultValue={row.additions || null} placeholder="0" />
          </Field>
          <Field label="Tạm ứng / khấu trừ (trừ)">
            <MoneyInput name="deductions" defaultValue={row.deductions || null} placeholder="0" />
          </Field>
          <Field label="Ghi chú">
            <input name="note" defaultValue={row.note} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </Field>
          <div className="flex items-end justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Hủy
            </button>
            <button type="submit" className="rounded-md bg-brand-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700">
              Lưu
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function PaidToggle({ row, monthKey }: { row: SalaryRow; monthKey: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function toggle() {
    const fd = new FormData();
    fd.set("personType", row.personType);
    fd.set("personId", row.personId);
    fd.set("monthKey", monthKey);
    fd.set("paid", String(!row.paid));
    start(async () => {
      await setSalaryPaid(fd);
      router.refresh();
    });
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={pending}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition disabled:opacity-50 ${
        row.paid ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      }`}
    >
      {row.paid ? "Đã trả" : "Chưa trả"}
    </button>
  );
}

export default function SalaryMonthTable({ rows, monthKey }: { rows: SalaryRow[]; monthKey: string }) {
  const router = useRouter();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const keyOf = (r: SalaryRow) => `${r.personType}:${r.personId}`;

  if (rows.length === 0) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 shadow-sm">Chưa có ai ăn lương tháng.</div>;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col style={{ width: "28%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
            <th className="px-3 py-2.5">Nhân sự</th>
            <th className="px-3 py-2.5 text-right">Cơ bản</th>
            <th className="px-3 py-2.5 text-right">Điều chỉnh</th>
            <th className="px-3 py-2.5 text-right">Thực nhận</th>
            <th className="px-3 py-2.5">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) =>
            editingKey === keyOf(r) ? (
              <EditorRow key={keyOf(r)} row={r} monthKey={monthKey} onDone={() => { setEditingKey(null); router.refresh(); }} onCancel={() => setEditingKey(null)} />
            ) : (
              <tr key={keyOf(r)} onClick={() => setEditingKey(keyOf(r))} className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <div className="font-medium text-slate-800">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.role}</div>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">{fmtMoney(r.baseSalary)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {r.additions ? <span className="text-emerald-600">+{fmtMoney(r.additions)}</span> : null}
                  {r.additions && r.deductions ? " " : null}
                  {r.deductions ? <span className="text-rose-600">−{fmtMoney(r.deductions)}</span> : null}
                  {!r.additions && !r.deductions ? <span className="text-slate-300">—</span> : null}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums">{fmtMoney(r.net)}</td>
                <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <PaidToggle row={r} monthKey={monthKey} />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
