"use client";

import { useState } from "react";
import { saveTrip, deleteTrip } from "@/lib/actions";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { Field, inputCls } from "@/components/ui";
import { TOUR_TYPES, defaultReturnDate } from "@/lib/trips";
import { seatLabel } from "@/lib/vehicles";
import { fmtDateFull } from "@/lib/format";
import type { Trip, Vehicle, Driver, Leg } from "@/lib/types";

type Prefill = { vehicleId?: string; date?: string };

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")); // cách 5 phút

/** Nhóm ô nhập cho một lượt (đi/về), tiền tố "o" hoặc "r". */
function LegFields({
  prefix,
  leg,
  vehicles,
  drivers,
  date,
  onDateChange,
  vehicleId,
}: {
  prefix: string;
  leg?: Leg;
  vehicles: Vehicle[];
  drivers: Driver[];
  date: string;
  onDateChange?: (v: string) => void;
  vehicleId?: string;
}) {
  const [hh, setHh] = useState(leg?.time?.split(":")[0] ?? "");
  const [mm, setMm] = useState(leg?.time?.split(":")[1] ?? "00");
  const time = hh ? `${hh}:${mm}` : ""; // gộp thành "HH:mm" cho form

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Ngày">
        <input
          name={`${prefix}_date`}
          type="date"
          value={date}
          onChange={(e) => onDateChange?.(e.target.value)}
          readOnly={!onDateChange}
          className={inputCls}
        />
        {date && (
          <p className="mt-1 text-xs font-semibold text-brand-600">📅 {fmtDateFull(date)}</p>
        )}
      </Field>
      <Field label="Giờ đón">
        <div className="flex items-center gap-1.5">
          <select value={hh} onChange={(e) => setHh(e.target.value)} className={inputCls} aria-label="Giờ">
            <option value="">-- giờ --</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>{h}h</option>
            ))}
          </select>
          <span className="font-semibold text-slate-400">:</span>
          <select value={mm} onChange={(e) => setMm(e.target.value)} className={inputCls} aria-label="Phút">
            {MINUTES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <input type="hidden" name={`${prefix}_time`} value={time} />
      </Field>
      <Field label="Điểm đón">
        <input name={`${prefix}_from`} defaultValue={leg?.from ?? ""} placeholder="VD: Hà Nội" className={inputCls} />
      </Field>
      <Field label="Điểm đến">
        <input name={`${prefix}_to`} defaultValue={leg?.to ?? ""} placeholder="VD: Sapa" className={inputCls} />
      </Field>
      <Field label="Xe">
        <select name={`${prefix}_vehicleId`} defaultValue={leg?.vehicleId ?? vehicleId ?? ""} className={inputCls}>
          <option value="">— Chọn xe —</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} · {seatLabel(v.seats)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Lái xe">
        <select name={`${prefix}_driverId`} defaultValue={leg?.driverId ?? ""} className={inputCls}>
          <option value="">— Chọn lái xe —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
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
  const [tourType, setTourType] = useState<string>(trip?.tourType ?? "2n1d");
  const [hasReturn, setHasReturn] = useState<boolean>(trip ? !!trip.return : tourType !== "oneway");
  const [oDate, setODate] = useState<string>(trip?.outbound.date ?? prefill?.date ?? "");
  const [rDate, setRDate] = useState<string>(
    trip?.return?.date ?? (oDate ? defaultReturnDate(oDate, tourType) : "")
  );

  function changeODate(v: string) {
    setODate(v);
    if (!trip) setRDate(defaultReturnDate(v, tourType)); // gợi ý ngày về khi thêm mới
  }
  function changeTourType(v: string) {
    setTourType(v);
    if (v === "oneway") setHasReturn(false);
    else if (!trip) {
      setHasReturn(true);
      if (oDate) setRDate(defaultReturnDate(oDate, v));
    }
  }

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
          <Field label="Loại tour">
            <select name="tourType" value={tourType} onChange={(e) => changeTourType(e.target.value)} className={inputCls}>
              {TOUR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tiền chuyến">
              <input name="price" inputMode="numeric" defaultValue={trip?.price ?? ""} placeholder="VD: 5000000" className={inputCls} />
            </Field>
            <Field label="Đặt cọc">
              <input name="deposit" inputMode="numeric" defaultValue={trip?.deposit ?? ""} placeholder="0" className={inputCls} />
            </Field>
          </div>
          <Field label="Trạng thái">
            <select name="status" defaultValue={trip?.status ?? "pending"} className={inputCls}>
              <option value="pending">Mới / Chưa xử lý</option>
              <option value="info_sent">Đã nhắn khách / Đang chạy</option>
              <option value="completed_paid">Đã về & Thanh toán</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Lượt đi */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <div className="mb-2 text-sm font-semibold text-blue-700">Lượt đi</div>
            <LegFields prefix="o" leg={trip?.outbound} vehicles={vehicles} drivers={drivers} date={oDate} onDateChange={changeODate} vehicleId={prefill?.vehicleId} />
          </div>

          {/* Lượt về */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 flex flex-col">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
              <input type="checkbox" name="hasReturn" checked={hasReturn} onChange={(e) => setHasReturn(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              Có lượt về
            </label>
            {hasReturn && (
              <>
                <LegFields prefix="r" leg={trip?.return ?? undefined} vehicles={vehicles} drivers={drivers} date={rDate} onDateChange={setRDate} />
                <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                  <input type="checkbox" name="heldThroughTour" defaultChecked={trip?.heldThroughTour ?? false} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300" />
                  <span>Giữ xe suốt tour (xe bận cả các ngày giữa) — chỉ áp dụng khi lượt đi & về cùng một xe</span>
                </label>
              </>
            )}
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
