import { getFuelEntries } from "@/services/fuel";
import { getOtherExpenses } from "@/services/expenses";
import { getVehicles } from "@/services/vehicles";
import { getDrivers } from "@/services/drivers";
import { getTrips } from "@/services/trips";
import { getOfficeStaff } from "@/services/staff";
import { getSalaryMonths, getPartnerPayouts } from "@/services/salary";
import { monthKeyOf, todayStr } from "@/utils/format";
import { salaryCostByMonth } from "@/utils/salary";
import { buildCostLedger, type CostGroup } from "@/utils/costLedger";
import CostLedgerScreen from "@/components/costs/CostLedgerScreen";

const VALID_GROUPS = new Set<CostGroup>(["fuel", "partner", "toll", "other", "salary"]);

export default async function TongChiPhiPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; g?: string }>;
}) {
  const sp = await searchParams;
  const monthKey = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : monthKeyOf(todayStr());
  const initialGroup: "all" | CostGroup =
    sp.g && VALID_GROUPS.has(sp.g as CostGroup) ? (sp.g as CostGroup) : "all";

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

  return (
    <CostLedgerScreen
      ledger={ledger}
      monthKey={monthKey}
      fuel={fuel}
      expenses={expenses}
      vehicles={vehicles}
      initialGroup={initialGroup}
    />
  );
}
