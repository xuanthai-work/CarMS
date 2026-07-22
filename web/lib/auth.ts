import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getOfficeStaffByEmail } from "@/lib/db";
import { isManager } from "@/lib/office";
import type { OfficeStaff } from "@/lib/types";

/**
 * Helper phân quyền phía server. Nối tài khoản Supabase Auth với bản ghi
 * OfficeStaff qua email, rồi suy ra vai trò. Dùng trong server component/layout.
 *
 * getCurrentUser / getCurrentStaff bọc trong cache() (React) → mọi lần gọi trong
 * CÙNG một request (layout gate + guard từng trang + profile) chỉ chạy 1 lần
 * getUser + 1 query, thay vì lặp lại ở mỗi tầng.
 */

/** User Supabase của phiên hiện tại (đã xác thực phía server), hoặc null. */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Nhân sự văn phòng ứng với tài khoản đang đăng nhập (khớp email), hoặc null. */
export const getCurrentStaff = cache(async (): Promise<OfficeStaff | null> => {
  const user = await getCurrentUser();
  const email = user?.email;
  if (!email) return null;
  return getOfficeStaffByEmail(email);
});

/** Bắt buộc có bản ghi nhân sự; chưa gán → đá về /no-access. */
export async function requireStaff(): Promise<OfficeStaff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/no-access");
  return staff;
}

/** Bắt buộc là quản lý (CEO/COO); không phải → đá về /lich. */
export async function requireManager(): Promise<OfficeStaff> {
  const staff = await requireStaff();
  if (!isManager(staff.position)) redirect("/lich");
  return staff;
}
