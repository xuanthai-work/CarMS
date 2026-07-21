import { getDrivers } from "@/lib/db";
import DriverList from "@/components/DriverList";

export default async function NhanSuPage() {
  const drivers = await getDrivers();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý nhân sự</h1>
        <p className="text-sm text-slate-500">{drivers.length} lái xe</p>
      </div>
      <DriverList drivers={drivers} />
    </div>
  );
}
