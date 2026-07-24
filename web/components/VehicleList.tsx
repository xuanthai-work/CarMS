"use client";

import { useState } from "react";
import type { Vehicle } from "@/lib/types";
import VehicleCard from "@/components/VehicleCard";
import AddVehicleButton from "@/components/AddVehicleButton";
import GroupColumn from "@/components/GroupColumn";
import { normalizeVn } from "@/lib/search";
import { Toolbar, SearchInput } from "@/components/ui";

export default function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const [q, setQ] = useState("");
  const nq = normalizeVn(q);
  const filtered = nq ? vehicles.filter((v) => normalizeVn(v.plate).includes(nq)) : vehicles;
  const own = filtered.filter((v) => v.type !== "partner");
  const partner = filtered.filter((v) => v.type === "partner");

  return (
    <div className="space-y-4">
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Tìm biển số xe..." />
        <AddVehicleButton />
      </Toolbar>

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
