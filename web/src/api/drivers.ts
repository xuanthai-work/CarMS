"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { recordSalaryRate, validateSoftDeleteEndDate } from "@/services/salary";
import { s, optStr, optNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

export async function saveDriver(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const name = s(fd, "name").trim();
  if (!name) return fail("Vui lòng nhập họ tên lái xe.");

  const id = s(fd, "id");
  const data = {
    name,
    phone: optStr(fd, "phone"),
    licenseClass: s(fd, "licenseClass"),
    type: s(fd, "type") || "own",
    baseSalary: optNum(fd, "baseSalary"),
    startDate: optStr(fd, "startDate"),
    note: s(fd, "note"),
  };
  if (id) {
    const prev = await prisma.driver.findUnique({
      where: { id },
      select: { baseSalary: true, deletedAt: true },
    });
    if (!prev || prev.deletedAt) return fail("Lái xe này đã bị xóa, không thể chỉnh sửa.");
    const oldSalary = prev.baseSalary ?? 0;
    const newSalary = data.baseSalary ?? 0;
    const salaryChanged = newSalary > 0 && newSalary !== oldSalary;
    const effectiveFrom = salaryChanged ? s(fd, "salaryEffectiveFrom") : "";
    if (salaryChanged && !effectiveFrom) {
      return fail("Vui lòng chọn ngày hiệu lực của mức lương mới.");
    }
    await prisma.$transaction(async (tx) => {
      await tx.driver.update({ where: { id }, data });
      if (salaryChanged) {
        await recordSalaryRate(tx, {
          personType: "driver",
          personId: id,
          oldSalary,
          newSalary,
          effectiveFrom,
        });
      }
    });
  } else {
    await prisma.driver.create({ data: { id: newId("d"), ...data } });
  }
  revalidateAll();
  return OK;
}

export async function deleteDriver(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = s(fd, "id");
  const driver = await prisma.driver.findUnique({
    where: { id },
    select: { id: true, type: true, startDate: true, deletedAt: true },
  });
  if (!driver || driver.deletedAt) return fail("Lái xe không tồn tại hoặc đã bị xóa.");

  if (driver.type === "own") {
    const check = await validateSoftDeleteEndDate("driver", id, optStr(fd, "endDate"), driver.startDate);
    if ("error" in check) return fail(check.error);
    await prisma.driver.update({ where: { id }, data: { deletedAt: new Date(), endDate: check.endDate } });
  } else {
    await prisma.driver.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  revalidateAll();
  return OK;
}

/** Tạo nhanh 1 lái xe (chỉ tên) từ combobox trong form chuyến — mặc định "cộng tác ngoài". */
export async function quickCreateDriver(name: string): Promise<{ id: string; label: string }> {
  await requireEditor();
  const n = name.trim();
  const id = newId("d");
  await prisma.driver.create({ data: { id, name: n, type: "partner" } });
  revalidateAll();
  return { id, label: n };
}
