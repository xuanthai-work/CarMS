import SalaryScreen from "@/components/salary/SalaryScreen";
import { getOfficeStaff } from "@/services/staff";
import { getDrivers } from "@/services/drivers";
import { getSalaryMonths, getPartnerPayouts } from "@/services/salary";
import { getCurrentStaff } from "@/services/auth";
import { isManager } from "@/utils/office";
import { salariedPeople, buildSalaryRows, visibleSalaryRows, partnerPayoutMonthTotal } from "@/utils/salary";
import { monthKeyOf, todayStr } from "@/utils/format";

export default async function LuongPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const monthKey = sp.m || monthKeyOf(todayStr());

  const staff = await getCurrentStaff(); // cache theo request
  const manager = isManager(staff?.position ?? null);

  const [office, drivers, months, payouts] = await Promise.all([
    getOfficeStaff(),
    getDrivers(),
    getSalaryMonths(monthKey),
    getPartnerPayouts(monthKey),
  ]);

  const allRows = buildSalaryRows(salariedPeople(office, drivers), months);
  const rows = visibleSalaryRows(allRows, manager);
  const payoutTotal = partnerPayoutMonthTotal(payouts, monthKey);

  return (
    <SalaryScreen
      rows={rows}
      payouts={payouts}
      drivers={drivers}
      monthKey={monthKey}
      isManager={manager}
      payoutTotal={payoutTotal}
    />
  );
}
