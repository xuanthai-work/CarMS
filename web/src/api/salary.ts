"use server";

import { prisma } from "@/lib/prisma";
import { requireEditor, requireManagerEditor } from "@/services/auth";
import { s, optStr, optNum } from "@/utils/formData";
import { newId } from "@/utils/id";
import { revalidateAll } from "./revalidate";
import { OK, fail, type ActionResult } from "@/utils/actionResult";
import { monthKeyOf, monthRange } from "@/utils/format";
import { resolveBaseSalary, salariedPeople, buildSalaryRows, type SalaryRow } from "@/utils/salary";

async function requirePersonEditor(personType: string): Promise<void> {
  if (personType === "office") await requireManagerEditor();
  else await requireEditor();
}

async function checkAdvanceMonthLocked(
  personType: string,
  personId: string,
  monthKeys: string[]
): Promise<string | null> {
  const unique = Array.from(new Set(monthKeys.filter(Boolean)));
  if (unique.length === 0) return null;
  const locked = await prisma.salaryMonth.findMany({
    where: { personType, personId, monthKey: { in: unique }, locked: true },
    select: { monthKey: true },
  });
  return locked.length > 0
    ? "Phiếu lương tháng này đã chốt. Vui lòng Mở chốt trước khi sửa tạm ứng."
    : null;
}

async function lockOneSalaryMonth(
  personType: string,
  personId: string,
  monthKey: string,
  row: SalaryRow
): Promise<void> {
  const lockedAt = new Date();
  await prisma.salaryMonth.upsert({
    where: { personType_personId_monthKey: { personType, personId, monthKey } },
    create: {
      id: newId("sm"),
      personType,
      personId,
      monthKey,
      baseSalary: row.baseSalary,
      additions: row.additions,
      deductions: row.deductions,
      note: row.note,
      paid: row.paid,
      paidDate: row.paidDate ?? null,
      locked: true,
      lockedAt,
      workDays: row.workDays,
      earned: row.earned,
      advances: row.advances,
    },
    update: {
      locked: true,
      lockedAt,
      baseSalary: row.baseSalary,
      workDays: row.workDays,
      earned: row.earned,
      advances: row.advances,
    },
  });
}

