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
      const cur = await prisma.vehicle.findUnique({ where: { id }, select: { deletedAt: true } });
      if (!cur || cur.deletedAt) return fail("Xe này đã bị xóa, không thể chỉnh sửa.");
      await prisma.vehicle.update({ where: { id }, data });
    } else {
      const existing = await prisma.vehicle.findUnique({
        where: { plate },
        select: { id: true, deletedAt: true },
      });
      if (existing) {
        if (!existing.deletedAt) return fail("Biển số này đã có trong danh sách xe.");
        await prisma.vehicle.update({ where: { id: existing.id }, data: { ...data, deletedAt: null } });
      } else {
        await prisma.vehicle.create({ data: { id: newId("v"), ...data } });
      }
    }
  } catch (e) {
    if (uniqueViolationFields(e) !== null) {
      if (id) {
        const dup = await prisma.vehicle.findUnique({ where: { plate }, select: { deletedAt: true } });
        if (dup?.deletedAt) {
          return fail("Biển số này thuộc một xe đã xóa. Thêm mới xe với biển số đó để khôi phục.");
        }
      }
      return fail("Biển số này đã có trong danh sách xe.");
    }
    throw e;
  }

  revalidateAll();
  return OK;
}

export async function deleteVehicle(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = s(fd, "id");
  await prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidateAll();
  return OK;
}

/** Tạo nhanh 1 xe (chỉ biển số) từ combobox trong form chuyến — mặc định "cộng tác ngoài"; sửa sau ở trang Xe. */
export async function quickCreateVehicle(plate: string): Promise<{ id: string; label: string }> {
  await requireEditor();
  const p = plate.trim();
  const existing = await prisma.vehicle.findUnique({ where: { plate: p } });
  if (existing) {
    if (existing.deletedAt) {
      await prisma.vehicle.update({ where: { id: existing.id }, data: { deletedAt: null } });
      revalidateAll();
    }
    return { id: existing.id, label: existing.plate };
  }
  const id = newId("v");
  await prisma.vehicle.create({ data: { id, plate: p, status: "active", type: "partner" } });
  revalidateAll();
  return { id, label: p };
}
