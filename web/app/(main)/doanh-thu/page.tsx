import { getFuelMonthMap, getVehicles, getDrivers, getTrips } from "@/lib/db";
import RevenueScreen from "@/components/RevenueScreen";
import { monthKeyOf, todayStr } from "@/lib/format";

export default async function DoanhThuPage() {
  const [vehicles, drivers, trips, fuelMonthMap] = await Promise.all([
    getVehicles(),
    getDrivers(),
    getTrips(),
    getFuelMonthMap(),
  ]);
  // Tính tháng mặc định phía server để tránh lệch SSR/CSR (như trang /lich).
  const defaultMonthKey = monthKeyOf(todayStr());
  return (
    <RevenueScreen
      trips={trips}
      vehicles={vehicles}
      drivers={drivers}
      defaultMonthKey={defaultMonthKey}
      fuelTotalsByMonth={Object.fromEntries(fuelMonthMap)}
    />
  );
}
