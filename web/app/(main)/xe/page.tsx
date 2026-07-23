import { getVehicles } from "@/lib/db";
import VehicleList from "@/components/VehicleList";

export default async function QuanLyXePage() {
  const vehicles = await getVehicles();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Đội xe</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Quản lý xe</h1>
      </div>
      <VehicleList vehicles={vehicles} />
    </div>
  );
}
