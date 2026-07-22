"use client";

import { useState } from "react";
import type { Driver, OfficeStaff } from "@/lib/types";
import DriverList from "@/components/DriverList";
import OfficeStaffList from "@/components/OfficeStaffList";

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
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm font-medium shadow-sm">
        {(
          [
            ["driver", `Lái xe (${drivers.length})`],
            ["office", `Văn phòng (${staff.length})`],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setTab(val)}
            className={`rounded-md px-4 py-1.5 transition ${
              tab === val ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "driver" ? <DriverList drivers={drivers} /> : <OfficeStaffList staff={staff} />}
    </div>
  );
}
