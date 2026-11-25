"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor, requireManagerEditor } from "@/services/auth";
import { s, optStr, optNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";

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
export async function saveSalaryMonth(fd: FormData): Promise<ActionResult> {
  const personType = s(fd, "personType");
  if (personType === "office") await requireManagerEditor();
  else await requireEditor();

  const personId = s(fd, "personId");
  const monthKey = s(fd, "monthKey");
  if (!personId || !monthKey || (personType !== "office" && personType !== "driver")) {
    return fail("Không xác định được người hoặc tháng lương.");
  }
  if (fd.has("paymentStatus") && s(fd, "paymentStatus") === "paid" && !optStr(fd, "paidDate")) {
    return fail("Vui lòng chọn ngày trả lương.");
  }

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

  try {
    await prisma.salaryMonth.upsert({
      where: { personType_personId_monthKey: { personType, personId, monthKey } },
      create: { id: newId("sm"), personType, personId, monthKey, baseSalary, ...fields },
      update: fields, // giữ nguyên baseSalary snapshot cũ
    });
  } catch {
    return fail("Không lưu được. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

/** Tạo/sửa phiếu trả công lái xe đối tác. */
export async function savePartnerPayout(fd: FormData): Promise<ActionResult> {
  await requireEditor();
  const id = s(fd, "id");
  const driverId = s(fd, "driverId");
  const workDate = s(fd, "workDate");
  if (!driverId) return fail("Vui lòng chọn lái xe.");
  if (!workDate) return fail("Vui lòng chọn ngày làm.");
  const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
  if (!amt) return fail("Vui lòng nhập số tiền.");

  const data = {
    driverId,
    workDate,
    amount: Number(amt),
    paymentStatus: s(fd, "paymentStatus") || "unpaid",
    payerName: s(fd, "payerName"),
    note: s(fd, "note"),
  };
  try {
    if (id) await prisma.partnerPayout.update({ where: { id }, data });
    else await prisma.partnerPayout.create({ data: { id: newId("pp"), ...data } });
  } catch {
    return fail("Không lưu được. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

export async function deletePartnerPayout(fd: FormData): Promise<void> {
  await requireEditor();
  await prisma.partnerPayout.delete({ where: { id: s(fd, "id") } });
  revalidateAll();
}

/** Tạo/sửa một lần tạm ứng lương (trừ vào tháng của `date`). */
export async function saveSalaryAdvance(fd: FormData): Promise<ActionResult> {
  const personType = s(fd, "personType");
  if (personType === "office") await requireManagerEditor();
  else await requireEditor();

  const id = s(fd, "id");
  const personId = s(fd, "personId");
  const date = s(fd, "date");
  if (!personId || (personType !== "office" && personType !== "driver")) {
    return fail("Không xác định được nhân sự.");
  }
  if (!date) return fail("Vui lòng chọn ngày ứng.");
  const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
  if (!amt || Number(amt) <= 0) return fail("Vui lòng nhập số tiền.");

  const data = {
    personType,
    personId,
    date,
    amount: Number(amt),
    note: s(fd, "note"),
  };
  try {
    if (id) await prisma.salaryAdvance.update({ where: { id }, data });
    else await prisma.salaryAdvance.create({ data: { id: newId("sa"), ...data } });
  } catch {
    return fail("Không lưu được. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

/** Xóa một lần tạm ứng lương (kiểm quyền theo `personType` của bản ghi). */
export async function deleteSalaryAdvance(fd: FormData): Promise<ActionResult> {
  const id = s(fd, "id");
  if (!id) return fail("Không tìm thấy khoản tạm ứng.");
  const existing = await prisma.salaryAdvance.findUnique({
    where: { id },
    select: { personType: true },
  });
  if (!existing) return fail("Không tìm thấy khoản tạm ứng.");
  if (existing.personType === "office") await requireManagerEditor();
  else await requireEditor();

  try {
    await prisma.salaryAdvance.delete({ where: { id } });
  } catch {
    return fail("Không xóa được. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}
