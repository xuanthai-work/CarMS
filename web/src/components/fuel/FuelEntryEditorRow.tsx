"use client";

import { useMemo, useState, useTransition } from "react";
import Button from "@/components/common/Button";
import SideDrawer from "@/components/common/SideDrawer";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import DatePicker from "@/components/common/DatePicker";
import Combobox from "@/components/common/Combobox";
import MoneyInput from "@/components/common/MoneyInput";
import FuelPaymentStatusSelect from "@/components/fuel/FuelPaymentStatusSelect";
import { deleteFuelEntry, saveFuelEntry } from "@/api/fuel";
import { companyVehicles } from "@/utils/vehicles";
import { fmtDate } from "@/utils/format";
import { DetailCell, Field, FormError, inputCls } from "@/components/common/ui";
import type { FuelEntry, Vehicle } from "@/types";

/** Bề rộng cột bảng tiền dầu — DÙNG CHUNG cho header (FuelScreen). Giữ nguyên. */
export const FuelColgroup = () => (
  <colgroup>
    <col style={{ width: "14%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "11%" }} />
    <col style={{ width: "15%" }} />
    <col style={{ width: "15%" }} />
    <col style={{ width: "13%" }} />
    <col style={{ width: "19%" }} />
  </colgroup>
);

export default function FuelEntryForm({
  entry,
  vehicles,
  defaultDate,
  onDone,
  onCancel,
}: {
  entry?: FuelEntry;
  vehicles: Vehicle[];
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const formId = "fuel-entry-form";
  const [isPending, startTransition] = useTransition();
  const [vehicleId, setVehicleId] = useState(entry?.vehicleId ?? "");
  const [refuelDate, setRefuelDate] = useState(entry?.refuelDate ?? defaultDate);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">(
    entry?.paymentStatus ?? "paid"
  );
  const [paymentDate, setPaymentDate] = useState(entry?.paymentDate ?? entry?.refuelDate ?? defaultDate);
  const [err, setErr] = useState<string | null>(null);
  const vehicleOptions = useMemo(
    () => companyVehicles(vehicles).map((v) => ({ id: v.id, label: v.plate })),
    [vehicles],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isPending) return;
    if (!vehicleId) return setErr("Vui lòng chọn xe.");
    const fd = new FormData(e.currentTarget);
    const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
    if (!amt) return setErr("Vui lòng nhập số tiền.");
    setErr(null);
    startTransition(async () => {
      const r = await saveFuelEntry(fd);
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      onDone();
    });
  }

  return (
    <SideDrawer
      title={entry ? "Sửa phiếu dầu" : "Thêm phiếu dầu"}
      onClose={onCancel}
      footer={
        entry ? (
          <div className="flex w-full items-center justify-between">
            <ConfirmDeleteButton
              action={deleteFuelEntry}
              id={entry.id}
              label={`phiếu dầu ngày ${fmtDate(entry.refuelDate)}`}
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
              {isPending ? "Đang thêm…" : "Thêm phiếu dầu"}
            </Button>
          </>
        )
      }
    >
      <FormError message={err} />
      <form
        id={formId}
        onSubmit={handleSubmit}
        onInput={() => err && setErr(null)}
        className="space-y-3"
      >
        {entry && <input type="hidden" name="id" value={entry.id} />}
        <div className="grid gap-2 rounded-2xl border border-hairline bg-canvas/60 p-2">
          <DetailCell>
            <Field label="Ngày đổ">
              <DatePicker name="refuelDate" value={refuelDate} onChange={setRefuelDate} />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Xe">
              <Combobox
                name="vehicleId"
                value={vehicleId}
                onChange={setVehicleId}
                options={vehicleOptions}
                placeholder="Chọn xe…"
                emptyText="Không thấy xe"
              />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Số tiền">
              <MoneyInput name="amount" defaultValue={entry?.amount ?? null} required placeholder="Số tiền" />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Người đổ">
              <input name="payerName" defaultValue={entry?.payerName ?? ""} placeholder="Người đổ" className={inputCls} />
            </Field>
          </DetailCell>
          <DetailCell>
            <Field label="Trạng thái">
              <FuelPaymentStatusSelect name="paymentStatus" value={paymentStatus} onChange={setPaymentStatus} />
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
          <DetailCell>
            <Field label="Ghi chú">
              <input name="note" defaultValue={entry?.note ?? ""} placeholder="Ghi chú" className={inputCls} />
            </Field>
          </DetailCell>
        </div>
      </form>
    </SideDrawer>
  );
}
