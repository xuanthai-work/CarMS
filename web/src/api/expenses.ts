"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr, reqNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";

export async function saveOtherExpense(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  const date = s(fd, "date");
  const title = s(fd, "title");
  if (!date) throw new Error("Thiếu ngày chi");
  if (!title) throw new Error("Thiếu nội dung khoản chi");

  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  const paymentDate = paymentStatus === "paid" ? optStr(fd, "paymentDate") ?? date : null;

  const data = {
    date,
    title,
    category: s(fd, "category") || "other",
    amount: reqNum(fd, "amount"),
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
}

export async function deleteOtherExpense(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  await prisma.otherExpense.delete({ where: { id } });
  revalidateAll();
}
