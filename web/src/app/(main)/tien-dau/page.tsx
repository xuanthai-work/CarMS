import FuelScreen from "@/components/fuel/FuelScreen";
import { getFuelEntries } from "@/services/fuel";
import { getVehicles } from "@/services/vehicles";
import { monthKeyOf, todayStr } from "@/utils/format";

export default async function FuelPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const monthKey = sp.m || monthKeyOf(todayStr());
  const [vehicles, entries] = await Promise.all([getVehicles(), getFuelEntries(monthKey)]);

  return <FuelScreen entries={entries} vehicles={vehicles} monthKey={monthKey} />;
}
