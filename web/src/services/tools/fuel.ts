import { tool } from "ai";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addMonth, monthLabel } from "@/utils/format";
import { dateRange, resolveRange, type UserRoleContext, vnd } from "./shared";

/**
 * 8. Nhật ký đổ dầu theo xe / tháng / khoảng ngày / trạng thái thanh toán.
 */
export function getFuelHistoryTool(ctx: UserRoleContext) {
  return tool({
    description:
      "Tra cứu nhật ký đổ dầu của phương tiện: lọc theo biển số, tháng, khoảng ngày hoặc trạng thái thanh toán (đã trả/chưa trả). Dùng khi hỏi: 'tiền dầu của xe X', 'nhật ký đổ dầu tháng 9', 'dầu chưa thanh toán'.",
    inputSchema: z.object({
      vehiclePlate: z.string().optional().describe("Biển số xe cần lọc (tìm gần đúng)"),
      monthKey: z.string().optional().describe("Tháng dạng YYYY-MM"),
      fromDate: z.string().optional().describe("Từ ngày YYYY-MM-DD"),
      toDate: z.string().optional().describe("Đến ngày YYYY-MM-DD"),
      paymentStatus: z.enum(["paid", "unpaid"]).optional().describe("Trạng thái thanh toán"),
    }),
    execute: async ({ vehiclePlate, monthKey, fromDate, toDate, paymentStatus }) => {
      const key = monthKey?.trim();
      if (key && !/^\d{4}-\d{2}$/.test(key)) {
        return `Tháng không hợp lệ: "${key}". Cần định dạng YYYY-MM (ví dụ 2026-09).`;
      }

      try {
        const filters: Prisma.FuelEntryWhereInput[] = [];
        if (vehiclePlate?.trim()) {
          filters.push({ vehicle: { plate: { contains: vehiclePlate.trim(), mode: "insensitive" } } });
        }
        if (key) {
          filters.push({ refuelDate: { gte: `${key}-01`, lt: `${addMonth(key, 1)}-01` } });
        } else if (fromDate?.trim() || toDate?.trim()) {
          const { from, to } = resolveRange(fromDate, toDate);
          filters.push({ refuelDate: dateRange(from, to) });
        }
        if (paymentStatus) filters.push({ paymentStatus });

        const entries = await prisma.fuelEntry.findMany({
          where: filters.length ? { AND: filters } : undefined,
          include: { vehicle: { select: { plate: true } } },
          orderBy: [{ refuelDate: "desc" }, { createdAt: "desc" }],
          take: 100,
        });

        if (entries.length === 0) {
          return "Không tìm thấy lượt đổ dầu nào phù hợp với tiêu chí tra cứu.";
        }

        const total = entries.reduce((acc, e) => acc + e.amount, 0);
        const paidTotal = entries.filter((e) => e.paymentStatus === "paid").reduce((acc, e) => acc + e.amount, 0);
        const unpaidTotal = total - paidTotal;

        const details = entries
          .map(
            (e, idx) =>
              `${idx + 1}. ${e.refuelDate} — Biển số: ${e.vehicle?.plate ?? "?"} — Số tiền: ${vnd(e.amount)} đ\n` +
              `   • Thanh toán: ${e.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}${
                e.payerName ? ` (Người trả: ${e.payerName})` : ""
              }\n` +
              `   • Ghi chú: ${e.note?.trim() || "—"}`
          )
          .join("\n");

        return (
          `NHẬT KÝ ĐỔ DẦU${vehiclePlate ? ` — XE ${vehiclePlate}` : ""}${key ? ` — THÁNG ${monthLabel(key)}` : ""}:\n\n` +
          `• Tổng số lần đổ dầu: ${entries.length} lượt\n` +
          `• Tổng tiền dầu: ${vnd(total)} đ\n` +
          `   - Đã thanh toán: ${vnd(paidTotal)} đ\n` +
          `   - Chưa thanh toán: ${vnd(unpaidTotal)} đ\n\n` +
          `CHI TIẾT:\n${details}`
        );
      } catch (err) {
        return `Lỗi tra cứu nhật ký tiền dầu: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}
