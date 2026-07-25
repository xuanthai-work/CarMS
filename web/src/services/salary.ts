import type {
  SalaryMonth as SalaryMonthRow,
  PartnerPayout as PartnerPayoutRow,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalaryMonth, PartnerPayout } from "@/types";
import { addMonth } from "@/utils/format";

function toSalaryMonth(r: SalaryMonthRow): SalaryMonth {
  return {
    id: r.id,
    personType: r.personType as SalaryMonth["personType"],
    personId: r.personId,
    monthKey: r.monthKey,
    baseSalary: r.baseSalary,
    additions: r.additions,
    deductions: r.deductions,
    note: r.note ?? "",
    paid: r.paid,
    paidDate: r.paidDate,
  };
}

function toPartnerPayout(r: PartnerPayoutRow): PartnerPayout {
  return {
    id: r.id,
    driverId: r.driverId,
    workDate: r.workDate,
    amount: r.amount,
    paymentStatus: r.paymentStatus as PartnerPayout["paymentStatus"],
    paymentDate: r.paymentDate,
    payerName: r.payerName,
    note: r.note ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getSalaryMonths(monthKey?: string): Promise<SalaryMonth[]> {
  const rows = await prisma.salaryMonth.findMany({
    where: monthKey ? { monthKey } : undefined,
  });
  return rows.map(toSalaryMonth);
}

export async function getPartnerPayouts(monthKey?: string): Promise<PartnerPayout[]> {
  const where = monthKey
    ? { workDate: { gte: `${monthKey}-01`, lt: `${addMonth(monthKey, 1)}-01` } }
    : undefined;
  const rows = await prisma.partnerPayout.findMany({
    where,
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toPartnerPayout);
}
