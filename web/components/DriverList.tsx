"use client";

import { useState } from "react";
import type { Driver } from "@/lib/types";
import DriverCard from "@/components/DriverCard";
import AddDriverButton from "@/components/AddDriverButton";
import GroupColumn from "@/components/GroupColumn";
import { normalizeVn } from "@/lib/search";

export default function DriverList({ drivers }: { drivers: Driver[] }) {
  const [q, setQ] = useState("");
  const nq = normalizeVn(q);
  const filtered = nq ? drivers.filter((d) => normalizeVn(d.name).includes(nq)) : drivers;
  const own = filtered.filter((d) => d.type !== "partner");
  const partner = filtered.filter((d) => d.type === "partner");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên lái xe …"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <AddDriverButton />
      </div>

      {drivers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Chưa có lái xe nào — bấm “+ Thêm lái xe”.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Không tìm thấy lái xe khớp “{q}”.
        </div>
      ) : (
        <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-2">
          <GroupColumn
            title="Của công ty"
            emoji="🏢"
            items={own}
            empty="Không có lái xe của công ty."
            renderItem={(d) => <DriverCard key={d.id} driver={d} />}
          />
          <GroupColumn
            title="Cộng tác / thuê ngoài"
            emoji="🤝"
            items={partner}
            empty="Không có lái xe cộng tác ngoài."
            renderItem={(d) => <DriverCard key={d.id} driver={d} />}
          />
        </div>
      )}
    </div>
  );
}
