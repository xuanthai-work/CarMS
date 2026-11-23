"use client";

import { useState, useRef, useTransition } from "react";
import { saveTrip, deleteTrip } from "@/api/trips";
import { quickCreateVehicle } from "@/api/vehicles";
import { quickCreateDriver } from "@/api/drivers";
import Button from "@/components/common/Button";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { Field, inputCls } from "@/components/common/ui";
import DatePicker from "@/components/common/DatePicker";
import Combobox from "@/components/common/Combobox";
import MoneyInput from "@/components/common/MoneyInput";
import SelectMenu from "@/components/common/SelectMenu";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import { hasPartnerVehicle, tourTypeLabel, tourTypeFromDates, TRIP_STATUSES, fmtMoney } from "@/utils/trips";
import { seatLabel, VEHICLE_TYPES } from "@/utils/vehicles";
import { fmtDateFull, todayStr } from "@/utils/format";
import { hasLeft } from "@/utils/office";
import type { Trip, Vehicle, Driver, Leg } from "@/types";

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
  canEdit,
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
  canEdit: boolean;
}) {
  // Xe đối tác/thuê ngoài thường đi kèm lái xe của họ → ẩn ô lái xe (không gửi driverId → lưu null).
  const isPartnerVeh = !!vehId && vehicles.find((v) => v.id === vehId)?.type === "partner";
  const pickable = drivers.filter((d) => !hasLeft(d.endDate, date || todayStr()) || d.id === drvId);

  // Chuyến cũ có cả from/to: ghép "from → to"
  const defaultRoute = [leg?.from, leg?.to].map((x) => x?.trim()).filter(Boolean).join(" → ");

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Ngày">
        <DatePicker
          name={`${prefix}_date`}
          value={date}
          onChange={(v) => onDateChange?.(v)}
          disabled={!canEdit || !onDateChange}
        />
        {date && (
          <p className="mt-1 text-xs font-semibold text-brand-600">📅 {fmtDateFull(date)}</p>
        )}
      </Field>
      <Field label="Giờ đón">
        <input
          name={`${prefix}_time`}
          className={inputCls}
          placeholder="VD: 6h30, sáng sớm"
          maxLength={60}
          defaultValue={leg?.time ?? ""}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Lộ trình">
          <input
            name={`${prefix}_route`}
            className={inputCls}
            placeholder="VD: Hà Nội → Sapa, đón ở khách sạn X"
            defaultValue={defaultRoute}
          />
        </Field>
      </div>
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
            options={pickable.map((d) => ({ id: d.id, label: d.name }))}
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
  const { canEdit } = usePermissions();
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
  // Lỗi từ Server Action (hết phiên, không có quyền ghi, lỗi DB/mạng) — hiện thành banner.
  const [error, setError] = useState<string | null>(null);

  // Tiền thuê đối tác là chi phí thuê xe ngoài, không phụ thuộc tài xế là công ty hay cộng tác.
  const usesPartnerVehicle = hasPartnerVehicle(
    [oVehId, hasReturn ? rVehId : null],
    vehicles
  );

  // useTransition: cung cấp isPending để disable nút trong lúc Server Action (1-3s trên production).
  // isSubmittingRef: chốt chặn đồng bộ, loại bỏ các click liên tiếp trong cùng 1 tick trước khi action chạy.
  const [isPending, startTransition] = useTransition();
  const isSubmittingRef = useRef(false);

  function changeODate(v: string) {
    setODate(v);
    // khi thêm mới: giữ ngày về hợp lệ (mặc định cùng ngày, không để trước ngày đi)
    if (!trip) setRDate((prev) => (prev && prev >= v ? prev : v));
  }

  // Loại tour suy ra từ ngày đi/về (+ có lượt về hay không) — thay cho việc chọn tay.
  const derivedType = tourTypeFromDates(oDate, hasReturn ? rDate : null);

  const legacyCostTexts: string[] = [];
  if (trip?.tollCost != null && trip.tollCost > 0) {
    legacyCostTexts.push(`VETC/cầu đường ${fmtMoney(trip.tollCost)}`);
  }
  if (trip?.otherCost != null && trip.otherCost > 0) {
    legacyCostTexts.push(`Khác ${fmtMoney(trip.otherCost)}`);
  }
  const hasLegacyCosts = legacyCostTexts.length > 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    const fd = new FormData(e.currentTarget);
    isSubmittingRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const r = await saveTrip(fd);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        onDone();
      } catch {
        setError("Không kết nối được máy chủ. Vui lòng thử lại.");
      } finally {
        isSubmittingRef.current = false;
      }
    });
  }

  async function handleDelete(fd: FormData): Promise<void> {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const r = await deleteTrip(fd);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        onDone();
      } catch {
        setError("Không kết nối được máy chủ. Vui lòng thử lại.");
      } finally {
        isSubmittingRef.current = false;
      }
    });
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          <span aria-hidden>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <form
        id={formId}
        onSubmit={handleSubmit}
        onInput={() => error && setError(null)}
      >
        {trip && <input type="hidden" name="id" value={trip.id} />}
        <fieldset disabled={!canEdit} className={`space-y-4 ${!canEdit ? "opacity-90" : ""}`}>
          {/* Hàng khách */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tên Zalo khách *">
              <input
                name="customerName"
                required
                defaultValue={trip?.customerName ?? ""}
                placeholder="VD: Chị Lan"
                className={inputCls}
              />
            </Field>
            <Field label="Trạng thái">
              <SelectMenu name="status" value={status} onChange={setStatus} options={TRIP_STATUSES} />
            </Field>
          </div>

          {/* Dải tiền */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Tiền</div>
            <div className={`grid gap-3 sm:grid-cols-2 ${usesPartnerVehicle ? "lg:grid-cols-3" : ""}`}>
              <Field label="Tiền chuyến">
                <MoneyInput name="price" defaultValue={trip?.price ?? null} placeholder="VD: 5.000.000" />
              </Field>
              <Field label="Đã cọc">
                <MoneyInput name="deposit" defaultValue={trip?.deposit ?? null} placeholder="0" />
              </Field>
              {usesPartnerVehicle && (
                <Field label="Tiền thuê đối tác">
                  <MoneyInput name="partnerCost" defaultValue={trip?.partnerCost ?? null} placeholder="0" />
                </Field>
              )}
            </div>
            {hasLegacyCosts && (
              <p className="mt-2 text-xs text-slate-500">
                Chi phí cũ ghi trên chuyến: {legacyCostTexts.join(" · ")}
              </p>
            )}
          </div>

          {/* Dải xếp lịch */}
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
              <LegFields
                prefix="o"
                leg={trip?.outbound}
                vehicles={vehicles}
                drivers={drivers}
                date={oDate}
                onDateChange={changeODate}
                vehId={oVehId}
                setVehId={setOVehId}
                drvId={oDrvId}
                setDrvId={setODrvId}
                canEdit={canEdit}
              />
            </div>

            {/* Lượt về */}
            <div className="flex flex-col rounded-lg border border-amber-200 bg-amber-50/40 p-3">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
                <input
                  type="checkbox"
                  name="hasReturn"
                  checked={hasReturn}
                  onChange={(e) => setHasReturn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Có lượt về
              </label>
              {hasReturn && (
                <>
                  <LegFields
                    prefix="r"
                    leg={trip?.return ?? undefined}
                    vehicles={vehicles}
                    drivers={drivers}
                    date={rDate}
                    onDateChange={setRDate}
                    vehId={rVehId}
                    setVehId={setRVehId}
                    drvId={rDrvId}
                    setDrvId={setRDrvId}
                    canEdit={canEdit}
                  />
                  <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      name="heldThroughTour"
                      defaultChecked={trip?.heldThroughTour ?? false}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
                    />
                    <span>Giữ xe suốt tour (xe bận cả các ngày giữa) — chỉ áp dụng khi lượt đi & về cùng một xe</span>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Ô ghi chú lớn */}
          <Field label="Ghi chú (tự do)">
            <textarea
              name="note"
              rows={8}
              defaultValue={trip?.note ?? ""}
              className={`${inputCls} min-h-[10rem] resize-y`}
              placeholder="SĐT khách, yêu cầu đặc biệt, điểm dừng, mọi thứ cần nhớ…"
            />
          </Field>
        </fieldset>
      </form>

      <div className="mt-4 flex items-center justify-between">
        {trip && canEdit ? (
          <ConfirmDeleteButton action={handleDelete} id={trip.id} label={`chuyến của ${trip.customerName}`} />
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isPending}
          >
            {canEdit ? "Hủy" : "Đóng"}
          </Button>
          {canEdit && (
            <Button
              type="submit"
              form={formId}
              disabled={isPending}
            >
              {isPending ? (trip ? "Đang lưu…" : "Đang thêm…") : trip ? "Lưu" : "Thêm chuyến"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
