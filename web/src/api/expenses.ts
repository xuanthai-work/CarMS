"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

export async function saveOtherExpense(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = s(fd, "id");
  const date = s(fd, "date");
  const title = s(fd, "title");
  if (!date) return fail("Vui lòng chọn ngày chi.");
  if (!title) return fail("Vui lòng nhập nội dung khoản chi.");
  const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
  if (!amt) return fail("Vui lòng nhập số tiền.");

  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  const paymentDate = paymentStatus === "paid" ? optStr(fd, "paymentDate") ?? date : null;

  const data = {
    date,
    title,
    category: s(fd, "category") || "other",
    amount: Number(amt),
    paymentStatus,
    paymentDate,
    payerName: s(fd, "payerName"),
    note: s(fd, "note"),
  };

  if (id) {
    await prisma.otherExpense.update({ where: { id }, data });
  } else {
    await prisma.otherExpense.create({ data: { id: newId("exp"), ...data } });
  }
  revalidateAll();
  return OK;
}

export async function deleteOtherExpense(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  await prisma.otherExpense.delete({ where: { id } });
  revalidateAll();
}
