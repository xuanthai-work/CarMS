"use client";

import type { Driver } from "@/types";
import DriverCard from "@/components/drivers/DriverCard";
import GroupColumn from "@/components/schedule/GroupColumn";
import { normalizeVn } from "@/utils/search";
import { usePermissions } from "@/states/permissions/PermissionsProvider";

export default function DriverList({ drivers, query }: { drivers: Driver[]; query: string }) {
  const { canEdit } = usePermissions();
  const nq = normalizeVn(query);
  const filtered = nq ? drivers.filter((d) => normalizeVn(d.name).includes(nq)) : drivers;
  const own = filtered.filter((d) => d.type !== "partner");
  const partner = filtered.filter((d) => d.type === "partner");

  return (
    <div className="space-y-4">
      {drivers.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          {canEdit ? "Chưa có lái xe nào — bấm “+ Thêm lái xe”." : "Chưa có lái xe nào."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Không tìm thấy lái xe khớp “{query}”.
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-4 sm:grid-cols-2">
          <div className="min-w-0">
            <GroupColumn
              title="Của công ty"
              emoji="🏢"
              items={own}
              empty="Không có lái xe của công ty."
              renderItem={(d) => <DriverCard key={d.id} driver={d} />}
            />
          </div>
          <div className="min-w-0">
            <GroupColumn
              title="Cộng tác"
              emoji="🤝"
              items={partner}
              empty="Không có lái xe cộng tác ngoài."
              renderItem={(d) => <DriverCard key={d.id} driver={d} />}
            />
          </div>
        </div>
      )}
    </div>
  );
}
