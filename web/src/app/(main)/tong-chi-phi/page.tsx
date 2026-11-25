import { getFuelEntries } from "@/services/fuel";
import { getOtherExpenses } from "@/services/expenses";
import { getVehicles } from "@/services/vehicles";
import { getDrivers } from "@/services/drivers";
import { getTrips } from "@/services/trips";
import { getOfficeStaff } from "@/services/staff";
import { getSalaryMonths, getPartnerPayouts } from "@/services/salary";
import { requireManager } from "@/services/auth";
import { monthKeyOf, todayStr } from "@/utils/format";
import { salaryCostByMonth } from "@/utils/salary";
import { buildCostLedger } from "@/utils/costLedger";
import CostLedgerScreen from "@/components/costs/CostLedgerScreen";

export default async function TongChiPhiPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  await requireManager();
  const sp = await searchParams;
  const monthKey = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : monthKeyOf(todayStr());

  const [trips, fuel, expenses, vehicles, drivers, office, months, payouts] = await Promise.all([
    getTrips(),
    getFuelEntries(monthKey),
    getOtherExpenses(monthKey),
    getVehicles(),
    getDrivers(),
    getOfficeStaff(),
    getSalaryMonths(monthKey),
    getPartnerPayouts(monthKey),
  ]);

  const salary = salaryCostByMonth(office, drivers, months, payouts, [monthKey])[monthKey];
  const ledger = buildCostLedger({
    monthKey,
    trips,
    fuel,
    expenses,
    vehicles: vehicles.map((v) => ({ id: v.id, plate: v.plate })),
    salary,
  });

  return <CostLedgerScreen ledger={ledger} monthKey={monthKey} />;
}
