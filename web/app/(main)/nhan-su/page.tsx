import { getDrivers, getOfficeStaff } from "@/lib/db";
import StaffTabs from "@/components/StaffTabs";
import { requireStaff } from "@/lib/auth";
import { isManager } from "@/lib/office";
import type { OfficeStaff } from "@/lib/types";

export default async function NhanSuPage() {
  const me = await requireStaff();
  const manager = isManager(me.position);
  // Nhân viên chỉ xem tab Lái xe → KHÔNG tải dữ liệu nhân sự văn phòng (lương/CCCD/BHXH).
  const [drivers, office] = await Promise.all([
    getDrivers(),
    manager ? getOfficeStaff() : Promise.resolve([] as OfficeStaff[]),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
      <StaffTabs drivers={drivers} staff={office} canSeeOffice={manager} />
    </div>
  );
}
