"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/services/auth";
import { s, optStr, optNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";

export async function saveDriver(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    phone: optStr(fd, "phone"),
    licenseClass: s(fd, "licenseClass"),
    type: s(fd, "type") || "own",
    baseSalary: optNum(fd, "baseSalary"),
    note: s(fd, "note"),
  };
  if (id) {
    await prisma.driver.update({ where: { id }, data });
  } else {
    await prisma.driver.create({ data: { id: newId("d"), ...data } });
  }
  revalidateAll();
}

export async function deleteDriver(fd: FormData): Promise<void> {
  await requireEditor();
  const id = s(fd, "id");
  await prisma.driver.delete({ where: { id } });
  revalidateAll();
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
