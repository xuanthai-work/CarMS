"use client";

import { useState, useRef, useTransition, useMemo, useEffect } from "react";
import { saveTrip, deleteTrip } from "@/api/trips";
import { quickCreateVehicle } from "@/api/vehicles";
import { quickCreateDriver } from "@/api/drivers";
import Button from "@/components/common/Button";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { inputCls } from "@/components/common/ui";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";
import Combobox from "@/components/common/Combobox";
import MoneyInput from "@/components/common/MoneyInput";
import SelectMenu from "@/components/common/SelectMenu";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import { hasPartnerVehicle, TRIP_STATUSES, fmtMoney } from "@/utils/trips";
import { seatLabel, VEHICLE_TYPES } from "@/utils/vehicles";
import { todayStr } from "@/utils/format";
import { hasLeft } from "@/utils/office";
import type { Trip, Vehicle, Driver } from "@/types";

type Prefill = { vehicleId?: string; date?: string };

function Row({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid items-center gap-x-3 gap-y-1 sm:grid-cols-[6rem_minmax(0,1fr)] ${className ?? ""}`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Row2({
  label1,
  children1,
  label2,
  children2,
  className,
}: {
  label1: string;
  children1: React.ReactNode;
  label2: string;
  children2: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid items-center gap-x-3 gap-y-1 sm:grid-cols-[6rem_minmax(0,1fr)_auto_minmax(0,1fr)] ${className ?? ""}`}
    >
      <div className="text-sm text-slate-600">{label1}</div>
      <div className="min-w-0">{children1}</div>
      <div className="text-sm whitespace-nowrap text-slate-600">{label2}</div>
      <div className="min-w-0">{children2}</div>
    </div>
  );
}

