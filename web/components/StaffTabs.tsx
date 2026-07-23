"use client";

import { useState } from "react";
import type { Driver, OfficeStaff } from "@/lib/types";
import DriverList from "@/components/DriverList";
import OfficeStaffList from "@/components/OfficeStaffList";
import FilterTabs from "@/components/FilterTabs";
import AddDriverButton from "@/components/AddDriverButton";
import AddOfficeStaffButton from "@/components/AddOfficeStaffButton";

/** Bộ chuyển tab Lái xe / Văn phòng (kiểu toggle view ở lịch). Nhân viên (canSeeOffice=false) chỉ thấy Lái xe. */
export default function StaffTabs({
  drivers,
  staff,
  canSeeOffice,
}: {
  drivers: Driver[];
  staff: OfficeStaff[];
  canSeeOffice: boolean;
}) {
  const [tab, setTab] = useState<"driver" | "office">("driver");
  const [query, setQuery] = useState("");

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-hairline bg-surface p-2.5 shadow-[0_10px_28px_-25px_rgba(15,23,42,0.8)]">
      {canSeeOffice && (
        <FilterTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Chuyển nhóm nhân sự"
          options={[
            ["driver", `Lái xe (${drivers.length})`],
            ["office", `Văn phòng (${staff.length})`],
          ] as const}
        />
      )}
      <div className="relative min-w-[220px] flex-1">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === "driver" ? "Tìm tên lái xe..." : "Tìm tên, chức vụ..."}
          className="h-9 w-full rounded-xl border border-hairline bg-canvas px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500 focus:bg-surface focus:ring-1 focus:ring-brand-500"
        />
      </div>
      {tab === "driver" || !canSeeOffice ? <AddDriverButton /> : <AddOfficeStaffButton />}
    </div>
  );

  return (
    <div className="space-y-5">
      {toolbar}
      {tab === "driver" || !canSeeOffice ? (
        <DriverList drivers={drivers} query={query} hideToolbar />
      ) : (
        <OfficeStaffList staff={staff} query={query} hideToolbar />
      )}
    </div>
  );
}
