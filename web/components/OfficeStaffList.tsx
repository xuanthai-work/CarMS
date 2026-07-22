"use client";

import { useState } from "react";
import type { OfficeStaff } from "@/lib/types";
import OfficeStaffCard from "@/components/OfficeStaffCard";
import AddOfficeStaffButton from "@/components/AddOfficeStaffButton";
import { normalizeVn } from "@/lib/search";

export default function OfficeStaffList({ staff }: { staff: OfficeStaff[] }) {
  const [q, setQ] = useState("");
  const nq = normalizeVn(q);
  const filtered = nq
    ? staff.filter((p) => normalizeVn(`${p.name} ${p.position}`).includes(nq))
    : staff;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tên, chức vụ…"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <AddOfficeStaffButton />
      </div>

      {staff.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Chưa có nhân sự văn phòng — bấm "+ Thêm nhân sự văn phòng".
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          Không tìm thấy nhân sự khớp "{q}".
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
