"use client";

import { useMemo, useState } from "react";
import DragScroll from "@/components/DragScroll";
import { buildDayMeta } from "@/lib/format";
import { legMeta, statusBg, assignLanes } from "@/lib/trips";
import { seatLabel } from "@/lib/vehicles";
import type { Trip, Vehicle, Driver, Leg } from "@/lib/types";

const HOUR_H = 48; // chiều cao 1 giờ (trục Y)
const HOUR_GUTTER_W = 54; // bề rộng cột nhãn giờ
const DAY_W = 150; // bề rộng 1 ngày (trục X)
const HEADER_H = 46;
const BLOCK_H = 44; // chiều cao 1 block chuyến
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BODY_H = HOURS.length * HOUR_H;

type Block = { trip: Trip; kind: "out" | "ret"; leg: Leg; di: number; top: number; lane: number };

/** Vị trí Y (px) theo giờ đón; chưa có giờ -> mặc định 8h. */
function hourTop(time: string | null): number {
  const base = time ? (() => { const [h, m] = time.split(":").map(Number); return h + (m || 0) / 60; })() : 8;
  return Math.max(0, Math.min(base * HOUR_H, BODY_H - BLOCK_H));
}

export default function VehicleSchedule({
  vehicles,
  drivers,
  trips,
  days,
  today,
  onOpen,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  days: string[];
  today: string;
  onOpen: (trip: Trip) => void;
}) {
  const [vid, setVid] = useState(vehicles[0]?.id ?? "");
  const selected = vehicles.find((v) => v.id === vid);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const dayMeta = useMemo(() => buildDayMeta(days, today), [days, today]);

  // Các lượt của xe đang chọn, xếp theo ngày (cột) + giờ (dọc), lane chống chồng trong ngày.
  const { blocks, lanesByDay } = useMemo(() => {
    const blocks: Block[] = [];
    const lanesByDay: number[] = days.map(() => 1);
    days.forEach((day, di) => {
      const dayBlocks: Block[] = [];
      for (const t of trips) {
        if (t.outbound.vehicleId === vid && t.outbound.date === day)
          dayBlocks.push({ trip: t, kind: "out", leg: t.outbound, di, top: hourTop(t.outbound.time), lane: 0 });
        if (t.return && t.return.vehicleId === vid && t.return.date === day)
          dayBlocks.push({ trip: t, kind: "ret", leg: t.return, di, top: hourTop(t.return.time), lane: 0 });
      }
      lanesByDay[di] = Math.max(1, assignLanes(dayBlocks, (b) => b.top, (b) => b.top + BLOCK_H));
      blocks.push(...dayBlocks);
    });
    return { blocks, lanesByDay };
  }, [trips, vid, days]);

  const todayIdx = days.indexOf(today);
  const initialLeft = todayIdx >= 0 ? Math.max(0, todayIdx * DAY_W - DAY_W) : 0;

  return (
    <div className="space-y-2">
      {/* Bộ lọc chọn xe */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium text-slate-600">Xem xe:</label>
        <select
          value={vid}
          onChange={(e) => setVid(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate} · {seatLabel(v.seats)}
            </option>
          ))}
        </select>
      </div>

      {!selected ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">
          Chưa có xe nào.
        </div>
      ) : (
        <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Cột nhãn giờ cố định (trục Y) */}
          <div
            className="relative z-10 shrink-0 bg-white shadow-[6px_0_12px_-8px_rgba(15,23,42,0.18)]"
            style={{ width: HOUR_GUTTER_W }}
          >
            <div
              className="flex items-center justify-center border-b-2 border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase text-slate-400"
              style={{ height: HEADER_H }}
            >
              Giờ
            </div>
            {HOURS.map((h) => (
              <div
                key={h}
                className="flex items-start justify-end border-b border-slate-200 pr-2 pt-0.5 text-[11px] font-medium text-slate-400 last:border-b-0"
                style={{ height: HOUR_H }}
              >
                {h}h
              </div>
            ))}
          </div>

          {/* Vùng ngày (trục X) — cầm & kéo */}
          <DragScroll className="thin-scroll flex-1 overflow-x-auto" initialLeft={initialLeft}>
            <div style={{ width: days.length * DAY_W }}>
              {/* header ngày */}
              <div className="flex border-b-2 border-slate-300" style={{ height: HEADER_H }}>
                {dayMeta.map((m) => (
                  <div
                    key={m.d}
                    className={`flex shrink-0 items-center justify-center gap-1.5 border-r border-slate-200 ${
                      m.isToday ? "bg-brand-100" : m.weekend ? "bg-slate-100" : "bg-slate-50"
                    }`}
                    style={{ width: DAY_W }}
                  >
                    {m.isToday ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-600 text-[12px] font-bold text-white">
                        {m.num}
                      </span>
                    ) : (
                      <span className={`text-[15px] font-bold ${m.weekend ? "text-rose-500" : "text-slate-800"}`}>
                        {m.num}
                      </span>
                    )}
                    <span className={`text-[11px] ${m.weekend ? "text-rose-400" : "text-slate-400"}`}>{m.wd}</span>
                  </div>
                ))}
              </div>

              {/* thân lịch: lưới ngày × giờ + các block */}
              <div className="relative" style={{ height: BODY_H, width: days.length * DAY_W }}>
                {/* underlay: cột ngày, mỗi cột 24 ô giờ (bấm để thêm) */}
                <div className="absolute inset-0 flex">
                  {dayMeta.map((m, di) => (
                    <div
                      key={m.d}
                      className={`shrink-0 border-r border-slate-200 ${
                        m.isToday ? "bg-brand-50/40" : m.weekend ? "bg-slate-50/60" : di % 2 ? "bg-slate-50/30" : ""
                      }`}
                      style={{ width: DAY_W }}
                    >
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="w-full border-b border-slate-100 last:border-b-0"
                          style={{ height: HOUR_H }}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* các chuyến */}
                {blocks.map((b, k) => {
                  const laneCount = lanesByDay[b.di];
                  const colLeft = b.di * DAY_W;
                  const laneW = (DAY_W - 6) / laneCount;
                  const d2 = b.leg.driverId ? driverMap.get(b.leg.driverId) : undefined;
                  const meta = legMeta(b.trip, b.kind);
                  const badgeBg = meta.tone === "round" ? "bg-emerald-500" : meta.tone === "go" ? "bg-blue-500" : "bg-amber-500";
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onOpen(b.trip)}
                      title={`${b.kind === "out" ? "Đi" : "Về"} ${b.leg.time ?? ""} · ${b.trip.customerName} · ${
                        b.leg.from || "?"
                      } → ${b.leg.to || "?"}`}
                      className={`absolute overflow-hidden rounded-md border border-slate-300 px-1.5 py-1 text-left shadow-sm ${statusBg(
                        b.trip.status
                      )}`}
                      style={{
                        left: colLeft + 3 + b.lane * laneW,
                        width: laneW - 3,
                        top: b.top + 1,
                        height: BLOCK_H,
                      }}
                    >
                      <div className="flex items-center gap-1 truncate text-[11px] font-bold leading-tight">
                        <span className={`shrink-0 rounded px-1 text-[9px] leading-none text-white ${badgeBg}`}>
                          {meta.label}
                        </span>
                        {b.leg.time && <span className="shrink-0">{b.leg.time}</span>}
                        <span className="truncate">{b.trip.customerName}</span>
                      </div>
                      <div className="truncate text-[10.5px] leading-tight opacity-80">
                        {b.leg.from || "?"} → {b.leg.to || "?"}
                        {d2 ? ` · ${d2.name}` : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </DragScroll>
        </div>
      )}
    </div>
  );
}
