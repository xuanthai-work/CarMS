"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/types";
import VehicleCard from "@/components/VehicleCard";
import AddVehicleButton from "@/components/AddVehicleButton";
import { normalizeVn } from "@/lib/search";

export default function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const [q, setQ] = useState("");
  const nq = normalizeVn(q);
  const filtered = nq ? vehicles.filter((v) => normalizeVn(v.plate).includes(nq)) : vehicles;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm biển số xe…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <AddVehicleButton />
      </div>

      <div className="space-y-3">
        {filtered.map((v) => (
          <VehicleCard key={v.id} vehicle={v} />
        ))}
        {vehicles.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            Chưa có xe nào — bấm “+ Thêm xe”.
          </div>
        )}
        {vehicles.length > 0 && filtered.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            Không tìm thấy xe khớp “{q}”.
          </div>
        )}
      </div>
    </div>
  );
}
