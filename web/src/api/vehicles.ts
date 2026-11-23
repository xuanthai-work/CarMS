"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, uniqueViolationFields, type ActionResult } from "@/utils/actionResult";

export async function saveVehicle(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const plate = s(fd, "plate").trim();
  if (!plate) return fail("Vui lòng nhập biển số xe.");

  const id = s(fd, "id");
  const data = {
    plate,
    seats: Number(s(fd, "seats")) || null,
    status: s(fd, "status") || "active",
    type: s(fd, "type") || "own",
    phone: optStr(fd, "phone"),
    inspectionDue: optStr(fd, "inspectionDue"),
    insuranceDue: optStr(fd, "insuranceDue"),
    note: s(fd, "note"),
  };

  try {
    if (id) {
      await prisma.vehicle.update({ where: { id }, data });
    } else {
      await prisma.vehicle.create({ data: { id: newId("v"), ...data } });
    }
  } catch (e) {
    if (uniqueViolationFields(e) !== null) {
      return fail("Biển số này đã có trong danh sách xe.");
    }
    throw e;
  }

  revalidateAll();
  return OK;
}

export async function deleteVehicle(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  await prisma.vehicle.delete({ where: { id } });
  revalidateAll();
}

/** Tạo nhanh 1 xe (chỉ biển số) từ combobox trong form chuyến — mặc định "cộng tác ngoài"; sửa sau ở trang Xe. */
export async function quickCreateVehicle(plate: string): Promise<{ id: string; label: string }> {
  await requireEditor();
  const p = plate.trim();
  const existing = await prisma.vehicle.findUnique({ where: { plate: p } });
  if (existing) {
    return { id: existing.id, label: existing.plate };
  }
  const id = newId("v");
  await prisma.vehicle.create({ data: { id, plate: p, status: "active", type: "partner" } });
  revalidateAll();
  return { id, label: p };
}
