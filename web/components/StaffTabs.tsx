"use client";

import { useState } from "react";
import type { Driver, OfficeStaff } from "@/lib/types";
import DriverList from "@/components/DriverList";
import OfficeStaffList from "@/components/OfficeStaffList";
import FilterTabs from "@/components/FilterTabs";
import AddDriverButton from "@/components/AddDriverButton";
import AddOfficeStaffButton from "@/components/AddOfficeStaffButton";
import { Toolbar, SearchInput } from "@/components/ui";

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
    <Toolbar>
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
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={tab === "driver" ? "Tìm tên lái xe..." : "Tìm tên, chức vụ..."}
      />
      {tab === "driver" || !canSeeOffice ? <AddDriverButton /> : <AddOfficeStaffButton />}
    </Toolbar>
  );

  return (
    <div className="space-y-5">
      {toolbar}
      {tab === "driver" || !canSeeOffice ? (
        <DriverList drivers={drivers} query={query} />
      ) : (
        <OfficeStaffList staff={staff} query={query} />
      )}
    </div>
  );
}
