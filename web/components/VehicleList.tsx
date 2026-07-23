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
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-2.5 shadow-[0_10px_28px_-25px_rgba(15,23,42,0.8)]">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm biển số xe..."
            className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <AddVehicleButton />
      </div>

      {vehicles.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Chưa có xe nào — bấm “+ Thêm xe”.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
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