export default function TripForm({
  trip,
  prefill,
  vehicles,
  drivers,
  onDone,
  renderFooter,
}: {
  trip?: Trip;
  prefill?: Prefill;
  vehicles: Vehicle[];
  drivers: Driver[];
  onDone: () => void;
  renderFooter?: (footer: React.ReactNode) => void;
}) {
  const { canEdit } = usePermissions();
  const formId = `trip-form-${trip?.id ?? "new"}`;
  const [hasReturn, setHasReturn] = useState<boolean>(trip ? !!trip.return : true);
  const [oDate, setODate] = useState<string>(trip?.outbound.date ?? prefill?.date ?? "");
  const [rDate, setRDate] = useState<string>(
    trip?.return?.date ?? trip?.outbound.date ?? prefill?.date ?? ""
  );

  // Ô "Xe" giữ id xe thật, hoặc "seat:<n>" nếu mới chọn placeholder số chỗ (chưa xếp xe).
  const initVeh = (vehId?: string | null, seatClass?: number | null) =>
    vehId ?? (seatClass ? `seat:${seatClass}` : "");

  const [oVehId, setOVehId] = useState(
    initVeh(trip?.outbound.vehicleId, trip?.outbound.seatClass) || prefill?.vehicleId || ""
  );
  const [oDrvId, setODrvId] = useState(trip?.outbound.driverId ?? "");
  const [rVehId, setRVehId] = useState(
    initVeh(trip?.return?.vehicleId, trip?.return?.seatClass)
  );
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

  const legacyCostTexts: string[] = [];
  if (trip?.tollCost != null && trip.tollCost > 0) {
    legacyCostTexts.push(`VETC/cầu đường ${fmtMoney(trip.tollCost)}`);
  }
  if (trip?.otherCost != null && trip.otherCost > 0) {
    legacyCostTexts.push(`Khác ${fmtMoney(trip.otherCost)}`);
  }
  const hasLegacyCosts = legacyCostTexts.length > 0;

  const vehicleOptions = useMemo(
    () => [
      ...vehicles.map((v) => ({ id: v.id, label: v.plate, sub: seatLabel(v.seats) })),
      ...VEHICLE_TYPES.map((n) => ({ id: `seat:${n}`, label: `${n} chỗ`, sub: "chưa xếp xe (mẫu)" })),
    ],
    [vehicles]
  );

  const isOutboundPartnerVeh = !!oVehId && vehicles.find((v) => v.id === oVehId)?.type === "partner";
  const oPickableDrivers = drivers.filter(
    (d) => !hasLeft(d.endDate, oDate || todayStr()) || d.id === oDrvId
  );

  const isReturnPartnerVeh = !!rVehId && vehicles.find((v) => v.id === rVehId)?.type === "partner";
  const rPickableDrivers = drivers.filter(
    (d) => !hasLeft(d.endDate, rDate || todayStr()) || d.id === rDrvId
  );

  // Giá trị ban đầu ô Lộ trình: ghép lộ trình lượt đi; nếu lượt về khác thì nối thêm · Về: ...
  const defaultRoute = useMemo(() => {
    const ob = [trip?.outbound.from, trip?.outbound.to].map((x) => x?.trim()).filter(Boolean).join(" → ");
    const ret = [trip?.return?.from, trip?.return?.to].map((x) => x?.trim()).filter(Boolean).join(" → ");
    if (ret && ret !== ob) {
      return ob ? `${ob} · Về: ${ret}` : `Về: ${ret}`;
    }
    return ob;
  }, [trip]);

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

  useEffect(() => {
    if (!renderFooter) return;
    if (!canEdit) {
      renderFooter(null);
      return;
    }
    renderFooter(
      <div className="flex items-center justify-between">
        {trip ? (
          <div className="[&>button]:!h-8 [&>button]:!w-8">
            <ConfirmDeleteButton
              action={handleDelete}
              id={trip.id}
              label={`chuyến của ${trip.customerName}`}
            />
          </div>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          form={formId}
          size="toolbar"
          disabled={isPending}
        >
          {isPending ? (trip ? "Đang lưu…" : "Đang thêm…") : trip ? "Lưu" : "Thêm chuyến"}
        </Button>
      </div>
    );
  }, [renderFooter, canEdit, trip, isPending, formId]);

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
        <fieldset disabled={!canEdit} className={`space-y-2.5 ${!canEdit ? "opacity-90" : ""}`}>
          {/* Khách · Trạng thái */}
          <Row2
            label1="Khách"
            children1={
              <input
                name="customerName"
                required
                defaultValue={trip?.customerName ?? ""}
                className={inputCls}
              />
            }
            label2="Trạng thái"
            children2={
              <SelectMenu name="status" value={status} onChange={setStatus} options={TRIP_STATUSES} />
            }
          />

          {/* Tiền chuyến · Đã cọc */}
          <Row2
            label1="Tiền chuyến"
            children1={<MoneyInput name="price" defaultValue={trip?.price ?? null} />}
            label2="Đã cọc"
            children2={<MoneyInput name="deposit" defaultValue={trip?.deposit ?? null} />}
          />
          {hasLegacyCosts && (
            <div className="grid gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
              <div />
              <p className="text-xs text-slate-500">
                Chi phí cũ ghi trên chuyến: {legacyCostTexts.join(" · ")}
              </p>
            </div>
          )}

          {/* Thuê đối tác (chỉ khi có xe đối tác) */}
          {usesPartnerVehicle && (
            <Row label="Thuê đối tác">
              <MoneyInput name="partnerCost" defaultValue={trip?.partnerCost ?? null} />
            </Row>
          )}

          {/* Ngày đi */}
          <Row label="Ngày đi">
            <DatePicker
              name="o_date"
              value={oDate}
              onChange={changeODate}
              disabled={!canEdit}
            />
          </Row>

          {/* Ngày về: checkbox Về đứng trước DatePicker trên cùng dòng */}
          <Row label="Ngày về">
            <div className="flex items-center gap-3">
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  name="hasReturn"
                  checked={hasReturn}
                  onChange={(e) => setHasReturn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span>Về</span>
              </label>
              {hasReturn && (
                <div className="min-w-0 flex-1">
                  <DatePicker
                    name="r_date"
                    value={rDate}
                    onChange={setRDate}
                    disabled={!canEdit}
                  />
                </div>
              )}
            </div>
          </Row>

          {/* Giờ đón: TimePicker (chọn giờ HH:mm) */}
          {hasReturn ? (
            <Row2
              label1="Giờ đón đi"
              children1={<TimePicker name="o_time" defaultValue={trip?.outbound.time ?? ""} />}
              label2="Giờ đón về"
              children2={<TimePicker name="r_time" defaultValue={trip?.return?.time ?? ""} />}
            />
          ) : (
            <Row label="Giờ đón">
              <TimePicker name="o_time" defaultValue={trip?.outbound.time ?? ""} />
            </Row>
          )}

          {/* Lộ trình (một ô duy nhất) */}
          <Row label="Lộ trình">
            <input
              name="o_route"
              className={inputCls}
              defaultValue={defaultRoute}
            />
          </Row>

          {/* Xe · Lái xe (đi) */}
          {isOutboundPartnerVeh ? (
            <Row label="Xe">
              <Combobox
                name="o_vehicleId"
                value={oVehId}
                onChange={setOVehId}
                options={vehicleOptions}
                placeholder="Xe"
                emptyText="Không thấy xe"
                onCreate={(t) => quickCreateVehicle(t)}
                createLabel={(t) => `+ Thêm xe “${t}”`}
              />
            </Row>
          ) : (
            <Row2
              label1="Xe"
              children1={
                <Combobox
                  name="o_vehicleId"
                  value={oVehId}
                  onChange={setOVehId}
                  options={vehicleOptions}
                  placeholder="Xe"
                  emptyText="Không thấy xe"
                  onCreate={(t) => quickCreateVehicle(t)}
                  createLabel={(t) => `+ Thêm xe “${t}”`}
                />
              }
              label2="Lái xe"
              children2={
                <Combobox
                  name="o_driverId"
                  value={oDrvId}
                  onChange={setODrvId}
                  options={oPickableDrivers.map((d) => ({ id: d.id, label: d.name }))}
                  placeholder="Lái xe"
                  emptyText="Không thấy lái xe"
                  onCreate={(t) => quickCreateDriver(t)}
                  createLabel={(t) => `+ Thêm lái xe “${t}”`}
                />
              }
            />
          )}

          {/* Các dòng xe/lái xe lượt về & giữ xe */}
          {hasReturn && (
            <>
              {/* Xe · Lái xe (về) */}
              {isReturnPartnerVeh ? (
                <Row label="Xe về">
                  <Combobox
                    name="r_vehicleId"
                    value={rVehId}
                    onChange={setRVehId}
                    options={vehicleOptions}
                    placeholder="Xe"
                    emptyText="Không thấy xe"
                    onCreate={(t) => quickCreateVehicle(t)}
                    createLabel={(t) => `+ Thêm xe “${t}”`}
                  />
                </Row>
              ) : (
                <Row2
                  label1="Xe về"
                  children1={
                    <Combobox
                      name="r_vehicleId"
                      value={rVehId}
                      onChange={setRVehId}
                      options={vehicleOptions}
                      placeholder="Xe"
                      emptyText="Không thấy xe"
                      onCreate={(t) => quickCreateVehicle(t)}
                      createLabel={(t) => `+ Thêm xe “${t}”`}
                    />
                  }
                  label2="Lái xe"
                  children2={
                    <Combobox
                      name="r_driverId"
                      value={rDrvId}
                      onChange={setRDrvId}
                      options={rPickableDrivers.map((d) => ({ id: d.id, label: d.name }))}
                      placeholder="Lái xe"
                      emptyText="Không thấy lái xe"
                      onCreate={(t) => quickCreateDriver(t)}
                      createLabel={(t) => `+ Thêm lái xe “${t}”`}
                    />
                  }
                />
              )}

              {/* Giữ xe cả tour */}
              <Row label="Giữ xe cả tour">
                <input
                  type="checkbox"
                  name="heldThroughTour"
                  defaultChecked={trip?.heldThroughTour ?? false}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
              </Row>
            </>
          )}

          {/* Ghi chú */}
          <Row label="Ghi chú" className="!items-start pt-1">
            <textarea
              name="note"
              rows={5}
              defaultValue={trip?.note ?? ""}
              className={`${inputCls} min-h-[6rem] resize-y`}
            />
          </Row>
        </fieldset>
      </form>
    </div>
  );
}
