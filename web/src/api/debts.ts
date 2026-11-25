"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr } from "@/utils/formData";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

export async function updatePartnerDebt(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = s(fd, "id");
  if (!id) return fail("Không tìm thấy khoản công nợ.");
  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  const paymentDate = paymentStatus === "paid" ? optStr(fd, "paymentDate") : null;
  if (paymentStatus === "paid" && !paymentDate) return fail("Vui lòng chọn ngày trả.");
  try {
    await prisma.partnerDebt.update({
      where: { id },
      data: {
        paymentStatus,
        paymentDate,
        payerName: s(fd, "payerName"),
        note: s(fd, "note"),
      },
    });
  } catch {
    return fail("Không lưu được. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}
