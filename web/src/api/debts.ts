"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr } from "@/utils/formData";
import { revalidateAll } from "./revalidate";

export async function setPartnerDebtStatus(
  id: string,
  paymentStatus: "paid" | "unpaid",
  paymentDate?: string | null,
  payerName?: string
): Promise<void> {
  await requireEditor();
  await prisma.partnerDebt.update({
    where: { id },
    data: {
      paymentStatus,
      paymentDate:
        paymentStatus === "paid"
          ? paymentDate ?? new Date().toISOString().slice(0, 10)
          : null,
      payerName: payerName ?? "",
    },
  });
  revalidateAll();
}

export async function updatePartnerDebt(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  await prisma.partnerDebt.update({
    where: { id },
    data: {
      paymentStatus,
      paymentDate: paymentStatus === "paid" ? optStr(fd, "paymentDate") : null,
      payerName: s(fd, "payerName"),
      note: s(fd, "note"),
    },
  });
  revalidateAll();
}
