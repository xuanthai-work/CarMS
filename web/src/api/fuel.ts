"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/services/auth";
import { s, optStr, reqNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";

export async function saveFuelEntry(fd: FormData): Promise<void> {
  await requireStaff();
  const id = s(fd, "id");
  const paymentStatus = (s(fd, "paymentStatus") || "unpaid") as "paid" | "unpaid";
  const vehicleId = s(fd, "vehicleId");
  const refuelDate = s(fd, "refuelDate");
  if (!vehicleId) throw new Error("Thiếu xe cho phiếu dầu");
  if (!refuelDate) throw new Error("Thiếu ngày đổ");
  const paymentDate = paymentStatus === "paid" ? optStr(fd, "paymentDate") ?? refuelDate : null;
  const data = {
    vehicleId,
    refuelDate,
    amount: reqNum(fd, "amount"),
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
}

export async function deleteFuelEntry(fd: FormData): Promise<void> {
  await requireStaff();
  const id = s(fd, "id");
  await prisma.fuelEntry.delete({ where: { id } });
  revalidateAll();
}
