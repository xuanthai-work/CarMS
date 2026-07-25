import Overview from "@/components/dashboard/Overview";
import { getTrips } from "@/services/trips";
import { getVehicles } from "@/services/vehicles";
import { getDrivers } from "@/services/drivers";
import { monthKeyOf, todayStr } from "@/utils/format";

export default async function HomePage() {
  const today = todayStr();
  const monthKey = monthKeyOf(today);

  const [trips, vehicles, drivers] = await Promise.all([getTrips(), getVehicles(), getDrivers()]);

  return (
    <Overview trips={trips} vehicles={vehicles} drivers={drivers} today={today} monthKey={monthKey} />
  );
}
