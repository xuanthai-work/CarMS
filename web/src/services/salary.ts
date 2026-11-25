import type {
  SalaryMonth as SalaryMonthRow,
  PartnerPayout as PartnerPayoutRow,
  SalaryAdvance as SalaryAdvanceRow,
  SalaryRate as SalaryRateRow,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SalaryMonth, PartnerPayout, SalaryAdvance, SalaryPersonType, SalaryRate } from "@/types";
import { monthRange } from "@/utils/format";
import { newId } from "@/utils/id";

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

function toSalaryRate(r: SalaryRateRow): SalaryRate {
  return {
    id: r.id,
    personType: r.personType as SalaryPersonType,
    personId: r.personId,
    effectiveFrom: r.effectiveFrom,
    amount: r.amount,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getSalaryRates(): Promise<SalaryRate[]> {
  const rows = await prisma.salaryRate.findMany({
    orderBy: [{ effectiveFrom: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toSalaryRate);
}

type RateTx = {
  salaryRate: Pick<typeof prisma.salaryRate, "findMany" | "create" | "update">;
};

/** Ghi lịch sử mức lương mới (tự tạo mốc gốc 1970-01-01 nếu chưa có rate nào và lương cũ > 0). */
export async function recordSalaryRate(
  tx: RateTx,
  input: {
    personType: SalaryPersonType;
    personId: string;
    oldSalary: number;
    newSalary: number;
    effectiveFrom: string;
  }
): Promise<void> {
  const { personType, personId, oldSalary, newSalary, effectiveFrom } = input;
  const existing = await tx.salaryRate.findMany({
    where: { personType, personId },
    select: { id: true, effectiveFrom: true },
  });
  if (existing.length === 0 && oldSalary > 0 && effectiveFrom !== "1970-01-01") {
    await tx.salaryRate.create({
      data: { id: newId("sr"), personType, personId, effectiveFrom: "1970-01-01", amount: oldSalary },
    });
  }
  const same = existing.find((r) => r.effectiveFrom === effectiveFrom);
  if (same) {
    await tx.salaryRate.update({ where: { id: same.id }, data: { amount: newSalary } });
  } else {
    await tx.salaryRate.create({
      data: { id: newId("sr"), personType, personId, effectiveFrom, amount: newSalary },
    });
  }
}
