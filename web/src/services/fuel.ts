import type { FuelEntry as FuelEntryRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FuelEntry, FuelPaymentStatus } from "@/types";
import { addMonth, monthKeyOf } from "@/utils/format";

function toFuelEntry(r: FuelEntryRow): FuelEntry {
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    refuelDate: r.refuelDate,
    amount: r.amount,
    paymentStatus: r.paymentStatus as FuelPaymentStatus,
    paymentDate: r.paymentDate,
    payerName: r.payerName,
    note: r.note ?? "",
    source: r.source,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getFuelEntries(monthKey?: string): Promise<FuelEntry[]> {
  const where = monthKey
    ? {
        refuelDate: {
          gte: `${monthKey}-01`,
          lt: `${addMonth(monthKey, 1)}-01`,
        },
      }
    : undefined;
  const rows = await prisma.fuelEntry.findMany({
    where,
    orderBy: [{ refuelDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toFuelEntry);
}

export async function getFuelMonthTotals(monthKey: string): Promise<{
  total: number;
  paid: number;
  unpaid: number;
  count: number;
}> {
  const entries = await getFuelEntries(monthKey);
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

/** Tổng tiền dầu theo từng tháng (YYYY-MM) — 1 query, gom ở JS (thay vì N query/tháng). */
export async function getFuelMonthMap(): Promise<Map<string, number>> {
  const rows = await prisma.fuelEntry.findMany({ select: { refuelDate: true, amount: true } });
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = monthKeyOf(r.refuelDate);
    map.set(k, (map.get(k) ?? 0) + r.amount);
  }
  return map;
}

export async function getAvailableFuelMonths(): Promise<string[]> {
  const rows = await prisma.fuelEntry.findMany({
    select: { refuelDate: true },
    distinct: ["refuelDate"],
    orderBy: { refuelDate: "desc" },
  });
  return Array.from(new Set(rows.map((r) => monthKeyOf(r.refuelDate)))).sort().reverse();
}
