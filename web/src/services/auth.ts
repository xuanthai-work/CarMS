import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOfficeStaffByEmail } from "./staff";
import { isManager, canEdit } from "@/utils/office";
import type { OfficeStaff } from "@/types";

/**
 * Helper phân quyền phía server. Nối tài khoản Supabase Auth với bản ghi
 * OfficeStaff qua email, rồi suy ra vai trò. Dùng trong server component/layout.
 *
 * getCurrentUser / getCurrentStaff bọc trong cache() (React) → mọi lần gọi trong
 * CÙNG một request (layout gate + guard từng trang + profile) chỉ chạy 1 lần
 * getUser + 1 query, thay vì lặp lại ở mỗi tầng.
 */

/**
 * User của phiên hiện tại — xác thực với Supabase Auth.
 *
 * Dùng getUser(), KHÔNG dùng getSession(): getSession() chỉ giải mã token trong cookie
 * mà không kiểm tra với Auth server, nên @supabase/ssr cảnh báo "could be insecure"
 * khi đọc user ở phía server. getUser() xác nhận token hợp lệ rồi mới trả user
 * (không có phiên/hết hạn → error → null), đúng chuẩn server-side của @supabase/ssr.
 *
 * Vẫn bọc cache() để mọi tầng trong CÙNG request chỉ gọi mạng 1 lần.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error ? null : (user ?? null);
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

/**
 * Guard cho MỌI hành động ghi (thêm/sửa/xoá).
 * UI đã ẩn nút với chức vụ chỉ-xem, đây là lớp phòng vệ thứ hai cho trường hợp
 * server action bị gọi trực tiếp — nên throw để lỗi hiện rõ, không redirect âm thầm.
 */
export async function requireEditor(): Promise<OfficeStaff> {
  const staff = await requireStaff();
  if (!canEdit(staff.position)) {
    throw new Error(`Chức vụ ${staff.position} chỉ có quyền xem, không sửa được dữ liệu`);
  }
  return staff;
}

/** Ghi + phải là quản lý (nhân sự văn phòng, trạng thái chuyến, lương văn phòng). */
export async function requireManagerEditor(): Promise<OfficeStaff> {
  const staff = await requireManager();
  if (!canEdit(staff.position)) {
    throw new Error(`Chức vụ ${staff.position} chỉ có quyền xem, không sửa được dữ liệu`);
  }
  return staff;
}
