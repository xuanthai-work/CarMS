import Overview from "@/components/Overview";
import { getTrips, getVehicles, getDrivers } from "@/lib/db";
import { monthKeyOf, todayStr } from "@/lib/format";

export default async function HomePage() {
  const today = todayStr();
  const monthKey = monthKeyOf(today);

  const [trips, vehicles, drivers] = await Promise.all([getTrips(), getVehicles(), getDrivers()]);

  return (
    <Overview trips={trips} vehicles={vehicles} drivers={drivers} today={today} monthKey={monthKey} />
  );
}
