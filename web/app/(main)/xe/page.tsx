import { readDb } from "@/lib/db";
import VehicleList from "@/components/VehicleList";

export default async function QuanLyXePage() {
  const db = readDb();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý xe</h1>
        <p className="text-sm text-slate-500">{db.vehicles.length} xe</p>
      </div>
      <VehicleList vehicles={db.vehicles} />
    </div>
  );
}
