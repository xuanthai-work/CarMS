"use server";

import { prisma } from "@/lib/prisma";
import { requireManagerEditor } from "@/services/auth";
import { recordSalaryRate } from "@/services/salary";
import { s, optStr, optNum, dayOfMonth } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

export async function saveOfficeStaff(fd: FormData): Promise<ActionResult> {
  await requireManagerEditor();
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    phone: optStr(fd, "phone"),
    position: s(fd, "position"),
    baseSalary: optNum(fd, "baseSalary"),
    startDate: optStr(fd, "startDate"),
    note: s(fd, "note"),
    dob: optStr(fd, "dob"),
    gender: optStr(fd, "gender"),
    email: optStr(fd, "email"),
    idNumber: optStr(fd, "idNumber"),
    socialInsurance: optStr(fd, "socialInsurance"),
    payday: dayOfMonth(fd, "payday"),
    ...(fd.has("endDate") ? { endDate: optStr(fd, "endDate") } : {}),
  };
  // Email = tài khoản đăng nhập nên phải là duy nhất; chặn trùng để login không map nhầm người/quyền.
  if (data.email) {
    const dup = await prisma.officeStaff.findFirst({
      where: { email: { equals: data.email, mode: "insensitive" }, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    });
    if (dup) return fail("Email này đã được gán cho nhân sự khác.");
  }
  if (id) {
    const prev = await prisma.officeStaff.findUnique({ where: { id }, select: { baseSalary: true } });
    const oldSalary = prev?.baseSalary ?? 0;
    const newSalary = data.baseSalary ?? 0;
    const salaryChanged = newSalary > 0 && newSalary !== oldSalary;
    const effectiveFrom = salaryChanged ? s(fd, "salaryEffectiveFrom") : "";
    if (salaryChanged && !effectiveFrom) {
      return fail("Vui lòng chọn ngày hiệu lực của mức lương mới.");
    }
    await prisma.$transaction(async (tx) => {
      await tx.officeStaff.update({ where: { id }, data });
      if (salaryChanged) {
        await recordSalaryRate(tx, {
          personType: "office",
          personId: id,
          oldSalary,
          newSalary,
          effectiveFrom,
        });
      }
    });
  } else {
    await prisma.officeStaff.create({ data: { id: newId("os"), ...data } });
  }
  revalidateAll();
  return OK;
}

export async function deleteOfficeStaff(fd: FormData): Promise<void> {
  await requireManagerEditor();
  const id = s(fd, "id");
  await prisma.officeStaff.delete({ where: { id } });
  revalidateAll();
}
