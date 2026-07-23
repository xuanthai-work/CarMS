"use client";

import { useState } from "react";
import type { Driver } from "@/lib/types";
import DriverCard from "@/components/DriverCard";
import AddDriverButton from "@/components/AddDriverButton";
import GroupColumn from "@/components/GroupColumn";
import { normalizeVn } from "@/lib/search";

export default function DriverList({ drivers, query, hideToolbar = false }: { drivers: Driver[]; query?: string; hideToolbar?: boolean }) {
  const [localQuery, setLocalQuery] = useState("");
  const q = query ?? localQuery;
  const nq = normalizeVn(q);
  const filtered = nq ? drivers.filter((d) => normalizeVn(d.name).includes(nq)) : drivers;
  const own = filtered.filter((d) => d.type !== "partner");
  const partner = filtered.filter((d) => d.type === "partner");

  return (
    <div className="space-y-4">
      {!hideToolbar && <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-2.5 shadow-[0_10px_28px_-25px_rgba(15,23,42,0.8)]">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={q}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Tìm tên lái xe..."
            className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <AddDriverButton />
      </div>}

      {drivers.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Chưa có lái xe nào — bấm “+ Thêm lái xe”.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
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
