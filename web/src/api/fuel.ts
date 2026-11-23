"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

export async function saveFuelEntry(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = s(fd, "id");
  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  const vehicleId = s(fd, "vehicleId");
  const refuelDate = s(fd, "refuelDate");
  if (!vehicleId) return fail("Vui lòng chọn xe.");
  if (!refuelDate) return fail("Vui lòng chọn ngày đổ.");
  const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
  if (!amt) return fail("Vui lòng nhập số tiền.");

  const paymentDate = paymentStatus === "paid" ? optStr(fd, "paymentDate") ?? refuelDate : null;
  const data = {
    vehicleId,
    refuelDate,
    amount: Number(amt),
    paymentStatus,
    paymentDate,
    payerName: s(fd, "payerName"),
    note: s(fd, "note"),
  };
  if (id) {
    await prisma.fuelEntry.update({ where: { id }, data });
  } else {
    await prisma.fuelEntry.create({ data: { id: newId("f"), source: "manual", ...data } });
  }
  revalidateAll();
  return OK;
}

export async function deleteFuelEntry(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  await prisma.fuelEntry.delete({ where: { id } });
  revalidateAll();
}
