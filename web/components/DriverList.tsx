"use client";

import type { Driver } from "@/lib/types";
import DriverCard from "@/components/DriverCard";
import GroupColumn from "@/components/GroupColumn";
import { normalizeVn } from "@/lib/search";

export default function DriverList({ drivers, query }: { drivers: Driver[]; query: string }) {
  const nq = normalizeVn(query);
  const filtered = nq ? drivers.filter((d) => normalizeVn(d.name).includes(nq)) : drivers;
  const own = filtered.filter((d) => d.type !== "partner");
  const partner = filtered.filter((d) => d.type === "partner");

  return (
    <div className="space-y-4">
      {drivers.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Chưa có lái xe nào — bấm “+ Thêm lái xe”.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Không tìm thấy lái xe khớp “{query}”.
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
