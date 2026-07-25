"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { savePartnerPayout, deletePartnerPayout } from "@/api/salary";
import { DetailCell, PaymentStatusBadge, Field, inputCls, CancelButton, SaveButton } from "@/components/common/ui";
import SelectMenu from "@/components/common/SelectMenu";
import DatePicker from "@/components/common/DatePicker";
import MoneyInput from "@/components/common/MoneyInput";
import FuelPaymentStatusSelect from "@/components/fuel/FuelPaymentStatusSelect";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import Modal from "@/components/common/Modal";
import { useFormState } from "@/hooks/common/useFormState";
import { fmtDate } from "@/utils/format";
import { fmtMoney } from "@/utils/trips";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import type { Driver, PartnerPayout } from "@/types";

function PartnerPayoutForm({
  payout,
  drivers,
  defaultDate,
  onDone,
  onCancel,
}: {
  payout?: PartnerPayout;
  drivers: Driver[];
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { form, set } = useFormState(() => ({
    driverId: payout?.driverId ?? "",
    workDate: payout?.workDate ?? defaultDate,
    paymentStatus: payout?.paymentStatus ?? "unpaid",
  }));
  const options = drivers
    .filter((d) => d.type === "partner")
    .map((d) => ({ value: d.id, label: d.name }));

  async function submit(fd: FormData) {
    await savePartnerPayout(fd);
    onDone();
  }

  return (
    <form id={`pp-${payout?.id ?? "new"}`} action={submit} className="space-y-2">
      {payout && <input type="hidden" name="id" value={payout.id} />}
      <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2 sm:grid-cols-2">
        <DetailCell><Field label="Lái xe đối tác"><SelectMenu name="driverId" value={form.driverId} onChange={set("driverId")} options={options} placeholder="Chọn lái xe" /></Field></DetailCell>
        <DetailCell><Field label="Ngày làm"><DatePicker name="workDate" value={form.workDate} onChange={set("workDate")} /></Field></DetailCell>
        <DetailCell><Field label="Số tiền"><MoneyInput name="amount" defaultValue={payout?.amount ?? null} placeholder="VD: 800.000" /></Field></DetailCell>
        <DetailCell><Field label="Trạng thái"><FuelPaymentStatusSelect name="paymentStatus" value={form.paymentStatus} onChange={set("paymentStatus")} /></Field></DetailCell>
        <DetailCell><Field label="Người trả"><input name="payerName" defaultValue={payout?.payerName ?? ""} className={inputCls} /></Field></DetailCell>
        <DetailCell><Field label="Ghi chú"><input name="note" defaultValue={payout?.note ?? ""} className={inputCls} /></Field></DetailCell>
      </div>
      <div className="flex items-center justify-between border-t border-hairline pt-3">
        {payout ? (
          <ConfirmDeleteButton action={deletePartnerPayout} id={payout.id} label={`phiếu của lái xe`} />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <CancelButton onClick={onCancel} />
          <SaveButton />
        </div>
      </div>
    </form>
  );
}

export default function PartnerPayoutTable({
  payouts,
  drivers,
  monthKey,
  adding,
  onAddingChange,
}: {
  payouts: PartnerPayout[];
  drivers: Driver[];
  monthKey: string;
  adding: boolean;
  onAddingChange: (adding: boolean) => void;
}) {
  const { canEdit } = usePermissions();
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? "—";
  const defaultDate = `${monthKey}-01`;

  function done() {
    onAddingChange(false);
    setEditingId(null);
    router.refresh();
  }

  function close() {
    onAddingChange(false);
    setEditingId(null);
  } // đóng, KHÔNG refresh (huỷ/nền)

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl border border-hairline bg-surface shadow-panel">
        {!adding && payouts.length === 0 ? (
          <div className="p-12 text-center text-muted">Chưa có phiếu trả công đối tác trong tháng này.</div>
        ) : (
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[720px] table-fixed text-sm">
              <colgroup>
                <col style={{ width: "22%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead className="bg-canvas/70">
                <tr className="border-b border-hairline text-left text-xs font-semibold text-muted">
                  <th className="sticky left-0 z-10 bg-canvas px-3 py-2.5">Lái xe</th>
                  <th className="px-3 py-2.5">Ngày làm</th>
                  <th className="px-3 py-2.5 text-right">Số tiền</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-3 py-2.5">Người trả</th>
                  <th className="px-3 py-2.5">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={canEdit ? () => setEditingId(p.id) : undefined}
                    className={
                      canEdit
                        ? "group cursor-pointer border-b border-hairline last:border-0 transition hover:bg-canvas/60"
                        : "border-b border-hairline last:border-0"
                    }
                  >
                    <td className="sticky left-0 z-10 bg-surface px-3 py-2.5 font-semibold text-ink group-hover:bg-canvas/60">{driverName(p.driverId)}</td>
                    <td className="px-3 py-2.5 text-muted tabular-nums">{fmtDate(p.workDate)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-ink tabular-nums">{fmtMoney(p.amount)}</td>
                    <td className="px-3 py-2.5">
                      <PaymentStatusBadge paid={p.paymentStatus === "paid"} />
                    </td>
                    <td className="px-3 py-2.5 text-muted">{p.payerName || "-"}</td>
                    <td className="px-3 py-2.5 text-muted">{p.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(adding || editingId) && (() => {
        const editing = editingId ? payouts.find((p) => p.id === editingId) : undefined;
        if (editingId && !editing) return null; // bản ghi đã biến mất (VD sau khi xoá) → ẩn modal thay vì lật sang "Thêm"
        return (
          <Modal title={editing ? "Sửa phiếu trả công" : "Thêm phiếu trả công"} onClose={close} maxWidthClass="max-w-xl">
            <PartnerPayoutForm payout={editing} drivers={drivers} defaultDate={defaultDate} onDone={done} onCancel={close} />
          </Modal>
        );
      })()}
    </div>
  );
}
