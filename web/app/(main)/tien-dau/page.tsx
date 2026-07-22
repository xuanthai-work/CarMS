import FuelScreen from "@/components/FuelScreen";
import { getFuelEntries, getVehicles } from "@/lib/db";
import { monthKeyOf, todayStr } from "@/lib/format";

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
