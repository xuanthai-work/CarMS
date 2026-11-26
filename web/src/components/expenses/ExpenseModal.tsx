"use client";

import { useState, useTransition } from "react";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import DatePicker from "@/components/common/DatePicker";
import MoneyInput from "@/components/common/MoneyInput";
import SelectMenu from "@/components/common/SelectMenu";
import FuelPaymentStatusSelect from "@/components/fuel/FuelPaymentStatusSelect";
import { deleteOtherExpense, saveOtherExpense } from "@/api/expenses";
import { fmtDate } from "@/utils/format";
import { Field, FormError, inputCls } from "@/components/common/ui";
import { OTHER_EXPENSE_CATEGORIES, otherExpenseCategoryMeta } from "@/utils/expenses";
import type { OtherExpense } from "@/types";

const CATEGORY_OPTIONS = OTHER_EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }));

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
  const formId = "expense-form";
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    if (!date) return setErr("Vui lòng chọn ngày chi.");
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "").trim();
    if (!title) return setErr("Vui lòng nhập nội dung khoản chi.");
    const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
    if (!amt) return setErr("Vui lòng nhập số tiền.");
    setErr(null);
    startTransition(async () => {
      const r = await saveOtherExpense(fd);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      onDone();
    });
  }

  return (
    <SideDrawer
      title={expense ? "Sửa khoản chi" : "Thêm khoản chi"}
      onClose={onCancel}
      footer={
        expense ? (
          <div className="flex w-full items-center justify-between">
            <ConfirmDeleteButton
              action={deleteOtherExpense}
              id={expense.id}
              label={`khoản chi “${expense.title}” ngày ${fmtDate(expense.date)}`}
            />
            <Button type="submit" form={formId} disabled={isPending}>
              {isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={onCancel}>
              Hủy
            </Button>
            <Button type="submit" form={formId} disabled={isPending}>
              {isPending ? "Đang thêm…" : "Thêm khoản chi"}
            </Button>
          </>
        )
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
        {expense && <input type="hidden" name="id" value={expense.id} />}
        <div className="grid gap-3">
          <Field label="Ngày chi">
            <DatePicker name="date" value={date} onChange={setDate} />
          </Field>
          <Field label="Số tiền">
            <MoneyInput name="amount" defaultValue={expense?.amount ?? null} required placeholder="Số tiền" />
          </Field>
          <Field label="Nội dung chi">
            <input
              name="title"
              defaultValue={expense?.title ?? ""}
              placeholder="VD: Thay dầu, rửa xe, vé cầu đường…"
              className={inputCls}
            />
          </Field>
          <Field label="Phân loại">
            <SelectMenu
              name="category"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
              leadingDotClassName={otherExpenseCategoryMeta(category).swatch}
            />
          </Field>
          <Field label="Người chi">
            <input name="payerName" defaultValue={expense?.payerName ?? ""} placeholder="Người chi tiền" className={inputCls} />
          </Field>
          <Field label="Trạng thái">
            <FuelPaymentStatusSelect
              name="paymentStatus"
              value={paymentStatus}
              onChange={setPaymentStatus}
              paidLabel="Đã chi"
              unpaidLabel="Chưa chi"
            />
          </Field>
          <Field label="Ngày thanh toán">
            <DatePicker
              name="paymentDate"
              value={paymentStatus === "paid" ? paymentDate : ""}
              onChange={setPaymentDate}
              disabled={paymentStatus !== "paid"}
            />
          </Field>
          <Field label="Ghi chú">
            <input name="note" defaultValue={expense?.note ?? ""} placeholder="Ghi chú" className={inputCls} />
          </Field>
        </div>
      </form>
    </SideDrawer>
  );
}
