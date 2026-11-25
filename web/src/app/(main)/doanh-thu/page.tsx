import { getFuelMonthMap } from "@/services/fuel";
import { getOtherExpenseMonthMap } from "@/services/expenses";
import { getVehicles } from "@/services/vehicles";
import { getDrivers } from "@/services/drivers";
import { getTrips } from "@/services/trips";
import { getOfficeStaff } from "@/services/staff";
import { getSalaryMonths, getPartnerPayouts, getSalaryAdvances } from "@/services/salary";
import RevenueScreen from "@/components/revenue/RevenueScreen";
import { monthKeyOf, monthsBetween, todayStr } from "@/utils/format";
import { requireManager } from "@/services/auth";
import { salaryCostByMonth } from "@/utils/salary";
import { revenueMonthKey } from "@/utils/revenue";

export default async function DoanhThuPage() {
  await requireManager();
  // Tính tháng mặc định phía server để tránh lệch SSR/CSR (như trang /lich).
  const defaultMonthKey = monthKeyOf(todayStr());
  const [vehicles, drivers, trips, fuelMonthMap, otherExpenseMonthMap, office, months, payouts, advances] =
    await Promise.all([
      getVehicles(),
      getDrivers(),
      getTrips(),
      getFuelMonthMap(),
      getOtherExpenseMonthMap(),
      getOfficeStaff(),
      getSalaryMonths(),
      getPartnerPayouts(),
      getSalaryAdvances(),
    ]);

  const allMonths = [
    defaultMonthKey,
    ...trips.map(revenueMonthKey),
    ...fuelMonthMap.keys(),
    ...otherExpenseMonthMap.keys(),
    ...months.map((m) => m.monthKey),
    ...payouts.map((p) => p.workDate.slice(0, 7)),
    ...advances.map((a) => a.date.slice(0, 7)),
  ].filter((m) => /^\d{4}-\d{2}$/.test(m));

  let minKey = defaultMonthKey;
  let maxKey = defaultMonthKey;
  for (const m of allMonths) {
    if (m < minKey) minKey = m;
    if (m > maxKey) maxKey = m;
  }

  const monthKeys = monthsBetween(minKey, maxKey);
  const salaryCostBreakdownByMonth = salaryCostByMonth(office, drivers, months, payouts, monthKeys, advances);

  return (
    <RevenueScreen
      trips={trips}
      vehicles={vehicles}
      drivers={drivers}
      defaultMonthKey={defaultMonthKey}
      fuelTotalsByMonth={Object.fromEntries(fuelMonthMap)}
      otherExpenseTotalsByMonth={Object.fromEntries(otherExpenseMonthMap)}
      salaryCostBreakdownByMonth={salaryCostBreakdownByMonth}
    />
  );
}
