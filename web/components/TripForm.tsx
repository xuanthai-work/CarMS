"use client";

import { useState } from "react";
import { saveTrip, deleteTrip, quickCreateVehicle, quickCreateDriver } from "@/lib/actions";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { Field, inputCls } from "@/components/ui";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import Combobox from "@/components/Combobox";
import MoneyInput from "@/components/MoneyInput";
import SelectMenu from "@/components/SelectMenu";
import { tourTypeLabel, tourTypeFromDates, TRIP_STATUSES } from "@/lib/trips";
import { seatLabel, VEHICLE_TYPES } from "@/lib/vehicles";
import { fmtDateFull } from "@/lib/format";
import type { Trip, Vehicle, Driver, Leg } from "@/lib/types";

type Prefill = { vehicleId?: string; date?: string };


/** Nhóm ô nhập cho một lượt (đi/về), tiền tố "o" hoặc "r". */
function LegFields({
  prefix,
  leg,
  vehicles,
  drivers,
  date,
  onDateChange,
  vehId,
  setVehId,
  drvId,
  setDrvId,
}: {
  prefix: string;
  leg?: Leg;
  vehicles: Vehicle[];
  drivers: Driver[];
  date: string;
  onDateChange?: (v: string) => void;
  vehId: string;
  setVehId: (v: string) => void;
  drvId: string;
  setDrvId: (v: string) => void;
}) {
  // Xe đối tác/thuê ngoài thường đi kèm lái xe của họ → ẩn ô lái xe (không gửi driverId → lưu null).
  const isPartnerVeh = !!vehId && vehicles.find((v) => v.id === vehId)?.type === "partner";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Ngày">
        <DatePicker name={`${prefix}_date`} value={date} onChange={(v) => onDateChange?.(v)} disabled={!onDateChange} />
        {date && (
          <p className="mt-1 text-xs font-semibold text-brand-600">📅 {fmtDateFull(date)}</p>
        )}
      </Field>
      <Field label="Giờ đón">
        <TimePicker name={`${prefix}_time`} defaultValue={leg?.time ?? ""} />
      </Field>
      <Field label="Điểm đón">
        <input name={`${prefix}_from`} defaultValue={leg?.from ?? ""} placeholder="VD: Hà Nội" className={inputCls} />
      </Field>
      <Field label="Điểm đến">
        <input name={`${prefix}_to`} defaultValue={leg?.to ?? ""} placeholder="VD: Sapa" className={inputCls} />
      </Field>
      <Field label="Xe">
        <Combobox
          name={`${prefix}_vehicleId`}
          value={vehId}
          onChange={setVehId}
          options={[
            ...vehicles.map((v) => ({ id: v.id, label: v.plate, sub: seatLabel(v.seats) })),
            ...VEHICLE_TYPES.map((n) => ({ id: `seat:${n}`, label: `${n} chỗ`, sub: "chưa xếp xe (mẫu)" })),
          ]}
          placeholder="Tìm / chọn xe…"
          emptyText="Không thấy xe"
          onCreate={(t) => quickCreateVehicle(t)}
          createLabel={(t) => `+ Thêm xe “${t}”`}
        />
      </Field>
      <Field label="Lái xe">
        {isPartnerVeh ? (
          <div className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            🤝 Lái xe do đối tác cung cấp
          </div>
        ) : (
          <Combobox
            name={`${prefix}_driverId`}
            value={drvId}
            onChange={setDrvId}
            options={drivers.map((d) => ({ id: d.id, label: d.name }))}
            placeholder="Tìm / chọn lái xe…"
            emptyText="Không thấy lái xe"
            onCreate={(t) => quickCreateDriver(t)}
            createLabel={(t) => `+ Thêm lái xe “${t}”`}
          />
        )}
      </Field>
    </div>
  );
}

