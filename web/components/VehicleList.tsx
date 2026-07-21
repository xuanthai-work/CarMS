"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/types";
import VehicleCard from "@/components/VehicleCard";
import AddVehicleButton from "@/components/AddVehicleButton";
import GroupColumn from "@/components/GroupColumn";
import { normalizeVn } from "@/lib/search";

export default function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const [q, setQ] = useState("");
  const nq = normalizeVn(q);
  const filtered = nq ? vehicles.filter((v) => normalizeVn(v.plate).includes(nq)) : vehicles;
  const own = filtered.filter((v) => v.type !== "partner");
  const partner = filtered.filter((v) => v.type === "partner");

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

      {vehicles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Chưa có xe nào — bấm “+ Thêm xe”.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Không tìm thấy xe khớp “{q}”.
        </div>
      ) : (
        <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-2">
          <GroupColumn
            title="Của công ty"
            emoji="🏢"
            items={own}
            empty="Không có xe của công ty."
            renderItem={(v) => <VehicleCard key={v.id} vehicle={v} />}
          />
          <GroupColumn
            title="Cộng tác / thuê ngoài"
            emoji="🤝"
            items={partner}
            empty="Không có xe cộng tác ngoài."
            renderItem={(v) => <VehicleCard key={v.id} vehicle={v} />}
          />
        </div>
      )}
    </div>
  );
}
