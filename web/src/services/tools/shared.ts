import type { Prisma } from "@prisma/client";
import { todayStr } from "@/utils/format";

/** Ngữ cảnh vai trò người đang trò chuyện — kiểm soát quyền truy cập dữ liệu nhạy cảm. */
export type UserRoleContext = {
  isManager: boolean;
  position?: string | null;
  staffName?: string | null;
};

/** Thông báo chuẩn khi người dùng không đủ quyền xem dữ liệu tài chính/lương. */
export const NO_PERMISSION = "Bạn không có quyền truy cập thông tin này";

/** Định dạng số theo kiểu Việt Nam: 1250000 -> "1.250.000". */
export function vnd(n: number): string {
  return n.toLocaleString("vi-VN");
}

/** Chuẩn hoá khoảng ngày [from, to]; mặc định về hôm nay khi thiếu mốc. */
export function resolveRange(fromDate?: string, toDate?: string): { from: string; to: string } {
  const from = fromDate?.trim() || toDate?.trim() || todayStr();
  const to = toDate?.trim() || from;
  return { from, to };
}

/** Dựng điều kiện Prisma cho khoảng ngày trên một cột (dùng cho lọc theo ngày). */
export function dateRange(from: string, to: string): Prisma.StringFilter {
  return { gte: from, lte: to };
}
