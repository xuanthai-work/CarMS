import DebtScreen from "@/components/debts/DebtScreen";
import { getPartnerDebts } from "@/services/debts";
import { monthKeyOf, todayStr } from "@/utils/format";

export default async function DebtPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const monthKey = sp.m || monthKeyOf(todayStr());
  const viewAll = sp.view === "all";
  const debts = await getPartnerDebts(viewAll ? null : monthKey);

  return <DebtScreen debts={debts} monthKey={monthKey} viewAll={viewAll} />;
}
