"use client";

import { useState } from "react";
import type { Driver, OfficeStaff, SalaryRate } from "@/types";
import DriverList from "@/components/drivers/DriverList";
import OfficeStaffList from "@/components/staff/OfficeStaffList";
import FilterTabs from "@/components/common/FilterTabs";
import AddDriverButton from "@/components/drivers/AddDriverButton";
import AddOfficeStaffButton from "@/components/staff/AddOfficeStaffButton";
import { Toolbar, SearchInput } from "@/components/common/ui";
import { activeOnly } from "@/utils/softDelete";

/** Bộ chuyển tab Lái xe / Văn phòng (kiểu toggle view ở lịch). Nhân viên (canSeeOffice=false) chỉ thấy Lái xe. */
export default function StaffTabs({
  drivers,
  staff,
  rates = [],
  canSeeOffice,
}: {
  drivers: Driver[];
  staff: OfficeStaff[];
  rates?: SalaryRate[];
  canSeeOffice: boolean;
}) {
  const [tab, setTab] = useState<"driver" | "office">("driver");
  const [query, setQuery] = useState("");
  const activeDrivers = activeOnly(drivers);
  const activeStaff = activeOnly(staff);

  const toolbar = (
    <Toolbar>
      {canSeeOffice && (
        <FilterTabs
          value={tab}
          onChange={setTab}
          ariaLabel="Chuyển nhóm nhân sự"
          options={[
            ["driver", `Lái xe (${activeDrivers.length})`],
            ["office", `Văn phòng (${activeStaff.length})`],
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
        <DriverList drivers={activeDrivers} rates={rates} query={query} />
      ) : (
        <OfficeStaffList staff={activeStaff} rates={rates} query={query} />
      )}
    </div>
  );
}
