import ExpenseScreen from "@/components/expenses/ExpenseScreen";
import { getOtherExpenses } from "@/services/expenses";
import { monthKeyOf, todayStr } from "@/utils/format";

export default async function OtherExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const sp = await searchParams;
  const monthKey = sp.m || monthKeyOf(todayStr());
  const entries = await getOtherExpenses(monthKey);

  return <ExpenseScreen entries={entries} monthKey={monthKey} />;
}
