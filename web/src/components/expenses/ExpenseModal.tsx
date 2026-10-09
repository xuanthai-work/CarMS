"use client";

import { useState, useTransition } from "react";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import DatePicker from "@/components/common/DatePicker";
import MoneyInput from "@/components/common/MoneyInput";
import SelectMenu from "@/components/common/SelectMenu";
import { deleteOtherExpense, saveOtherExpense } from "@/api/expenses";
import { fmtDate } from "@/utils/format";
import { DetailCell, Field, inputCls } from "@/components/common/ui";
import { OTHER_EXPENSE_CATEGORIES, otherExpenseCategoryMeta } from "@/utils/expenses";
import type { OtherExpense } from "@/types";

const CATEGORY_OPTIONS = OTHER_EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
const PAYMENT_OPTIONS = [
  { value: "unpaid", label: "Chưa chi" },
  { value: "paid", label: "Đã chi" },
] as const;

export default function ExpenseModal({
  expense,
  defaultDate,
  onDone,
  onCancel,
}: {
  expense?: OtherExpense;
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(expense?.date ?? defaultDate);
  const [category, setCategory] = useState<string>(expense?.category ?? "other");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    expense?.paymentStatus ?? "unpaid",
  );
  const [paymentDate, setPaymentDate] = useState(
    expense?.paymentDate ?? expense?.date ?? defaultDate,
  );
  const [err, setErr] = useState<string | null>(null);

  function submitForm(fd: FormData) {
    if (!date) return setErr("Vui lòng chọn ngày chi.");
    const title = String(fd.get("title") || "").trim();
    if (!title) return setErr("Vui lòng nhập nội dung khoản chi.");
    const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
    if (!amt) return setErr("Vui lòng nhập số tiền.");
    setErr(null);
    startTransition(async () => {
      await saveOtherExpense(fd);
      onDone();
    });
  }

  return (
    <form action={submitForm} className="space-y-3">
      {expense && <input type="hidden" name="id" value={expense.id} />}
      <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
        <DetailCell>
          <Field label="Ngày chi">
            <DatePicker name="date" value={date} onChange={setDate} />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Số tiền">
            <MoneyInput name="amount" defaultValue={expense?.amount ?? null} required placeholder="Số tiền" />
          </Field>
        </DetailCell>
        <DetailCell className="sm:col-span-2">
          <Field label="Nội dung chi">
            <input
              name="title"
              defaultValue={expense?.title ?? ""}
              placeholder="VD: Thay dầu, rửa xe, vé cầu đường…"
              className={inputCls}
            />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Phân loại">
            <SelectMenu
              name="category"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
              leadingDotClassName={otherExpenseCategoryMeta(category).swatch}
            />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Người chi">
            <input name="payerName" defaultValue={expense?.payerName ?? ""} placeholder="Người chi tiền" className={inputCls} />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Trạng thái">
            <SelectMenu
              name="paymentStatus"
              value={paymentStatus}
              onChange={(v) => setPaymentStatus(v as "paid" | "unpaid")}
              options={PAYMENT_OPTIONS}
            />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Ngày thanh toán">
            <DatePicker
              name="paymentDate"
              value={paymentStatus === "paid" ? paymentDate : ""}
              onChange={setPaymentDate}
              disabled={paymentStatus !== "paid"}
            />
          </Field>
        </DetailCell>
        <DetailCell className="sm:col-span-2">
          <Field label="Ghi chú">
            <input name="note" defaultValue={expense?.note ?? ""} placeholder="Ghi chú" className={inputCls} />
          </Field>
        </DetailCell>
      </div>
      {err && <div className="text-sm font-medium text-rose-600">{err}</div>}
      <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
        {expense ? (
          <ConfirmDeleteButton
            action={deleteOtherExpense}
            id={expense.id}
            label={`khoản chi “${expense.title}” ngày ${fmtDate(expense.date)}`}
          />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-hairline px-4 py-2 text-sm font-medium text-muted hover:bg-canvas"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
          >
            {isPending
              ? expense
                ? "Đang lưu…"
                : "Đang thêm…"
              : expense
              ? "Lưu"
              : "Thêm khoản chi"}
          </button>
        </div>
      </div>
    </form>
  );
}