/** Lương cơ bản của người cho `monthKey` (ưu tiên `SalaryRate`, fallback lương hiện lưu). */
async function lookupBaseSalary(personType: string, personId: string, monthKey: string): Promise<number> {
  const [fallback, rates] = await Promise.all([
    personType === "office"
      ? prisma.officeStaff.findUnique({ where: { id: personId }, select: { baseSalary: true } }).then((p) => p?.baseSalary ?? 0)
      : prisma.driver.findUnique({ where: { id: personId }, select: { baseSalary: true } }).then((d) => d?.baseSalary ?? 0),
    prisma.salaryRate.findMany({
      where: { personType, personId },
      orderBy: [{ effectiveFrom: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  return resolveBaseSalary(rates, personType, personId, monthKey, fallback);
}

/** Sửa điều chỉnh lương tháng (thưởng/phụ cấp, tạm ứng/khấu trừ, ghi chú). Upsert theo (personType, personId, monthKey). */
export async function saveSalaryMonth(fd: FormData): Promise<ActionResult> {
  const personType = s(fd, "personType");
  await requirePersonEditor(personType);

  const personId = s(fd, "personId");
  const monthKey = s(fd, "monthKey");
  if (!personId || !monthKey || (personType !== "office" && personType !== "driver")) {
    return fail("Không xác định được người hoặc tháng lương.");
  }
  if (fd.has("paymentStatus") && s(fd, "paymentStatus") === "paid" && !optStr(fd, "paidDate")) {
    return fail("Vui lòng chọn ngày trả lương.");
  }

  const [baseSalary, existing] = await Promise.all([
    lookupBaseSalary(personType, personId, monthKey),
    prisma.salaryMonth.findUnique({
      where: { personType_personId_monthKey: { personType, personId, monthKey } },
      select: { locked: true },
    }),
  ]);

  // Gộp điều chỉnh + trạng thái trả (paymentStatus) + ngày trả (paidDate) vào một lần ghi.
  // Dòng đã chốt chỉ được sửa note/paid/paidDate; bỏ qua additions/deductions.
  const fields: {
    additions?: number;
    deductions?: number;
    note: string;
    paid?: boolean;
    paidDate?: string | null;
  } = existing?.locked
    ? { note: s(fd, "note") }
    : {
        additions: optNum(fd, "additions") ?? 0,
        deductions: optNum(fd, "deductions") ?? 0,
        note: s(fd, "note"),
      };
  if (fd.has("paymentStatus")) fields.paid = s(fd, "paymentStatus") === "paid";
  if (fd.has("paidDate")) fields.paidDate = optStr(fd, "paidDate");

  try {
    await prisma.salaryMonth.upsert({
      where: { personType_personId_monthKey: { personType, personId, monthKey } },
      create: {
        id: newId("sm"),
        personType,
        personId,
        monthKey,
        baseSalary,
        additions: fields.additions ?? 0,
        deductions: fields.deductions ?? 0,
        note: fields.note,
        ...(fields.paid !== undefined ? { paid: fields.paid } : {}),
        ...(fields.paidDate !== undefined ? { paidDate: fields.paidDate } : {}),
      },
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
  await requirePersonEditor(personType);

  const id = s(fd, "id");
  const personId = s(fd, "personId");
  const date = s(fd, "date");
  if (!personId || (personType !== "office" && personType !== "driver")) {
    return fail("Không xác định được nhân sự.");
  }
  if (!date) return fail("Vui lòng chọn ngày ứng.");
  const amt = String(fd.get("amount") || "").replace(/[^\d]/g, "");
  if (!amt || Number(amt) <= 0) return fail("Vui lòng nhập số tiền.");

  const existing = id
    ? await prisma.salaryAdvance.findUnique({ where: { id }, select: { date: true } })
    : null;
  const lockErr = await checkAdvanceMonthLocked(personType, personId, [
    monthKeyOf(date),
    ...(existing ? [monthKeyOf(existing.date)] : []),
  ]);
  if (lockErr) return fail(lockErr);

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
    select: { personType: true, personId: true, date: true },
  });
  if (!existing) return fail("Không tìm thấy khoản tạm ứng.");
  await requirePersonEditor(existing.personType);

  const lockErr = await checkAdvanceMonthLocked(existing.personType, existing.personId, [
    monthKeyOf(existing.date),
  ]);
  if (lockErr) return fail(lockErr);

  try {
    await prisma.salaryAdvance.delete({ where: { id } });
  } catch {
    return fail("Không xóa được. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

/** Chốt phiếu lương một người trong tháng (lưu snapshot từ dữ liệu hiện tại). */
export async function lockSalaryMonth(fd: FormData): Promise<ActionResult> {
  const personType = s(fd, "personType");
  await requirePersonEditor(personType);

  const personId = s(fd, "personId");
  const monthKey = s(fd, "monthKey");
  if (!personId || !monthKey || (personType !== "office" && personType !== "driver")) {
    return fail("Không xác định được người hoặc tháng lương.");
  }

  const [officePerson, driverPerson, rates, advances, monthRow] = await Promise.all([
    personType === "office" ? prisma.officeStaff.findUnique({ where: { id: personId } }) : Promise.resolve(null),
    personType === "driver" ? prisma.driver.findUnique({ where: { id: personId } }) : Promise.resolve(null),
    prisma.salaryRate.findMany({ where: { personType, personId }, orderBy: [{ effectiveFrom: "asc" }, { createdAt: "asc" }] }),
    prisma.salaryAdvance.findMany({ where: { personType, personId, date: monthRange(monthKey) } }),
    prisma.salaryMonth.findUnique({ where: { personType_personId_monthKey: { personType, personId, monthKey } } }),
  ]);

  const people = salariedPeople(
    officePerson ? [officePerson] : [],
    driverPerson ? [driverPerson] : [],
    monthKey,
    rates
  );
  const [row] = buildSalaryRows(
    people,
    monthRow ? [{ ...monthRow, note: monthRow.note ?? "", locked: false }] : [],
    advances
  );
  if (!row) return fail("Người này không có phiếu lương trong tháng.");

  try {
    await lockOneSalaryMonth(personType, personId, monthKey, row);
  } catch {
    return fail("Không chốt được phiếu lương. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

/** Mở chốt phiếu lương một người trong tháng (giữ snapshot cũ, quay về tính động). */
export async function unlockSalaryMonth(fd: FormData): Promise<ActionResult> {
  const personType = s(fd, "personType");
  await requirePersonEditor(personType);

  const personId = s(fd, "personId");
  const monthKey = s(fd, "monthKey");
  if (!personId || !monthKey || (personType !== "office" && personType !== "driver")) {
    return fail("Không xác định được người hoặc tháng lương.");
  }

  try {
    await prisma.salaryMonth.updateMany({
      where: { personType, personId, monthKey },
      data: { locked: false, lockedAt: null },
    });
  } catch {
    return fail("Không mở chốt được phiếu lương. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}

/** Chốt tất cả phiếu lương chưa chốt của tháng (office cần requireManagerEditor, driver cần requireEditor). */
export async function lockSalaryMonthAll(fd: FormData): Promise<ActionResult> {
  const monthKey = s(fd, "monthKey");
  if (!monthKey) return fail("Không xác định được tháng lương.");

  let canLockOffice = false;
  try {
    await requireManagerEditor();
    canLockOffice = true;
  } catch {
    await requireEditor();
  }

  const [office, drivers, rates, advances, months] = await Promise.all([
    canLockOffice ? prisma.officeStaff.findMany() : Promise.resolve([]),
    prisma.driver.findMany(),
    prisma.salaryRate.findMany({ orderBy: [{ effectiveFrom: "asc" }, { createdAt: "asc" }] }),
    prisma.salaryAdvance.findMany({ where: { date: monthRange(monthKey) } }),
    prisma.salaryMonth.findMany({ where: { monthKey } }),
  ]);

  const people = salariedPeople(office, drivers, monthKey, rates);
  const rows = buildSalaryRows(
    people,
    months.map((m) => ({ ...m, note: m.note ?? "" })),
    advances
  );
  const toLock = rows.filter((r) => !r.locked);

  try {
    await Promise.all(toLock.map((r) => lockOneSalaryMonth(r.personType, r.personId, monthKey, r)));
  } catch {
    return fail("Không chốt được tất cả phiếu lương. Vui lòng thử lại.");
  }
  revalidateAll();
  return OK;
}
