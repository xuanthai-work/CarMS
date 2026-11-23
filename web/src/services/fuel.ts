import type { FuelEntry as FuelEntryRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { FuelEntry, FuelPaymentStatus } from "@/types";
import { monthRange } from "@/utils/format";
import { type PaymentTotals, sumByMonth, sumByPaymentStatus } from "@/utils/totals";

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
        refuelDate: monthRange(monthKey),
      }
    : undefined;
  const rows = await prisma.fuelEntry.findMany({
    where,
    orderBy: [{ refuelDate: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toFuelEntry);
}

export async function getFuelMonthTotals(monthKey: string): Promise<PaymentTotals> {
  const entries = await getFuelEntries(monthKey);
  return sumByPaymentStatus(entries);
}

/** Tổng tiền dầu theo từng tháng (YYYY-MM) — 1 query, gom ở JS (thay vì N query/tháng). */
export async function getFuelMonthMap(): Promise<Map<string, number>> {
  const rows = await prisma.fuelEntry.findMany({ select: { refuelDate: true, amount: true } });
  return sumByMonth(rows, (r) => r.refuelDate, (r) => r.amount);
}
