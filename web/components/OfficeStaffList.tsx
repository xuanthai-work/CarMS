"use client";

import { useState } from "react";
import type { OfficeStaff } from "@/lib/types";
import OfficeStaffCard from "@/components/OfficeStaffCard";
import AddOfficeStaffButton from "@/components/AddOfficeStaffButton";
import { normalizeVn } from "@/lib/search";

export default function OfficeStaffList({ staff, query, hideToolbar = false }: { staff: OfficeStaff[]; query?: string; hideToolbar?: boolean }) {
  const [localQuery, setLocalQuery] = useState("");
  const q = query ?? localQuery;
  const nq = normalizeVn(q);
  const filtered = nq
    ? staff.filter((p) => normalizeVn(`${p.name} ${p.position}`).includes(nq))
    : staff;

  return (
    <div className="space-y-4">
      {!hideToolbar && <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-2.5 shadow-[0_10px_28px_-25px_rgba(15,23,42,0.8)]">
        <div className="relative min-w-[220px] flex-1">
          <input
            value={q}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Tìm tên, chức vụ..."
            className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <AddOfficeStaffButton />
      </div>}

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
          Chưa có nhân sự văn phòng — bấm "+ Thêm nhân sự văn phòng".
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center text-muted">
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
