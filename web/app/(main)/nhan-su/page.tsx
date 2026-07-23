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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Đội ngũ vận hành</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Quản lý nhân sự</h1>
      </div>
      <StaffTabs drivers={drivers} staff={office} canSeeOffice={manager} />
    </div>
  );
}
