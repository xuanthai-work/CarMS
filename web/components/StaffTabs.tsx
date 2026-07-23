"use client";

import { useState } from "react";
import type { Driver, OfficeStaff } from "@/lib/types";
import DriverList from "@/components/DriverList";
import OfficeStaffList from "@/components/OfficeStaffList";
import FilterTabs from "@/components/FilterTabs";

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

  // Không được xem Văn phòng → chỉ hiện danh sách lái xe, bỏ luôn bộ chuyển tab.
  if (!canSeeOffice) return <DriverList drivers={drivers} />;

  return (
    <div className="space-y-4">
      <FilterTabs
        value={tab}
        onChange={setTab}
        ariaLabel="Chuyển nhóm nhân sự"
        options={[
          ["driver", `Lái xe (${drivers.length})`],
          ["office", `Văn phòng (${staff.length})`],
        ] as const}
      />

      {tab === "driver" ? <DriverList drivers={drivers} /> : <OfficeStaffList staff={staff} />}
    </div>
  );
}
