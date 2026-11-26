"use client";

import { useState, useTransition } from "react";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import DatePicker from "@/components/common/DatePicker";
import FuelPaymentStatusSelect from "@/components/fuel/FuelPaymentStatusSelect";
import { updatePartnerDebt } from "@/api/debts";
import { Field, FormError, inputCls } from "@/components/common/ui";
import { fmtDate, todayStr } from "@/utils/format";
import { fmtMoney } from "@/utils/trips";
import type { PartnerDebt } from "@/types";

/**
 * Drawer cập nhật thông tin thanh toán tiền thuê đối tác.
 * Khởi tạo đúng trạng thái thanh toán hiện tại của bản ghi; cho phép đổi
 * trạng thái, ngày trả, người trả và ghi chú.
 */
export default function DebtPayModal({
  debt,
  onDone,
  onCancel,
}: {
  debt: PartnerDebt;
  onDone: () => void;
  onCancel: () => void;
}) {
  const formId = "debt-pay-form";
  const [isPending, startTransition] = useTransition();
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    debt.paymentStatus,
  );
  const [paymentDate, setPaymentDate] = useState(
    debt.paymentDate ?? todayStr(),
  );
  const [err, setErr] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    if (paymentStatus === "paid" && !paymentDate) return setErr("Vui lòng chọn ngày trả.");
    const fd = new FormData(e.currentTarget);
    setErr(null);
    startTransition(async () => {
      const r = await updatePartnerDebt(fd);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      onDone();
    });
  }

  return (
    <SideDrawer
      title="Cập nhật thanh toán công nợ"
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
        <input type="hidden" name="id" value={debt.id} />
        <div className="border-b border-hairline pb-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-ink">{debt.partnerName || "—"}</span>
            <span className="font-bold tabular-nums text-ink">{fmtMoney(debt.amount)}</span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {debt.trip?.customerName ?? "—"} · {fmtDate(debt.workDate)}
          </div>
        </div>
        <div className="grid gap-3">
          <Field label="Trạng thái">
            <FuelPaymentStatusSelect
              name="paymentStatus"
              value={paymentStatus}
              onChange={setPaymentStatus}
              paidLabel="Đã trả"
              unpaidLabel="Chưa trả"
            />
          </Field>
          <Field label="Ngày trả">
            <DatePicker
              name="paymentDate"
              value={paymentStatus === "paid" ? paymentDate : ""}
              onChange={setPaymentDate}
              disabled={paymentStatus !== "paid"}
            />
          </Field>
          <Field label="Người trả">
            <input name="payerName" defaultValue={debt.payerName ?? ""} placeholder="Người thanh toán" className={inputCls} />
          </Field>
          <Field label="Ghi chú">
            <input name="note" defaultValue={debt.note ?? ""} placeholder="Ghi chú" className={inputCls} />
          </Field>
        </div>
      </form>
    </SideDrawer>
  );
}
