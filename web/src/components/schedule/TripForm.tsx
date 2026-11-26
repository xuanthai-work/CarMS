"use client";

import { useState, useRef, useTransition, useMemo, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { saveTrip, deleteTrip } from "@/api/trips";
import { quickCreateVehicle } from "@/api/vehicles";
import { quickCreateDriver } from "@/api/drivers";
import Button from "@/components/common/Button";
import ConfirmDeleteButton from "@/components/common/ConfirmDeleteButton";
import Collapse from "@/components/common/Collapse";
import { inputCls } from "@/components/common/ui";
import DatePicker from "@/components/common/DatePicker";
import TimePicker from "@/components/common/TimePicker";
import Combobox from "@/components/common/Combobox";
import MoneyInput from "@/components/common/MoneyInput";
import SelectMenu from "@/components/common/SelectMenu";
import { usePermissions } from "@/states/permissions/PermissionsProvider";
import { TRIP_STATUSES, fmtMoney } from "@/utils/trips";
import { seatLabel, VEHICLE_TYPES } from "@/utils/vehicles";
import { todayStr } from "@/utils/format";
import { hasLeft } from "@/utils/office";
import { deletedLabel, pickableOptions } from "@/utils/softDelete";
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
      <div className="min-w-0 h-full flex flex-col">{children}</div>
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
  label1: React.ReactNode;
  children1: React.ReactNode;
  label2: React.ReactNode;
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
  const reduce = useReducedMotion();
  const fadeTransition = reduce
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const };
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
  const [partnerCost, setPartnerCost] = useState<string>(() =>
    trip?.partnerCost != null ? String(trip.partnerCost) : ""
  );
  // Lỗi từ Server Action (hết phiên, không có quyền ghi, lỗi DB/mạng) — hiện thành banner.
  const [error, setError] = useState<string | null>(null);

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
      ...pickableOptions(vehicles, [oVehId, rVehId]).map((v) => ({
        id: v.id,
        label: deletedLabel(v.plate, v.deletedAt),
        sub: seatLabel(v.seats),
      })),
      ...VEHICLE_TYPES.map((n) => ({ id: `seat:${n}`, label: `${n} chỗ`, sub: "chưa xếp xe (mẫu)" })),
    ],
    [vehicles, oVehId, rVehId]
  );

  const isOutboundPartnerVeh = !!oVehId && vehicles.find((v) => v.id === oVehId)?.type === "partner";
  const oPickableDrivers = pickableOptions(drivers, oDrvId).filter(
    (d) => !hasLeft(d.endDate, oDate || todayStr()) || d.id === oDrvId
  );

  const isReturnPartnerVeh = !!rVehId && vehicles.find((v) => v.id === rVehId)?.type === "partner";
  const rPickableDrivers = pickableOptions(drivers, rDrvId).filter(
    (d) => !hasLeft(d.endDate, rDate || todayStr()) || d.id === rDrvId
  );

  // Giá trị ban đầu ô Lộ trình/Note: ghép lộ trình cũ (nếu có) và ghi chú cũ, ngăn cách bởi \n
  const defaultNote = useMemo(() => {
    const ob = [trip?.outbound.from, trip?.outbound.to].map((x) => x?.trim()).filter(Boolean).join(" → ");
    const ret = [trip?.return?.from, trip?.return?.to].map((x) => x?.trim()).filter(Boolean).join(" → ");
    const route = ret && ret !== ob ? (ob ? `${ob} · Về: ${ret}` : `Về: ${ret}`) : ob;
    const note = trip?.note?.trim() ?? "";
    return [route, note].filter(Boolean).join("\n");
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
    <div className="flex flex-1 flex-col">
      {error && (
        <div
          role="alert"
          className="mb-3 shrink-0 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          <span aria-hidden>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <form
        id={formId}
        onSubmit={handleSubmit}
        onInput={() => error && setError(null)}
        className="flex flex-1 flex-col"
      >
        {trip && <input type="hidden" name="id" value={trip.id} />}
        <fieldset disabled={!canEdit} className={`flex flex-1 flex-col space-y-2.5 ${!canEdit ? "opacity-90" : ""}`}>
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
          {status === "cancelled" && (
            <>
              <Row label="Phí hủy">
                <MoneyInput name="cancelFee" defaultValue={trip?.cancelFee ?? null} />
              </Row>
              <div className="grid gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
                <div />
                <p className="text-xs text-slate-500">
                  Doanh thu chuyến này chỉ tính phí hủy; phần cọc vượt phí hủy là tiền hoàn lại.
                </p>
              </div>
            </>
          )}
          {hasLegacyCosts && (
            <div className="grid gap-x-3 sm:grid-cols-[6rem_minmax(0,1fr)]">
              <div />
              <p className="text-xs text-slate-500">
                Chi phí cũ ghi trên chuyến: {legacyCostTexts.join(" · ")}
              </p>
            </div>
          )}

          {/* Ngày đi & Ngày về (cùng 1 dòng) */}
          <Row2
            label1="Ngày đi"
            children1={
              <DatePicker
                name="o_date"
                value={oDate}
                onChange={changeODate}
                disabled={!canEdit}
              />
            }
            label2={
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  name="hasReturn"
                  checked={hasReturn}
                  onChange={(e) => setHasReturn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <span>Về</span>
              </label>
            }
            children2={
              <AnimatePresence initial={false}>
                {hasReturn && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={fadeTransition}
                  >
                    <DatePicker
                      name="r_date"
                      value={rDate}
                      onChange={setRDate}
                      disabled={!canEdit}
                      align="right"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            }
          />

          {/* Giờ đón: luôn là Row2 */}
          <Row2
            label1={hasReturn ? "Giờ đón đi" : "Giờ đón"}
            children1={<TimePicker name="o_time" defaultValue={trip?.outbound.time ?? ""} />}
            label2={
              <AnimatePresence initial={false}>
                {hasReturn && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={fadeTransition}
                  >
                    Giờ đón về
                  </motion.span>
                )}
              </AnimatePresence>
            }
            children2={
              <AnimatePresence initial={false}>
                {hasReturn && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={fadeTransition}
                  >
                    <TimePicker name="r_time" defaultValue={trip?.return?.time ?? ""} />
                  </motion.div>
                )}
              </AnimatePresence>
            }
          />


          {/* Xe · Lái xe (đi) / Thuê đối tác */}
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
            label2={isOutboundPartnerVeh ? "Thuê đối tác" : "Lái xe"}
            children2={
              isOutboundPartnerVeh ? (
                <MoneyInput name="partnerCost" defaultValue={partnerCost} onValueChange={setPartnerCost} />
              ) : (
                <Combobox
                  name="o_driverId"
                  value={oDrvId}
                  onChange={setODrvId}
                  options={oPickableDrivers.map((d) => ({ id: d.id, label: deletedLabel(d.name, d.deletedAt) }))}
                  placeholder="Lái xe"
                  emptyText="Không thấy lái xe"
                  onCreate={(t) => quickCreateDriver(t)}
                  createLabel={(t) => `+ Thêm lái xe “${t}”`}
                />
              )
            }
          />

          {/* Các dòng xe/lái xe lượt về & giữ xe */}
          <Collapse open={hasReturn} className="!mt-0">
            <div className="pt-2.5 space-y-2.5">
              {/* Xe · Lái xe (về) / Thuê đối tác */}
              {(() => {
                const rVehicleCombo = (
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
                );
                const showPartnerCost = hasReturn && isReturnPartnerVeh && !isOutboundPartnerVeh;
                return isReturnPartnerVeh && !showPartnerCost ? (
                  <Row label="Xe về">{rVehicleCombo}</Row>
                ) : (
                  <Row2
                    label1="Xe về"
                    children1={rVehicleCombo}
                    label2={showPartnerCost ? "Thuê đối tác" : "Lái xe"}
                    children2={
                      showPartnerCost ? (
                        <MoneyInput name="partnerCost" defaultValue={partnerCost} onValueChange={setPartnerCost} />
                      ) : (
                        <Combobox
                          name="r_driverId"
                          value={rDrvId}
                          onChange={setRDrvId}
                          options={rPickableDrivers.map((d) => ({ id: d.id, label: deletedLabel(d.name, d.deletedAt) }))}
                          placeholder="Lái xe"
                          emptyText="Không thấy lái xe"
                          onCreate={(t) => quickCreateDriver(t)}
                          createLabel={(t) => `+ Thêm lái xe “${t}”`}
                        />
                      )
                    }
                  />
                );
              })()}

              {/* Giữ xe cả tour */}
              <Row label="Giữ xe cả tour">
                <input
                  type="checkbox"
                  name="heldThroughTour"
                  defaultChecked={trip?.heldThroughTour ?? false}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
              </Row>
            </div>
          </Collapse>

          {/* Lộ trình / Note */}
          <Row label="Lộ trình/Note" className="!items-start pt-1 flex-1 min-h-[4.5rem]">
            <textarea
              name="note"
              rows={3}
              defaultValue={defaultNote}
              placeholder="Điểm đón → điểm đến, ghi chú…"
              className={`${inputCls} h-full min-h-[4.5rem] resize-none`}
            />
          </Row>
        </fieldset>
      </form>
    </div>
  );
}
