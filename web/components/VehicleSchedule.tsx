"use client";

import { useMemo, useRef, useState } from "react";
import DragScroll from "@/components/DragScroll";
import Modal from "@/components/Modal";
import { buildDayMeta, pad } from "@/lib/format";
import { legMeta, statusBg, assignLanes, fmtMoney, legRoute, toneBorderClass } from "@/lib/trips";
import { setLegEndTime } from "@/lib/actions";
import { CARD_HOVER_GROUP } from "@/components/ui";
import type { Trip, Vehicle, Driver, Leg } from "@/lib/types";

const HOUR_H = 48; // chiều cao 1 giờ (trục Y)
const HOUR_GUTTER_W = 54; // bề rộng cột nhãn giờ
const DAY_W = 150; // bề rộng 1 ngày (trục X)
const HEADER_H = 46;
const BLOCK_MIN_H = 28; // chiều cao tối thiểu 1 block
const DEFAULT_H = 44; // chiều cao khi chưa đặt giờ đến (~1 giờ)
const SNAP_MIN = 30; // kéo bám mốc 30 phút
const SNAP_PX = (HOUR_H * SNAP_MIN) / 60; // px mỗi bước snap
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const BODY_H = HOURS.length * HOUR_H;

type Block = { id: string; trip: Trip; kind: "out" | "ret"; leg: Leg; di: number; top: number; height: number; lane: number };

/** Chuyển "HH:mm" -> số giờ thập phân. */
function parseHM(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + (m || 0) / 60;
}
/** Vị trí Y (px) của một mốc giờ; chưa có giờ -> mặc định 8h. */
function yOf(time: string | null, fallback = 8): number {
  const h = time ? parseHM(time) : fallback;
  return Math.max(0, Math.min(h * HOUR_H, BODY_H));
}
/** Y (px) -> "HH:mm" bám mốc 30 phút. */
function yToTime(y: number): string {
  let min = Math.round((y / HOUR_H) * 60 / SNAP_MIN) * SNAP_MIN;
  min = Math.max(0, Math.min(min, 24 * 60));
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return `${pad(hh)}:${pad(mm)}`;
}

type Pending = {
  id: string;
  tripId: string;
  kind: "out" | "ret";
  customerName: string;
  endY: number;
  phase: "drag" | "confirm";
  oldEnd?: string | null;
  newEnd?: string;
};

