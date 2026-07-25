"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/services/auth";
import { s, optStr } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";

export async function saveVehicle(fd: FormData): Promise<void> {
  await requireStaff();
  const id = s(fd, "id");
  const data = {
    plate: s(fd, "plate"),
    seats: Number(s(fd, "seats")) || null,
    status: s(fd, "status") || "active",
    type: s(fd, "type") || "own",
    phone: optStr(fd, "phone"),
    inspectionDue: optStr(fd, "inspectionDue"),
    insuranceDue: optStr(fd, "insuranceDue"),
    note: s(fd, "note"),
  };
  if (id) {
    await prisma.vehicle.update({ where: { id }, data });
  } else {
    await prisma.vehicle.create({ data: { id: newId("v"), ...data } });
  }
  revalidateAll();
}

export async function deleteVehicle(fd: FormData): Promise<void> {
  await requireStaff();
  const id = s(fd, "id");
  await prisma.vehicle.delete({ where: { id } });
  revalidateAll();
}

/** Tạo nhanh 1 xe (chỉ biển số) từ combobox trong form chuyến — mặc định "cộng tác ngoài"; sửa sau ở trang Xe. */
export async function quickCreateVehicle(plate: string): Promise<{ id: string; label: string }> {
  await requireStaff();
  const p = plate.trim();
  const id = newId("v");
  await prisma.vehicle.create({ data: { id, plate: p, status: "active", type: "partner" } });
  revalidateAll();
  return { id, label: p };
}
