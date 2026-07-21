"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import TripForm from "@/components/TripForm";
import { Info } from "@/components/ui";
import { fmtDate, weekdayVn } from "@/lib/format";
import { fmtMoney, tourTypeLabel, sameVehicleBothLegs } from "@/lib/trips";
import { seatLabel } from "@/lib/vehicles";
import type { Trip, Vehicle, Driver, Leg } from "@/lib/types";

type Prefill = { vehicleId?: string; date?: string };

function LegView({
  title,
  tone,
  leg,
  vmap,
  dmap,
}: {
  title: string;
  tone: string;
  leg: Leg;
  vmap: Map<string, Vehicle>;
  dmap: Map<string, Driver>;
}) {
  const v = leg.vehicleId ? vmap.get(leg.vehicleId) : undefined;
  const d = leg.driverId ? dmap.get(leg.driverId) : undefined;
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <span>{title}</span>
        <span className="text-xs font-normal text-slate-500">
          {weekdayVn(leg.date)} {fmtDate(leg.date)}
          {leg.time ? ` · ${leg.time}` : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        <Info label="Lộ trình" value={`${leg.from || "—"} → ${leg.to || "—"}`} className="col-span-2" />
        <Info label="Xe" value={v ? `${v.plate} · ${seatLabel(v.seats)}` : "—"} />
        <Info label="Lái xe" value={d ? d.name + (d.phone ? ` (${d.phone})` : "") : "—"} />
      </div>
    </div>
  );
}

export default function TripModal({
  trip,
  prefill,
  vehicles,
  drivers,
  onClose,
}: {
  trip: Trip | null;
  prefill?: Prefill;
  vehicles: Vehicle[];
  drivers: Driver[];
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(!trip); // thêm mới -> mở thẳng form
  const title = trip ? (editing ? "Sửa chuyến" : "Chi tiết chuyến") : "Thêm chuyến";

  if (editing) {
    return (
      <Modal title={title} onClose={onClose} maxWidthClass="max-w-4xl">
        <TripForm
          trip={trip ?? undefined}
          prefill={prefill}
          vehicles={vehicles}
          drivers={drivers}
          onDone={onClose}
          onCancel={trip ? () => setEditing(false) : onClose}
        />
      </Modal>
    );
  }

  // ----- CHẾ ĐỘ XEM -----
  const t = trip!;
  const vmap = new Map(vehicles.map((v) => [v.id, v]));
  const dmap = new Map(drivers.map((d) => [d.id, d]));
  const round = sameVehicleBothLegs(t);

  return (
    <Modal title={title} onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-slate-900">{t.customerName}</span>
          {t.customerPhone && <span className="text-sm text-slate-500">{t.customerPhone}</span>}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {tourTypeLabel(t.tourType)}
          </span>
          {round && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {t.heldThroughTour ? "Giữ xe suốt tour" : "Cùng xe đi & về"}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <LegView title="Lượt đi" tone="border-blue-200 bg-blue-50/40" leg={t.outbound} vmap={vmap} dmap={dmap} />
          {t.return ? (
            <LegView title="Lượt về" tone="border-amber-200 bg-amber-50/40" leg={t.return} vmap={vmap} dmap={dmap} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-400">
              Một chiều — không có lượt về.
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          <Info label="Tiền chuyến" value={fmtMoney(t.price)} />
          <Info label="Đặt cọc" value={fmtMoney(t.deposit)} />
          <Info label="Ghi chú" value={t.note || "—"} className="col-span-2" />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Chỉnh sửa
          </button>
        </div>
      </div>
    </Modal>
  );
}
