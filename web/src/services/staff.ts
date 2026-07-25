import type { OfficeStaff as OfficeStaffRow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OfficeStaff } from "@/types";

function toOfficeStaff(r: OfficeStaffRow): OfficeStaff {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    position: r.position ?? "",
    baseSalary: r.baseSalary,
    startDate: r.startDate,
    note: r.note ?? "",
    dob: r.dob,
    gender: r.gender,
    email: r.email,
    idNumber: r.idNumber,
    socialInsurance: r.socialInsurance,
    payday: r.payday,
  };
}

export async function getOfficeStaff(): Promise<OfficeStaff[]> {
  const rows = await prisma.officeStaff.findMany({ orderBy: { name: "asc" } });
  return rows.map(toOfficeStaff);
}

/** Tìm nhân sự văn phòng theo email (không phân biệt hoa/thường) — nối tài khoản đăng nhập. */
export async function getOfficeStaffByEmail(email: string): Promise<OfficeStaff | null> {
  const row = await prisma.officeStaff.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { id: "asc" }, // ổn định nếu (lỡ) có trùng email; saveOfficeStaff chặn trùng từ đầu
  });
  return row ? toOfficeStaff(row) : null;
}