export default function VehicleSchedule({
  vehicles,
  drivers,
  trips,
  days,
  today,
  vid,
  onOpen,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  days: string[];
  today: string;
  vid: string;
  onOpen: (trip: Trip) => void;
}) {
  const selected = vehicles.find((v) => v.id === vid);
  const driverMap = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const dayMeta = useMemo(() => buildDayMeta(days, today), [days, today]);

  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ top: number; pointerId: number } | null>(null);

  // Các lượt của xe đang chọn, đặt theo ngày (cột) + giờ (dọc); chiều cao = thời lượng (giờ đón→giờ đến).
  const { blocks, lanesByDay } = useMemo(() => {
    const mk = (trip: Trip, kind: "out" | "ret", leg: Leg, di: number): Block => {
      const top = Math.min(yOf(leg.time), BODY_H - BLOCK_MIN_H);
      const endY = leg.endTime ? yOf(leg.endTime) : top + DEFAULT_H;
      const height = Math.max(BLOCK_MIN_H, Math.min(endY, BODY_H) - top);
      return { id: `${trip.id}:${kind}`, trip, kind, leg, di, top, height, lane: 0 };
    };
    const blocks: Block[] = [];
    const lanesByDay: number[] = days.map(() => 1);
    days.forEach((day, di) => {
      const dayBlocks: Block[] = [];
      for (const t of trips) {
        if (t.outbound.vehicleId === vid && t.outbound.date === day)
          dayBlocks.push(mk(t, "out", t.outbound, di));
        if (t.return && t.return.vehicleId === vid && t.return.date === day)
          dayBlocks.push(mk(t, "ret", t.return, di));
      }
      lanesByDay[di] = Math.max(1, assignLanes(dayBlocks, (b) => b.top, (b) => b.top + b.height));
      blocks.push(...dayBlocks);
    });
    return { blocks, lanesByDay };
  }, [trips, vid, days]);

  const todayIdx = days.indexOf(today);
  const initialLeft = todayIdx >= 0 ? Math.max(0, todayIdx * DAY_W - DAY_W) : 0;
  const initialTop = 3 * HOUR_H; // mở sẵn quanh sáng sớm (các chuyến hay bắt đầu 4–6h)

  // ----- Kéo mép dưới để đặt giờ đến -----
  function startResize(e: React.PointerEvent, b: Block) {
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    drag.current = { top: b.top, pointerId: e.pointerId };
    setPending({
      id: b.id,
      tripId: b.trip.id,
      kind: b.kind,
      customerName: b.trip.customerName,
      endY: b.top + b.height,
      phase: "drag",
    });
  }
  function moveResize(e: React.PointerEvent) {
    const d = drag.current;
    const rect = bodyRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    let y = e.clientY - rect.top;
    y = Math.round(y / SNAP_PX) * SNAP_PX; // bám mốc 30'
    y = Math.max(d.top + SNAP_PX, Math.min(y, BODY_H)); // tối thiểu 30' sau giờ đón
    setPending((p) => (p ? { ...p, endY: y } : p));
  }
  function endResize() {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setPending((p) => {
      if (!p) return p;
      const newEnd = yToTime(p.endY);
      const block = blocks.find((b) => b.id === p.id);
      const oldEnd = block?.leg.endTime ?? null;
      if (newEnd === oldEnd) return null; // không đổi -> bỏ qua
      return { ...p, phase: "confirm", newEnd, oldEnd };
    });
  }

  async function confirmChange() {
    if (!pending?.newEnd) return;
    setSaving(true);
    try {
      await setLegEndTime(pending.tripId, pending.kind, pending.newEnd);
    } finally {
      setSaving(false);
      setPending(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {!selected ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted shadow-sm">
          Chưa có xe nào.
        </div>
      ) : (
        <DragScroll
          className="no-scrollbar min-h-0 flex-1 overflow-auto rounded-2xl border border-hairline bg-surface shadow-panel"
          initialLeft={initialLeft}
          initialTop={initialTop}
        >
          <div style={{ width: HOUR_GUTTER_W + days.length * DAY_W }}>
            {/* Hàng header: góc "Giờ" + thứ/ngày — ghim trên khi cuộn dọc */}
            <div className="sticky top-0 z-40 flex" style={{ height: HEADER_H }}>
              <div
                className="sticky left-0 z-50 flex items-center justify-center border-b-2 border-r border-slate-300 bg-slate-50 text-[10px] font-semibold uppercase text-slate-400"
                style={{ width: HOUR_GUTTER_W }}
              >
                Giờ
              </div>
              {dayMeta.map((m) => (
                <div
                  key={m.d}
                  className={`flex shrink-0 items-center justify-center gap-1.5 border-b-2 border-r border-slate-300 ${
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

            {/* Hàng thân: cột giờ (ghim trái) + lưới ngày×giờ */}
            <div className="flex">
              <div
                className="sticky left-0 z-30 shrink-0 bg-white shadow-[6px_0_12px_-8px_rgba(15,23,42,0.18)]"
                style={{ width: HOUR_GUTTER_W }}
              >
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

              {/* thân lịch: lưới ngày × giờ + các block */}
              <div ref={bodyRef} className="relative" style={{ height: BODY_H, width: days.length * DAY_W }}>
                {/* underlay: cột ngày, mỗi cột 24 ô giờ */}
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
                {blocks.map((b) => {
                  const laneCount = lanesByDay[b.di];
                  const colLeft = b.di * DAY_W;
                  const laneW = (DAY_W - 6) / laneCount;
                  const d2 = b.leg.driverId ? driverMap.get(b.leg.driverId) : undefined;
                  const meta = legMeta(b.trip, b.kind);
                  const toneBorder = toneBorderClass(meta.tone);
                  const active = pending?.id === b.id;
                  const height = active ? Math.max(BLOCK_MIN_H, pending!.endY - b.top) : b.height;
                  const liveEnd = active ? yToTime(pending!.endY) : b.leg.endTime;
                  const route = legRoute(b.leg);
                  return (
                    <div
                      key={b.id}
                      className={`group absolute ${active ? "z-20" : "hover:z-20"}`}
                      style={{ left: colLeft + 3 + b.lane * laneW, width: laneW - 3, top: b.top + 1, height }}
                    >
                      <button
                        type="button"
                        onClick={() => onOpen(b.trip)}
                        title={`${meta.label} · ${b.leg.time ?? ""}${liveEnd ? `–${liveEnd}` : ""} · ${b.trip.customerName} · ${route}${d2 ? ` · ${d2.name}` : ""}`}
                        className={`h-full w-full overflow-hidden rounded-lg border border-l-4 px-2 py-1 text-left shadow-sm transition-all duration-150 ${CARD_HOVER_GROUP} ${toneBorder} ${statusBg(
                          b.trip.status
                        )} ${active ? "border-brand-400 shadow-xl ring-2 ring-brand-400" : "border-slate-300"}`}
                      >
                        {/* Tên khách */}
                        <div className="truncate text-[13px] font-bold leading-tight">{b.trip.customerName}</div>
                        {/* Biển số xe — in đậm như dòng tiền */}
                        <div className="mt-0.5 truncate text-[12px] font-bold leading-tight">🚐 {selected?.plate ?? "?"}</div>
                        {/* Tiền */}
                        {b.trip.price != null && (
                          <div className="mt-0.5 text-[12px] font-bold leading-tight">💵 {fmtMoney(b.trip.price)}</div>
                        )}
                      </button>

                      {/* tay kéo mép dưới — đặt giờ đến */}
                      <div
                        onPointerDown={(e) => startResize(e, b)}
                        onPointerMove={moveResize}
                        onPointerUp={endResize}
                        onPointerCancel={endResize}
                        title="Kéo để đặt giờ đến"
                        className={`absolute inset-x-0 bottom-0 flex h-3 cursor-ns-resize touch-none items-center justify-center rounded-b-md transition-opacity ${
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <span className="h-1 w-6 rounded-full bg-slate-600/50" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DragScroll>
      )}

      {/* Xác nhận đổi giờ đến */}
      {pending?.phase === "confirm" && (
        <Modal title="Đổi giờ đến" onClose={() => !saving && setPending(null)} maxWidthClass="max-w-sm">
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Chuyến <b>{pending.customerName}</b> ({pending.kind === "out" ? "lượt đi" : "lượt về"})
            </p>
            <p className="rounded-lg bg-slate-50 px-3 py-2">
              Giờ đến:{" "}
              <span className="text-slate-500">{pending.oldEnd ?? "(chưa đặt)"}</span>{" "}
              <span className="text-slate-400">→</span>{" "}
              <b className="text-brand-700">{pending.newEnd}</b>
            </p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => setPending(null)}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={confirmChange}
              className="rounded-md bg-brand-600 px-5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu…" : "Xác nhận"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
