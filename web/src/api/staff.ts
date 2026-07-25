"use server";

import { prisma } from "@/lib/prisma";
import { requireManagerEditor } from "@/services/auth";
import { s, optStr, optNum, dayOfMonth } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";

export async function saveOfficeStaff(fd: FormData): Promise<void> {
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
  };
  // Email = tài khoản đăng nhập nên phải là duy nhất; chặn trùng để login không map nhầm người/quyền.
  if (data.email) {
    const dup = await prisma.officeStaff.findFirst({
      where: { email: { equals: data.email, mode: "insensitive" }, ...(id ? { id: { not: id } } : {}) },
      select: { id: true },
    });
    if (dup) throw new Error("Email này đã được gán cho nhân sự khác");
  }
  if (id) {
    await prisma.officeStaff.update({ where: { id }, data });
  } else {
    await prisma.officeStaff.create({ data: { id: newId("os"), ...data } });
  }
  revalidateAll();
}

export async function deleteOfficeStaff(fd: FormData): Promise<void> {
  await requireManagerEditor();
  const id = s(fd, "id");
  await prisma.officeStaff.delete({ where: { id } });
  revalidateAll();
}
