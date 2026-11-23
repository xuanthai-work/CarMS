import type { OtherExpense as OtherExpenseRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OtherExpense, OtherExpensePaymentStatus } from "@/types";
import { monthRange } from "@/utils/format";
import { type PaymentTotals, sumByMonth, sumByPaymentStatus } from "@/utils/totals";

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
        date: monthRange(monthKey),
      }
    : undefined;
  const rows = await prisma.otherExpense.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toOtherExpense);
}

export async function getOtherExpenseMonthTotals(monthKey: string): Promise<PaymentTotals> {
  const entries = await getOtherExpenses(monthKey);
  return sumByPaymentStatus(entries);
}

/** Tổng tiền chi phí khác theo từng tháng (YYYY-MM) — 1 query, gom ở JS (như getFuelMonthMap). */
export async function getOtherExpenseMonthMap(): Promise<Map<string, number>> {
  const rows = await prisma.otherExpense.findMany({ select: { date: true, amount: true } });
  return sumByMonth(rows, (r) => r.date, (r) => r.amount);
}
