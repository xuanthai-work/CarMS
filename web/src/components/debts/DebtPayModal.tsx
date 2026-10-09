"use client";

import { useState, useTransition } from "react";
import DatePicker from "@/components/common/DatePicker";
import SelectMenu from "@/components/common/SelectMenu";
import { updatePartnerDebt } from "@/api/debts";
import { DetailCell, Field, inputCls } from "@/components/common/ui";
import { fmtDate, todayStr } from "@/utils/format";
import { fmtMoney } from "@/utils/trips";
import type { PartnerDebt } from "@/types";

const PAYMENT_OPTIONS = [
  { value: "paid", label: "Đã trả" },
  { value: "unpaid", label: "Chưa trả" },
] as const;

/**
 * Modal thanh toán nhanh / chỉnh sửa thông tin trả tiền thuê đối tác.
 * - mode="pay": mặc định Đã trả + ngày hôm nay, điền người trả rồi lưu 1 chạm.
 * - mode="edit": giữ nguyên trạng thái hiện tại, cho phép sửa ngày/người trả/ghi chú
 *   và hoàn tác về "Chưa trả".
 */
export default function DebtPayModal({
  debt,
  mode = "pay",
  onDone,
  onCancel,
}: {
  debt: PartnerDebt;
  mode?: "pay" | "edit";
  onDone: () => void;
  onCancel: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    mode === "pay" ? "paid" : debt.paymentStatus,
  );
  const [paymentDate, setPaymentDate] = useState(
    debt.paymentDate ?? todayStr(),
  );

  function submitForm(fd: FormData) {
    startTransition(async () => {
      await updatePartnerDebt(fd);
      onDone();
    });
  }

  return (
    <form action={submitForm} className="space-y-3">
      <input type="hidden" name="id" value={debt.id} />
      <div className="rounded-2xl border border-hairline bg-canvas/60 p-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-ink">{debt.partnerName || "—"}</span>
          <span className="font-bold tabular-nums text-ink">{fmtMoney(debt.amount)}</span>
        </div>
        <div className="mt-1 text-xs text-muted">
          {debt.trip?.customerName ?? "—"} · {fmtDate(debt.workDate)}
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
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
          <Field label="Ngày trả">
            <DatePicker
              name="paymentDate"
              value={paymentStatus === "paid" ? paymentDate : ""}
              onChange={setPaymentDate}
              disabled={paymentStatus !== "paid"}
            />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Người trả">
            <input name="payerName" defaultValue={debt.payerName ?? ""} placeholder="Người thanh toán" className={inputCls} />
          </Field>
        </DetailCell>
        <DetailCell>
          <Field label="Ghi chú">
            <input name="note" defaultValue={debt.note ?? ""} placeholder="Ghi chú" className={inputCls} />
          </Field>
        </DetailCell>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-hairline pt-3">
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
          {isPending ? "Đang lưu…" : mode === "pay" ? "Xác nhận thanh toán" : "Lưu"}
        </button>
      </div>
    </form>
  );
}
