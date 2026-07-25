import { getFuelMonthMap } from "@/services/fuel";
import { getVehicles } from "@/services/vehicles";
import { getDrivers } from "@/services/drivers";
import { getTrips } from "@/services/trips";
import { getOfficeStaff } from "@/services/staff";
import { getSalaryMonths, getPartnerPayouts } from "@/services/salary";
import RevenueScreen from "@/components/revenue/RevenueScreen";
import { monthKeyOf, todayStr } from "@/utils/format";
import { requireManager } from "@/services/auth";
import { salariedPeople, buildSalaryRows, salaryCostForMonth } from "@/utils/salary";

export default async function DoanhThuPage() {
  await requireManager();
  // Tính tháng mặc định phía server để tránh lệch SSR/CSR (như trang /lich).
  const defaultMonthKey = monthKeyOf(todayStr());
  const [vehicles, drivers, trips, fuelMonthMap, office, months, payouts] = await Promise.all([
    getVehicles(),
    getDrivers(),
    getTrips(),
    getFuelMonthMap(),
    getOfficeStaff(),
    getSalaryMonths(),
    getPartnerPayouts(),
  ]);

  const people = salariedPeople(office, drivers);
  const salaryMonths = new Set([defaultMonthKey, ...months.map((month) => month.monthKey), ...payouts.map((payout) => payout.workDate.slice(0, 7))]);
  const salaryCostByMonth = Object.fromEntries(
    Array.from(salaryMonths, (monthKey) => {
      const rows = buildSalaryRows(people, months.filter((month) => month.monthKey === monthKey));
      return [monthKey, salaryCostForMonth(rows, payouts, monthKey)];
    })
  );

  return (
    <RevenueScreen
      trips={trips}
      vehicles={vehicles}
      drivers={drivers}
      defaultMonthKey={defaultMonthKey}
      fuelTotalsByMonth={Object.fromEntries(fuelMonthMap)}
      salaryCostByMonth={salaryCostByMonth}
    />
  );
}