export default function TripForm({
  trip,
  prefill,
  vehicles,
  drivers,
  onDone,
  onCancel,
}: {
  trip?: Trip;
  prefill?: Prefill;
  vehicles: Vehicle[];
  drivers: Driver[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const formId = `trip-form-${trip?.id ?? "new"}`;
  const [hasReturn, setHasReturn] = useState<boolean>(trip ? !!trip.return : true);
  const [oDate, setODate] = useState<string>(trip?.outbound.date ?? prefill?.date ?? "");
  const [rDate, setRDate] = useState<string>(
    trip?.return?.date ?? trip?.outbound.date ?? prefill?.date ?? ""
  );
  // Ô "Xe" giữ id xe thật, hoặc "seat:<n>" nếu mới chọn placeholder số chỗ (chưa xếp xe).
  const initVeh = (leg?: Leg | null) => leg?.vehicleId ?? (leg?.seatClass ? `seat:${leg.seatClass}` : "");
  const [oVehId, setOVehId] = useState(initVeh(trip?.outbound) || prefill?.vehicleId || "");
  const [oDrvId, setODrvId] = useState(trip?.outbound.driverId ?? "");
  const [rVehId, setRVehId] = useState(initVeh(trip?.return));
  const [rDrvId, setRDrvId] = useState(trip?.return?.driverId ?? "");
  const [status, setStatus] = useState<string>(trip?.status ?? "pending");

  // Chỉ hiện ô "Tiền thuê đối tác" khi chuyến có dùng xe HOẶC lái xe của đối tác.
  const isPartnerVehId = (id: string) => !!id && vehicles.find((v) => v.id === id)?.type === "partner";
  const isPartnerDrvId = (id: string) => !!id && drivers.find((d) => d.id === id)?.type === "partner";
  const usesPartner =
    isPartnerVehId(oVehId) ||
    isPartnerDrvId(oDrvId) ||
    (hasReturn && (isPartnerVehId(rVehId) || isPartnerDrvId(rDrvId)));

  function changeODate(v: string) {
    setODate(v);
    // khi thêm mới: giữ ngày về hợp lệ (mặc định cùng ngày, không để trước ngày đi)
    if (!trip) setRDate((prev) => (prev && prev >= v ? prev : v));
  }

  // Loại tour suy ra từ ngày đi/về (+ có lượt về hay không) — thay cho việc chọn tay.
  const derivedType = tourTypeFromDates(oDate, hasReturn ? rDate : null);

  async function handleSave(fd: FormData) {
    await saveTrip(fd);
    onDone();
  }
  async function handleDelete(fd: FormData) {
    await deleteTrip(fd);
    onDone();
  }

  return (
    <div>
      <form id={formId} action={handleSave} className="space-y-4">
        {trip && <input type="hidden" name="id" value={trip.id} />}

        {/* Khách + tour */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tên Zalo khách *">
            <input name="customerName" required defaultValue={trip?.customerName ?? ""} placeholder="VD: Chị Lan" className={inputCls} />
          </Field>
          <Field label="SĐT khách">
            <input name="customerPhone" defaultValue={trip?.customerPhone ?? ""} placeholder="VD: 0987xxxxxx" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tiền chuyến">
              <MoneyInput name="price" defaultValue={trip?.price ?? null} placeholder="VD: 5.000.000" />
            </Field>
            <Field label="Đã cọc">
              <MoneyInput name="deposit" defaultValue={trip?.deposit ?? null} placeholder="0" />
            </Field>
          </div>
          <Field label="Trạng thái">
            <SelectMenu name="status" value={status} onChange={setStatus} options={TRIP_STATUSES} />
          </Field>
        </div>

        {/* Loại tour tự tính theo ngày đi/về */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Loại tour (tự tính):</span>
          <span className="rounded-md bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">
            {oDate ? tourTypeLabel(derivedType) : "—"}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Lượt đi */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <div className="mb-2 text-sm font-semibold text-blue-700">Lượt đi</div>
            <LegFields prefix="o" leg={trip?.outbound} vehicles={vehicles} drivers={drivers} date={oDate} onDateChange={changeODate} vehId={oVehId} setVehId={setOVehId} drvId={oDrvId} setDrvId={setODrvId} />
          </div>

          {/* Lượt về */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 flex flex-col">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <input type="checkbox" name="hasReturn" checked={hasReturn} onChange={(e) => setHasReturn(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Có lượt về
            </label>
            {hasReturn && (
              <>
                <LegFields prefix="r" leg={trip?.return ?? undefined} vehicles={vehicles} drivers={drivers} date={rDate} onDateChange={setRDate} vehId={rVehId} setVehId={setRVehId} drvId={rDrvId} setDrvId={setRDrvId} />
                <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                  <input type="checkbox" name="heldThroughTour" defaultChecked={trip?.heldThroughTour ?? false} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300" />
                  <span>Giữ xe suốt tour (xe bận cả các ngày giữa) — chỉ áp dụng khi lượt đi & về cùng một xe</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Chi phí (để tính lợi nhuận) — của cả chuyến */}
        <div>
          <div className="mb-2 text-sm font-semibold text-slate-700">Chi phí</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="VETC / Cầu đường">
              <MoneyInput name="tollCost" defaultValue={trip?.tollCost ?? null} placeholder="0" />
            </Field>
            {usesPartner && (
              <Field label="Tiền thuê đối tác">
                <MoneyInput name="partnerCost" defaultValue={trip?.partnerCost ?? null} placeholder="0" />
              </Field>
            )}
            <Field label="Chi phí khác">
              <MoneyInput name="otherCost" defaultValue={trip?.otherCost ?? null} placeholder="0" />
            </Field>
          </div>
        </div>

        <Field label="Ghi chú">
          <input name="note" defaultValue={trip?.note ?? ""} placeholder="Ghi chú thêm" className={inputCls} />
        </Field>
      </form>

      <div className="mt-4 flex items-center justify-between">
        {trip ? (
          <ConfirmDeleteButton action={handleDelete} id={trip.id} label={`chuyến của ${trip.customerName}`} />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            form={formId}
            className="rounded-md bg-brand-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {trip ? "Lưu" : "Thêm chuyến"}
          </button>
        </div>
      </div>
    </div>
  );
}
