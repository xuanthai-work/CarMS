import type { OtherExpense as OtherExpenseRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OtherExpense, OtherExpensePaymentStatus } from "@/types";
import { addMonth } from "@/utils/format";

function toOtherExpense(r: OtherExpenseRow): OtherExpense {
  return {
    id: r.id,
    date: r.date,
    title: r.title,
    category: r.category,
    amount: r.amount,
    paymentStatus: r.paymentStatus as OtherExpensePaymentStatus,
    paymentDate: r.paymentDate,
    payerName: r.payerName,
    note: r.note ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getOtherExpenses(monthKey?: string): Promise<OtherExpense[]> {
  const where = monthKey
    ? {
        date: {
          gte: `${monthKey}-01`,
          lt: `${addMonth(monthKey, 1)}-01`,
        },
      }
    : undefined;
  const rows = await prisma.otherExpense.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toOtherExpense);
}

export async function getOtherExpenseMonthTotals(monthKey: string): Promise<{
  total: number;
  paid: number;
  unpaid: number;
  count: number;
}> {
  const entries = await getOtherExpenses(monthKey);
  return entries.reduce(
    (acc, entry) => {
      acc.total += entry.amount;
      acc.count += 1;
      if (entry.paymentStatus === "paid") acc.paid += entry.amount;
      else acc.unpaid += entry.amount;
      return acc;
    },
    { total: 0, paid: 0, unpaid: 0, count: 0 }
  );
}
