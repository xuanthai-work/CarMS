"use client";

import { useMemo, useState, type ReactNode } from "react";
import TripModal from "@/components/TripModal";
import DragScroll from "@/components/DragScroll";
import VehicleSchedule from "@/components/VehicleSchedule";
import { buildDayMeta } from "@/lib/format";
import { fmtMoney, sameVehicleBothLegs, statusBg, packVariableHeight, TRIP_STATUSES } from "@/lib/trips";
import { CARD_HOVER, CARD_HOVER_GROUP } from "@/components/ui";
import SelectMenu from "@/components/SelectMenu";
import FilterTabs from "@/components/FilterTabs";
import { seatLabel } from "@/lib/vehicles";
import type { Trip, Vehicle, Driver, Leg } from "@/lib/types";

const W = 190; // bề rộng mỗi ngày (view theo tour)
const HEADER_H = 52;
const CARD_BASE_H = 62; // chiều cao thẻ cơ bản (tên + dòng biển số)
const MONEY_LINE_H = 17; // mỗi dòng tiền / cọc thêm chừng này chiều cao
const LANE_GAP = 8;
const PAD_TOP = 8;
const CARD_W = W - 8; // bề rộng 1 thẻ lượt (khi tách đi/về)

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
  const [view, setView] = useState<"xe" | "tour">("tour"); // theo tour (Gantt) mặc định | theo xe (1 xe, ngày×giờ)
  const [vid, setVid] = useState(vehicles[0]?.id ?? ""); // xe đang xem ở view "theo xe" (dropdown ở toolbar)
  const vehicleOptions = useMemo(
    () => vehicles.map((v) => ({ value: v.id, label: `${v.plate} · ${seatLabel(v.seats)}` })),
    [vehicles]
  );

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
    type TItem = {
      trip: Trip;
      s: number;
      e: number;
      oIdx: number | null; // cột lượt đi (null nếu ngày đi ở tháng khác)
      rIdx: number | null; // cột lượt về (null nếu ngày về ở tháng khác / không có lượt về)
      nights: number; // số đêm thực (theo ngày, KHÔNG kẹp về tháng)
      top: number;
      height: number;
    };
    const items: TItem[] = [];
    for (const t of trips) {
      const startD = t.outbound.date;
      const endD = t.return?.date ?? t.outbound.date;
      if (endD < first || startD > last) continue; // ngoài tháng
      const oIdx = idxOf.has(startD) ? idxOf.get(startD)! : null;
      const rIdx = t.return && idxOf.has(endD) ? idxOf.get(endD)! : null;
      // s/e = khoảng ngày THẬT của chuyến, kẹp về tháng (KHÔNG dùng oIdx/rIdx vì chúng
      // null khi lượt ở tháng khác / không có lượt về → sẽ kéo thẻ tràn cả tháng).
      const s = idxOf.has(startD) ? idxOf.get(startD)! : 0; // đi tháng trước ⇒ mép trái
      const e = idxOf.has(endD) ? idxOf.get(endD)! : days.length - 1; // về tháng sau ⇒ mép phải
      const nights = t.return ? Math.round((Date.parse(endD) - Date.parse(startD)) / 86_400_000) : 0;
      // chiều cao responsive: có tiền +1 dòng, có cọc +1 dòng
      const height =
        CARD_BASE_H + (t.price != null ? MONEY_LINE_H : 0) + (t.deposit != null ? MONEY_LINE_H : 0);
      items.push({ trip: t, s, e, oIdx, rIdx, nights, top: 0, height });
    }
    // Xếp gọn có lấp khe (thuật toán ở lib/trips.ts): thẻ chỉ né đúng thẻ trùng ngày, không ép thẳng hàng.
    const totalHeight = packVariableHeight(items, LANE_GAP, PAD_TOP);
    return { items, totalHeight };
  }, [trips, days, first, last]);

  // Viền trái theo vai trò lượt (chỉ dấu hiệu màu, không nhãn chữ).
  const ROLE_BORDER = {
    out: "border-l-blue-500", // lượt đi (tách)
    ret: "border-l-amber-500", // lượt về (tách)
    round: "border-l-violet-400", // theo đoàn (nhiều ngày, cùng xe)
    both: "border-l-slate-400", // khứ hồi khác xe
    one: "border-l-slate-400", // một chiều → xám
    day: "border-l-yellow-400", // trong ngày → vàng
  } as const;

  /** Nhãn "xe" của một lượt: biển số nếu đã xếp xe; chưa xếp thì "N chỗ" (placeholder); không có → "?". */
  const vehLabel = (leg: Leg | null | undefined): string => {
    const v = leg?.vehicleId ? vehicleMap.get(leg.vehicleId) : undefined;
    if (v) return v.plate;
    if (leg?.seatClass) return `${leg.seatClass} chỗ`;
    return "?";
  };

  /** Dòng biển số — in đậm như dòng tiền; nhiều lượt nối bằng " - " (VD: 29B15621 - 16 chỗ). */
  const plateLine = (...labels: string[]) => (
    <span className="truncate text-[12px] font-bold leading-tight">
      🚐 {labels.join(" - ")}
    </span>
  );

  /** Thẻ tour thống nhất: viền trái (loại lượt) · tên khách · lộ trình · xe · tiền. */
  const tourCard = (
    trip: Trip,
    role: keyof typeof ROLE_BORDER,
    left: number,
    width: number,
    top: number,
    height: number,
    plates: ReactNode,
    showMoney: boolean,
    paired = false // true = cặp đi/về nối nhau → hover 1 nhấc cả 2 (group-hover)
  ) => {
    const hover = paired ? CARD_HOVER_GROUP : CARD_HOVER;
    return (
      <button
        key={`${trip.id}-${role === "out" || role === "ret" ? role : "whole"}`}
        type="button"
        onClick={() => setModal({ trip })}
        className={`absolute cursor-pointer overflow-hidden rounded-lg border border-l-4 px-2.5 py-2 text-left transition duration-150 ${hover} ${tourCardCls(
          trip.status
        )} ${ROLE_BORDER[role]}`}
        style={{ left, width, top, height }}
      >
        <div className="flex h-full flex-col gap-0.5">
          {/* tên khách */}
          <span className="shrink-0 truncate text-[13px] font-bold leading-snug">{trip.customerName}</span>
          {/* xe + tiền (+ cọc nếu có) */}
          <div className="mt-auto flex flex-col gap-0.5">
            {plates}
            {showMoney && trip.price != null && (
              <span className="text-[12px] font-bold leading-tight">💵 {fmtMoney(trip.price)}</span>
            )}
            {showMoney && trip.deposit != null && (
              <span className="text-[11px] font-medium leading-tight opacity-70">cọc {fmtMoney(trip.deposit)}</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Thanh công cụ: chú giải + chuyển view + thêm */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Trạng thái:</span>
          {TRIP_STATUSES.map((s) => (
            <span key={s.value} className="flex items-center gap-1">
              <i className={`h-3 w-3 rounded ${s.swatch}`} /> {s.label}
            </span>
          ))}
          <span aria-hidden className="mx-1 h-3.5 w-px bg-slate-200" />
          <span className="font-semibold text-slate-600">Viền:</span>
          <span className="flex items-center gap-1"><i className="h-3.5 w-1 rounded bg-yellow-400" /> Trong ngày</span>
          <span className="flex items-center gap-1"><i className="h-3.5 w-1 rounded bg-blue-500" /> Lượt đi</span>
          <span className="flex items-center gap-1"><i className="h-3.5 w-1 rounded bg-amber-500" /> Lượt về</span>
          <span className="flex items-center gap-1"><i className="h-3.5 w-1 rounded bg-violet-400" /> Theo đoàn</span>
          <span className="flex items-center gap-1"><i className="h-3.5 w-1 rounded bg-slate-400" /> Một chiều</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {view === "xe" && (
            <div className="relative z-[60] w-56">
              <SelectMenu name="scheduleVehicle" value={vid} onChange={setVid} options={vehicleOptions} placeholder="Chọn xe" />
            </div>
          )}
          <FilterTabs
            value={view}
            onChange={setView}
            ariaLabel="Chuyển kiểu xem lịch"
            options={[
              ["xe", "Theo xe"],
              ["tour", "Theo chuyến"],
            ] as const}
          />
          <button
            type="button"
            onClick={() => setModal({ trip: null })}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand-700 active:scale-[0.98]"
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
          vid={vid}
          onOpen={(t) => setModal({ trip: t })}
        />
      )}

      {view === "tour" && (
        <DragScroll
          className="no-scrollbar min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
          initialLeft={todayScrollLeft}
        >
          <div style={{ width: trackWidth }}>
            {/* header ngày — ghim trên khi cuộn dọc */}
            <div className="sticky top-0 z-30 flex border-b-2 border-slate-300" style={{ height: HEADER_H }}>
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
            <div className="relative" style={{ height: tour.totalHeight }}>
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
                const sameVeh = sameVehicleBothLegs(trip);
                const top = it.top;
                const cardH = it.height;

                // Dài ngày + KHÔNG giữ xe suốt tour → tách 2 thẻ đi/về (không kéo dài), nối bằng đường.
                // Xét theo NGÀY thực (không theo index đã kẹp) để chuyến vắt qua 2 tháng vẫn tách đúng.
                const isSplit =
                  !!trip.return && trip.return.date !== trip.outbound.date && !trip.heldThroughTour;
                if (isSplit) {
                  const trackW = days.length * W;
                  // Lượt nằm ở tháng khác → không vẽ thẻ đó; đường nối chạy tới mép lịch.
                  const xOutRight = it.oIdx != null ? it.oIdx * W + 4 + CARD_W : 0;
                  const xRetLeft = it.rIdx != null ? it.rIdx * W + 4 : trackW;
                  const gapW = Math.max(0, xRetLeft - xOutRight);
                  return (
                    <div className="group" key={trip.id}>
                      {/* đường nối 2 thẻ (xe rảnh các ngày giữa); chạy tới mép nếu 1 lượt ở tháng khác */}
                      {gapW > 0 && (
                        <div
                          className="absolute flex items-center transition-colors duration-150"
                          style={{ left: xOutRight, width: gapW, top: top + cardH / 2 - 9, height: 18 }}
                        >
                          <div className="h-0 flex-1 border-t-2 border-dashed border-slate-300 transition-colors group-hover:border-[#cbb48f]" />
                          {gapW >= 44 && (
                            <span className="mx-1 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              {it.nights}Đ
                            </span>
                          )}
                          <div className="h-0 flex-1 border-t-2 border-dashed border-slate-300 transition-colors group-hover:border-[#cbb48f]" />
                        </div>
                      )}
                      {it.oIdx != null &&
                        tourCard(trip, "out", it.oIdx * W + 4, CARD_W, top, cardH, plateLine(vehLabel(trip.outbound)), true, true)}
                      {it.rIdx != null &&
                        tourCard(trip, "ret", it.rIdx * W + 4, CARD_W, top, cardH, plateLine(vehLabel(trip.return)), it.oIdx == null, true)}
                    </div>
                  );
                }

                // Nguyên thẻ (trong ngày / giữ xe suốt tour) — kéo dài theo span ngày.
                // Viền: trong ngày = vàng · một chiều = xám · theo đoàn = tím · khứ hồi khác xe = xám.
                const role =
                  trip.tourType === "oneway"
                    ? "one"
                    : trip.tourType === "1d"
                    ? "day"
                    : sameVeh
                    ? "round"
                    : "both";
                const plates =
                  trip.return && !sameVeh
                    ? plateLine(vehLabel(trip.outbound), vehLabel(trip.return))
                    : plateLine(vehLabel(trip.outbound));
                return tourCard(trip, role, it.s * W + 4, (it.e - it.s + 1) * W - 8, top, cardH, plates, true);
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
