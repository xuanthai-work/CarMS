"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff, requireManager } from "@/services/auth";
import { s, optStr, optNum, reqNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";

/** Lương cơ bản hiện tại của người (để snapshot khi tạo dòng lương tháng). */
async function lookupBaseSalary(personType: string, personId: string): Promise<number> {
  if (personType === "office") {
    const p = await prisma.officeStaff.findUnique({ where: { id: personId } });
    return p?.baseSalary ?? 0;
  }
  const d = await prisma.driver.findUnique({ where: { id: personId } });
  return d?.baseSalary ?? 0;
}

/** Sửa điều chỉnh lương tháng (thưởng/phụ cấp, tạm ứng/khấu trừ, ghi chú). Upsert theo (personType, personId, monthKey). */
export async function saveSalaryMonth(fd: FormData): Promise<void> {
  const personType = s(fd, "personType");
  if (personType === "office") await requireManager();
  else await requireStaff();

  const personId = s(fd, "personId");
  const monthKey = s(fd, "monthKey");
  const baseSalary = await lookupBaseSalary(personType, personId);

  // Gộp điều chỉnh + trạng thái trả (paymentStatus) + ngày trả (paidDate) vào một lần ghi.
  // fd.has(...) để nơi gọi không kèm trường thì KHÔNG ghi đè giá trị đang có.
  const fields: {
    additions: number;
    deductions: number;
    note: string;
    paid?: boolean;
    paidDate?: string | null;
  } = {
    additions: optNum(fd, "additions") ?? 0,
    deductions: optNum(fd, "deductions") ?? 0,
    note: s(fd, "note"),
  };
  if (fd.has("paymentStatus")) fields.paid = s(fd, "paymentStatus") === "paid";
  if (fd.has("paidDate")) fields.paidDate = optStr(fd, "paidDate");

  await prisma.salaryMonth.upsert({
    where: { personType_personId_monthKey: { personType, personId, monthKey } },
    create: { id: newId("sm"), personType, personId, monthKey, baseSalary, ...fields },
    update: fields, // giữ nguyên baseSalary snapshot cũ
  });
  revalidateAll();
}

/** Tạo/sửa phiếu trả công lái xe đối tác. */
export async function savePartnerPayout(fd: FormData): Promise<void> {
  await requireStaff();
  const id = s(fd, "id");
  const data = {
    driverId: s(fd, "driverId"),
    workDate: s(fd, "workDate"),
    amount: reqNum(fd, "amount"),
    paymentStatus: s(fd, "paymentStatus") || "unpaid",
    paymentDate: optStr(fd, "paymentDate"),
    payerName: s(fd, "payerName"),
    note: s(fd, "note"),
  };
  if (id) await prisma.partnerPayout.update({ where: { id }, data });
  else await prisma.partnerPayout.create({ data: { id: newId("pp"), ...data } });
  revalidateAll();
}

export async function deletePartnerPayout(fd: FormData): Promise<void> {
  await requireStaff();
  await prisma.partnerPayout.delete({ where: { id: s(fd, "id") } });
  revalidateAll();
}
