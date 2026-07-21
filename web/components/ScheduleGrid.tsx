"use client";

import { useMemo, useState } from "react";
import TripModal from "@/components/TripModal";
import DragScroll from "@/components/DragScroll";
import VehicleSchedule from "@/components/VehicleSchedule";
import { buildDayMeta } from "@/lib/format";
import { tourTypeLabel, fmtMoney, sameVehicleBothLegs, statusBg, assignLanes } from "@/lib/trips";
import { seatLabel } from "@/lib/vehicles";
import type { Trip, Vehicle, Driver } from "@/lib/types";

const W = 168; // bề rộng mỗi ngày (view theo tour)
const HEADER_H = 52;
const TOUR_LANE_H = 110; // chiều cao 1 thẻ tour
const LANE_GAP = 8;
const PAD_TOP = 8;

/** Style thẻ ở view "theo tour": nền theo trạng thái, viền trung tính. */
function tourCardCls(status?: string): string {
  return `shadow-sm border border-slate-300 ${statusBg(status)}`;
}

export default function ScheduleGrid({
  vehicles,
  drivers,
  days,
  today,
  trips,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  days: string[];
  today: string;
  trips: Trip[];
}) {
  const [modal, setModal] = useState<{ trip: Trip | null; prefill?: { vehicleId?: string; date?: string } } | null>(null);
  const [view, setView] = useState<"xe" | "tour">("xe"); // theo xe (1 xe, ngày×giờ) | theo tour (Gantt)

  const trackWidth = days.length * W;
  const first = days[0];
  const last = days[days.length - 1];

  const dayMeta = useMemo(() => buildDayMeta(days, today), [days, today]);

  // mở lịch tour là nhảy tới hôm nay (nếu tháng đang xem có hôm nay)
  const todayIdx = dayMeta.findIndex((m) => m.isToday);
  const todayScrollLeft = todayIdx >= 0 ? Math.max(0, todayIdx * W - 16) : 0;

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  // View "theo tour": mỗi tour là 1 thanh kéo dài theo đúng ngày đi→ngày về, xếp tầng để không chồng.
  const tour = useMemo(() => {
    const idxOf = new Map(days.map((d, i) => [d, i]));
    type TItem = { trip: Trip; s: number; e: number; lane: number };
    const items: TItem[] = [];
    for (const t of trips) {
      const startD = t.outbound.date;
      const endD = t.return?.date ?? t.outbound.date;
      if (endD < first || startD > last) continue; // ngoài tháng
      const s = Math.max(0, idxOf.has(startD) ? idxOf.get(startD)! : 0);
      const e = Math.min(days.length - 1, idxOf.has(endD) ? idxOf.get(endD)! : days.length - 1);
      items.push({ trip: t, s, e, lane: 0 });
    }
    const lanes = assignLanes(items, (it) => it.s, (it) => it.e + 1);
    return { items, lanes: Math.max(1, lanes) };
  }, [trips, days, first, last]);

  return (
    <div className="space-y-3">
      {/* Thanh công cụ: chú giải + chuyển view + thêm */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Nền:</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded border border-slate-300 bg-white" /> Mới</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-green-200" /> Đang chạy</span>
          <span className="flex items-center gap-1"><i className="h-3 w-3 rounded bg-green-600" /> Đã về & TT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm font-medium">
            <button
              type="button"
              onClick={() => setView("xe")}
              className={`rounded-md px-3 py-1.5 ${view === "xe" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Theo xe
            </button>
            <button
              type="button"
              onClick={() => setView("tour")}
              className={`rounded-md px-3 py-1.5 ${view === "tour" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Theo tour
            </button>
          </div>
          <button
            type="button"
            onClick={() => setModal({ trip: null })}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Thêm chuyến
          </button>
        </div>
      </div>

      {view === "xe" && (
        <VehicleSchedule
          vehicles={vehicles}
          drivers={drivers}
          trips={trips}
          days={days}
          today={today}
          onOpen={(t) => setModal({ trip: t })}
        />
      )}

      {view === "tour" && (
        <DragScroll
          className="thin-scroll overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
          initialLeft={todayScrollLeft}
        >
          <div style={{ width: trackWidth }}>
            {/* header ngày */}
            <div className="flex border-b-2 border-slate-300" style={{ height: HEADER_H }}>
              {dayMeta.map((m) => (
                <div
                  key={m.d}
                  className={`flex shrink-0 flex-col items-center justify-center gap-0.5 border-r border-slate-200 ${
                    m.isToday ? "bg-brand-100" : m.weekend ? "bg-slate-100" : "bg-slate-50"
                  }`}
                  style={{ width: W }}
                >
                  {m.isToday ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">
                      {m.num}
                    </span>
                  ) : (
                    <span className={`text-[13px] font-semibold ${m.weekend ? "text-rose-500" : "text-slate-700"}`}>
                      {m.num}
                    </span>
                  )}
                  <span className={`text-[10px] ${m.weekend ? "text-rose-400" : "text-slate-400"}`}>{m.wd}</span>
                </div>
              ))}
            </div>

            {/* vùng lane tour */}
            <div
              className="relative"
              style={{ height: PAD_TOP * 2 + tour.lanes * TOUR_LANE_H + (tour.lanes - 1) * LANE_GAP }}
            >
              {/* underlay cột ngày (nền + bấm để thêm theo ngày) */}
              <div className="absolute inset-0 flex">
                {dayMeta.map((m, di) => (
                  <div
                    key={m.d}
                    className={`shrink-0 border-r border-slate-200 ${
                      m.isToday ? "bg-brand-50" : m.weekend ? "bg-slate-100/70" : di % 2 ? "bg-slate-50/60" : "bg-white"
                    }`}
                    style={{ width: W }}
                  />
                ))}
              </div>

              {/* thẻ tour: kéo dài theo span ngày, tóm tắt gọn */}
              {tour.items.map((it) => {
                const trip = it.trip;
                const vOut = trip.outbound.vehicleId ? vehicleMap.get(trip.outbound.vehicleId) : undefined;
                const vRet = trip.return?.vehicleId ? vehicleMap.get(trip.return.vehicleId) : undefined;
                const sameVeh = sameVehicleBothLegs(trip);
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => setModal({ trip })}
                    className={`absolute overflow-hidden rounded-lg px-2.5 py-2 text-left ${tourCardCls(trip.status)}`}
                    style={{
                      left: it.s * W + 4,
                      width: (it.e - it.s + 1) * W - 8,
                      top: PAD_TOP + it.lane * (TOUR_LANE_H + LANE_GAP),
                      height: TOUR_LANE_H,
                    }}
                  >
                    <div className="flex h-full flex-col gap-1">
                      {/* khách + chip loại tour (bên phải) */}
                      <div className="flex shrink-0 items-start gap-2">
                        <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold leading-snug">
                          {trip.customerName}
                          {trip.customerPhone && (
                            <span className="ml-1 text-[11px] font-medium opacity-70">{trip.customerPhone}</span>
                          )}
                        </span>
                        <span className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-bold">
                          {tourTypeLabel(trip.tourType)}
                        </span>
                      </div>

                      {/* lộ trình + giờ đón */}
                      <div className="shrink-0 truncate text-[12.5px] leading-snug">
                        {trip.outbound.time && (
                          <span className="font-semibold opacity-70">{trip.outbound.time} · </span>
                        )}
                        {trip.outbound.from || "?"} <span className="opacity-50">→</span> {trip.outbound.to || "?"}
                      </div>

                      {/* biển số xe — nổi bật */}
                      <div className="flex shrink-0 flex-wrap items-center gap-1 text-[12px]">
                        {!trip.return || sameVeh ? (
                          <span className="rounded-md border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-bold text-slate-800">
                            🚐 {vOut?.plate ?? "?"}
                            <span className="ml-1 font-medium text-slate-500">{seatLabel(vOut?.seats)}</span>
                          </span>
                        ) : (
                          <>
                            <span className="rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700">
                              Đi {vOut?.plate ?? "?"}
                            </span>
                            <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
                              Về {vRet?.plate ?? "?"}
                            </span>
                          </>
                        )}
                      </div>

                      {/* tiền */}
                      <div className="mt-auto flex shrink-0 items-center gap-2 text-[13px]">
                        <span className="font-extrabold">💵 {fmtMoney(trip.price)}</span>
                        {trip.deposit != null && <span className="opacity-75">· cọc {fmtMoney(trip.deposit)}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DragScroll>
      )}

      {modal && (
        <TripModal
          trip={modal.trip}
          prefill={modal.prefill}
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
