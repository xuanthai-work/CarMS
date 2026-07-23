"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Modal from "@/components/Modal";
import TripForm from "@/components/TripForm";
import { Info } from "@/components/ui";
import { fmtDate, weekdayVn } from "@/lib/format";
import { fmtMoney, tourTypeLabel, sameVehicleBothLegs, legRoute } from "@/lib/trips";
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
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <div className="mb-3 flex items-center gap-2 text-base font-bold tracking-tight text-ink">
        <span>{title}</span>
        <span className="text-sm font-medium text-muted">
          {weekdayVn(leg.date)} - {fmtDate(leg.date)}
          {leg.time ? ` · ${leg.time}${leg.endTime ? `–${leg.endTime}` : ""}` : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <Info size="md" label="Lộ trình" value={legRoute(leg)} className="col-span-2" />
        <Info
          size="md"
          label="Xe"
          value={
            v
              ? `${v.plate} · ${seatLabel(v.seats)}`
              : leg.seatClass
              ? `${leg.seatClass} chỗ (chưa xếp)`
              : "—"
          }
        />
        <Info size="md" label="Lái xe" value={d ? d.name + (d.phone ? ` (${d.phone})` : "") : "—"} />
      </div>
    </div>
  );
}

function FinanceMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-[124px]">
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className="mt-1 text-base font-semibold tracking-tight text-ink">{value}</div>
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
  const reduceMotion = useReducedMotion();
  const title = trip ? (editing ? "Sửa chuyến" : "Chi tiết chuyến") : "Thêm chuyến";

  if (editing) {
    return (
      <Modal title={title} onClose={onClose} maxWidthClass="max-w-4xl">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        >
          <TripForm
            trip={trip ?? undefined}
            prefill={prefill}
            vehicles={vehicles}
            drivers={drivers}
            onDone={onClose}
            onCancel={trip ? () => setEditing(false) : onClose}
          />
        </motion.div>
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
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
          <span className="text-xl font-bold tracking-tight text-ink">{t.customerName}</span>
          {t.customerPhone && <span className="text-sm text-muted">{t.customerPhone}</span>}
          <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
            {tourTypeLabel(t.tourType)}
          </span>
          {round && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {t.heldThroughTour ? "Giữ xe suốt tour" : "Cùng xe đi & về"}
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <LegView title="Lượt đi" tone="border-blue-200 bg-blue-50/40" leg={t.outbound} vmap={vmap} dmap={dmap} />
          {t.return ? (
            <LegView title="Lượt về" tone="border-amber-200 bg-amber-50/40" leg={t.return} vmap={vmap} dmap={dmap} />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-base text-slate-400">
              Một chiều — không có lượt về.
            </div>
          )}
        </div>

        <div className="py-2">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Tài chính chuyến</div>
          <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-4">
            <FinanceMetric label="Tiền chuyến" value={fmtMoney(t.price)} />
            <FinanceMetric label="Đã cọc" value={fmtMoney(t.deposit)} />
            {t.fuelCost != null && <FinanceMetric label="Xăng dầu" value={fmtMoney(t.fuelCost)} />}
            {t.tollCost != null && <FinanceMetric label="VETC / Cầu đường" value={fmtMoney(t.tollCost)} />}
            {t.partnerCost != null && <FinanceMetric label="Tiền thuê đối tác" value={fmtMoney(t.partnerCost)} />}
            {t.otherCost != null && <FinanceMetric label="Chi phí khác" value={fmtMoney(t.otherCost)} />}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-hairline pt-4">
          <Info size="md" label="Ghi chú" value={t.note || "—"} className="min-w-0 flex-1" />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-xl border border-hairline px-4 py-2 text-sm font-semibold text-muted transition hover:bg-canvas active:scale-[0.98]"
          >
            Chỉnh sửa
          </button>
        </div>
      </motion.div>
    </Modal>
  );
}
