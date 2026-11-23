"use client";

import { useState, useRef, useTransition, useMemo } from "react";
import { saveTrip, deleteTrip } from "@/api/trips";
import { quickCreateVehicle } from "@/api/vehicles";
import { quickCreateDriver } from "@/api/drivers";
import Button from "@/components/common/Button";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import { inputCls } from "@/components/common/ui";
import DatePicker from "@/components/common/DatePicker";
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
    <div className={`grid items-center gap-x-3 gap-y-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] ${className ?? ""}`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="min-w-0">{children}</div>
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
        <fieldset disabled={!canEdit} className={`space-y-2.5 ${!canEdit ? "opacity-90" : ""}`}>
          {/* Khách */}
          <Row label="Khách">
            <input
              name="customerName"
              required
              defaultValue={trip?.customerName ?? ""}
              className={inputCls}
            />
          </Row>

          {/* Trạng thái */}
          <Row label="Trạng thái">
            <SelectMenu name="status" value={status} onChange={setStatus} options={TRIP_STATUSES} />
          </Row>

          {/* Tiền chuyến */}
          <Row label="Tiền chuyến">
            <MoneyInput name="price" defaultValue={trip?.price ?? null} />
          </Row>

          {/* Đã cọc */}
          <Row label="Đã cọc">
            <MoneyInput name="deposit" defaultValue={trip?.deposit ?? null} />
            {hasLegacyCosts && (
              <p className="mt-1 text-xs text-slate-500">
                Chi phí cũ ghi trên chuyến: {legacyCostTexts.join(" · ")}
              </p>
            )}
          </Row>

          {/* Thuê đối tác (chỉ khi có xe đối tác) */}
          {usesPartnerVehicle && (
            <Row label="Thuê đối tác">
              <MoneyInput name="partnerCost" defaultValue={trip?.partnerCost ?? null} />
            </Row>
          )}

          {/* Ngày đi */}
          <Row label="Ngày đi">
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                name="o_date"
                value={oDate}
                onChange={changeODate}
                disabled={!canEdit}
              />
              <input
                name="o_time"
                className={inputCls}
                placeholder="Giờ đón"
                maxLength={60}
                defaultValue={trip?.outbound.time ?? ""}
              />
            </div>
          </Row>

          {/* Lộ trình đi */}
          <Row label="Lộ trình đi">
            <input
              name="o_route"
              className={inputCls}
              defaultValue={[trip?.outbound.from, trip?.outbound.to].map((x) => x?.trim()).filter(Boolean).join(" → ")}
            />
          </Row>

          {/* Xe đi */}
          <Row label="Xe đi">
            <div className="grid grid-cols-2 gap-2">
              <div className={isOutboundPartnerVeh ? "col-span-2" : ""}>
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
              </div>
              {!isOutboundPartnerVeh && (
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
              )}
            </div>
          </Row>

          {/* Có lượt về */}
          <Row label="Có lượt về">
            <input
              type="checkbox"
              name="hasReturn"
              checked={hasReturn}
              onChange={(e) => setHasReturn(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
          </Row>

          {/* Các dòng lượt về */}
          {hasReturn && (
            <>
              {/* Ngày về */}
              <Row label="Ngày về">
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    name="r_date"
                    value={rDate}
                    onChange={setRDate}
                    disabled={!canEdit}
                  />
                  <input
                    name="r_time"
                    className={inputCls}
                    placeholder="Giờ đón"
                    maxLength={60}
                    defaultValue={trip?.return?.time ?? ""}
                  />
                </div>
              </Row>

              {/* Lộ trình về */}
              <Row label="Lộ trình về">
                <input
                  name="r_route"
                  className={inputCls}
                  defaultValue={[trip?.return?.from, trip?.return?.to].map((x) => x?.trim()).filter(Boolean).join(" → ")}
                />
              </Row>

              {/* Xe về */}
              <Row label="Xe về">
                <div className="grid grid-cols-2 gap-2">
                  <div className={isReturnPartnerVeh ? "col-span-2" : ""}>
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
                  </div>
                  {!isReturnPartnerVeh && (
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
                  )}
                </div>
              </Row>

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
