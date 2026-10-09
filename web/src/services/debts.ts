import { prisma } from "@/lib/prisma";
import type { PartnerDebt, PartnerDebtPaymentStatus } from "@/types";
import { addMonth } from "@/utils/format";

export async function getPartnerDebts(monthKey?: string | null): Promise<PartnerDebt[]> {
  const where = monthKey
    ? {
        workDate: {
          gte: `${monthKey}-01`,
          lt: `${addMonth(monthKey, 1)}-01`,
        },
      }
    : undefined; // null/không truyền: lấy tất cả các khoản (để xem nợ tồn đọng)

  const rows = await prisma.partnerDebt.findMany({
    where,
    include: {
      trip: {
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          outboundFrom: true,
          outboundTo: true,
          outboundDate: true,
          returnDate: true,
        },
      },
    },
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    tripId: r.tripId,
    partnerName: r.partnerName,
    workDate: r.workDate,
    amount: r.amount,
    paymentStatus: r.paymentStatus as PartnerDebtPaymentStatus,
    paymentDate: r.paymentDate,
    payerName: r.payerName,
    note: r.note ?? "",
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    trip: r.trip ?? undefined,
  }));
}
