import type {
  SalaryMonth as SalaryMonthRow,
  PartnerPayout as PartnerPayoutRow,
  SalaryAdvance as SalaryAdvanceRow,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalaryMonth, PartnerPayout, SalaryAdvance, SalaryPersonType } from "@/types";
import { monthRange } from "@/utils/format";

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
    ? { workDate: monthRange(monthKey) }
    : undefined;
  const rows = await prisma.partnerPayout.findMany({
    where,
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toPartnerPayout);
}

function toSalaryAdvance(r: SalaryAdvanceRow): SalaryAdvance {
  return {
    id: r.id,
    personType: r.personType as SalaryPersonType,
    personId: r.personId,
    date: r.date,
    amount: r.amount,
    note: r.note ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getSalaryAdvances(monthKey?: string): Promise<SalaryAdvance[]> {
  const where = monthKey ? { date: monthRange(monthKey) } : undefined;
  const rows = await prisma.salaryAdvance.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toSalaryAdvance);
}
