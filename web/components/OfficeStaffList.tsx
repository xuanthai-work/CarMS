"use client";

import type { OfficeStaff } from "@/lib/types";
import OfficeStaffCard from "@/components/OfficeStaffCard";
import { normalizeVn } from "@/lib/search";

export default function OfficeStaffList({ staff, query }: { staff: OfficeStaff[]; query: string }) {
  const nq = normalizeVn(query);
  const filtered = nq
    ? staff.filter((p) => normalizeVn(`${p.name} ${p.position}`).includes(nq))
    : staff;

  return (
    <div className="space-y-4">
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Chưa có nhân sự văn phòng — bấm "+ Thêm nhân sự văn phòng".
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Không tìm thấy nhân sự khớp "{query}".
        </div>
      ) : (
        <div className="grid items-start gap-x-6 gap-y-4 lg:grid-cols-2">
          {filtered.map((p) => (
            <OfficeStaffCard key={p.id} staff={p} />
          ))}
        </div>
      )}
    </div>
  );
}
