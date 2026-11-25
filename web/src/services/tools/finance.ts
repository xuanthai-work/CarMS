import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { monthKeyOf, monthLabel, todayStr } from "@/utils/format";
import { buildMonthFinance, summarize, tripMoney } from "@/utils/revenue";
import { buildSalaryRows, salariedPeople, salaryCostForMonth } from "@/utils/salary";
import { getTrips, toTrip } from "@/services/trips";
import { getFuelMonthTotals } from "@/services/fuel";
import { getOtherExpenseMonthTotals } from "@/services/expenses";
import { getSalaryMonths, getPartnerPayouts, getSalaryAdvances } from "@/services/salary";
import { getOfficeStaff } from "@/services/staff";
import { getDrivers } from "@/services/drivers";
import { NO_PERMISSION, type UserRoleContext, vnd } from "./shared";

/**
 * 3. Tổng quan vận hành & tài chính trong ngày.
 *
 * Tách bạch 2 khái niệm để KHÔNG đếm trùng chuyến khứ hồi/nhiều ngày:
 *  - VẬN HÀNH: chuyến có lượt ĐI hoặc lượt VỀ rơi vào ngày đang xét.
 *  - TÀI CHÍNH: doanh thu chỉ ghi nhận vào NGÀY HOÀN TẤT của chuyến
 *    (finishDate = returnDate ?? outboundDate) — đúng quy chuẩn revenue.ts.
 * Doanh thu và chi phí chuyến cộng dồn các ngày khớp tháng (buildMonthFinance),
 * còn lương và chi phí khác không chia theo ngày.
 */
export function getDailySummaryTool(ctx: UserRoleContext) {
  return tool({
    description:
      "Xem tổng quan hoạt động trong ngày: số chuyến vận hành, doanh thu ghi nhận theo ngày hoàn tất, và tổng tiền dầu đã đổ. Dùng khi hỏi: 'tổng kết hôm nay', 'doanh thu hôm nay', 'tình hình vận hành hôm nay'. CHỈ dành cho quản lý.",
    inputSchema: z.object({
      date: z.string().optional().describe("Ngày cần tổng hợp YYYY-MM-DD. Mặc định là hôm nay."),
    }),
    execute: async ({ date }) => {
      if (!ctx.isManager) {
        return NO_PERMISSION;
      }
      const targetDate = date?.trim() || todayStr();

      try {
        // Tập VẬN HÀNH: mọi chuyến có lượt đi hoặc lượt về trong ngày.
        const trips = await prisma.trip.findMany({
          where: { OR: [{ outboundDate: targetDate }, { returnDate: targetDate }] },
        });

        const totalOps = trips.length;
        const completedOps = trips.filter(
          (t) => t.status === "completed" || t.status === "completed_paid"
        ).length;
        const cancelledOps = trips.filter((t) => t.status === "cancelled").length;
        const activeOps = totalOps - completedOps - cancelledOps;

        // Tập TÀI CHÍNH: chỉ chuyến HOÀN TẤT đúng ngày này mới ghi nhận doanh thu.
        // finishDate = returnDate ?? outboundDate (returnDate chỉ có nghĩa khi hasReturn).
        const finished = trips.filter(
          (t) => (t.hasReturn ? t.returnDate : t.outboundDate) === targetDate
        );
        const money = summarize(finished.map((t) => tripMoney(toTrip(t))));

        // Tiền dầu trong ngày.
        const fuelEntries = await prisma.fuelEntry.findMany({
          where: { refuelDate: targetDate },
          select: { amount: true, paymentStatus: true },
        });
        const totalFuelCount = fuelEntries.length;
        const totalFuelCost = fuelEntries.reduce((acc, f) => acc + f.amount, 0);

        return (
          `BÁO CÁO NGÀY ${targetDate}:\n\n` +
          `1. Vận hành trong ngày (lượt đi/về rơi vào ngày):\n` +
          `• Lượt chuyến hoạt động: ${totalOps} (Đã xong: ${completedOps}, Đang chạy/chờ: ${activeOps}, Đã hủy: ${cancelledOps})\n\n` +
          `2. Tài chính — doanh thu ghi nhận theo NGÀY HOÀN TẤT ${targetDate}:\n` +
          `• Số chuyến hoàn tất hôm nay: ${finished.length}\n` +
          `• Doanh thu ghi nhận: ${vnd(money.recognized)} đ\n` +
          `• Đã thu (cọc/thu trước): ${vnd(money.collected)} đ\n` +
          `• Còn phải thu: ${vnd(money.outstanding)} đ\n` +
          `• Chi phí chuyến (cầu đường, đối tác, khác): ${vnd(money.cost)} đ\n\n` +
          `3. Tiêu hao nhiên liệu (Tiền dầu):\n` +
          `• Lượt đổ dầu: ${totalFuelCount} lượt\n` +
          `• Tổng tiền dầu: ${vnd(totalFuelCost)} đ\n\n` +
          `• Lợi nhuận tạm tính theo ngày (chỉ trừ chi phí chuyến và tiền dầu; chưa gồm lương, chi phí khác): ${vnd(
            money.recognized - money.cost - totalFuelCost
          )} đ`
        );
      } catch (err) {
        return `Lỗi tổng hợp báo cáo: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/**
 * 5. Tổng hợp tài chính cả tháng — khớp màn Doanh thu vì dùng chung buildMonthFinance.
 *
 * Tái dùng đúng nguồn dữ liệu + hàm tính của trang doanh-thu:
 *  - getTrips() + buildMonthFinance (doanh thu ghi nhận theo ngày hoàn tất).
 *  - getFuelMonthTotals(monthKey) cho tiền dầu.
 *  - getOtherExpenseMonthTotals(key) cho chi phí khác.
 *  - Lương: salariedPeople + buildSalaryRows + salaryCostForMonth (office + lái xe
 *    tháng + lái xe nhận công theo ngày qua PartnerPayout).
 * Không tự cộng tay để tránh lệch/nhân đôi số liệu.
 */
export function getMonthlyFinanceTool(ctx: UserRoleContext) {
  return tool({
    description:
      "Tổng hợp tài chính cả tháng (doanh thu ghi nhận, đã thanh toán, còn phải thu, tổng chi phí, lợi nhuận, số chuyến hoàn tất). Dùng khi hỏi: 'doanh thu tháng này', 'tài chính tháng 9', 'lợi nhuận tháng trước'. CHỈ dành cho quản lý.",
    inputSchema: z.object({
      monthKey: z
        .string()
        .optional()
        .describe("Tháng cần tổng hợp dạng YYYY-MM (ví dụ 2026-09). Mặc định là tháng hiện tại."),
    }),
    execute: async ({ monthKey }) => {
      if (!ctx.isManager) {
        return NO_PERMISSION;
      }
      const key = monthKey?.trim() || monthKeyOf(todayStr());
      if (!/^\d{4}-\d{2}$/.test(key)) {
        return `Tháng không hợp lệ: "${key}". Cần định dạng YYYY-MM (ví dụ 2026-09).`;
      }

      try {
        // Cùng bộ dữ liệu trang Doanh thu dùng (lấy tất cả rồi lọc theo tháng ở hàm chuẩn).
        const [trips, fuelMonth, otherExpenseMonth, office, drivers, months, payouts, advances] = await Promise.all([
          getTrips(),
          getFuelMonthTotals(key),
          getOtherExpenseMonthTotals(key),
          getOfficeStaff(),
          getDrivers(),
          getSalaryMonths(),
          getPartnerPayouts(),
          getSalaryAdvances(key),
        ]);

        const fuelTotal = fuelMonth.total;
        const otherExpenseTotal = otherExpenseMonth.total;
        const people = salariedPeople(office, drivers, key);
        const salaryRows = buildSalaryRows(
          people,
          months.filter((m) => m.monthKey === key),
          advances
        );
        const salaryCost = salaryCostForMonth(salaryRows, payouts, key);

        // Một đường tính duy nhất — không cộng trùng.
        const { rows, summary, tripCosts, paidTotal, totalCost, profit } = buildMonthFinance(
          trips,
          key,
          fuelTotal,
          salaryCost,
          otherExpenseTotal
        );
        const noPriceCount = rows.filter((r) => r.trip.price == null).length;

        return (
          `BÁO CÁO TÀI CHÍNH THÁNG ${monthLabel(key)}:\n\n` +
          `1. Doanh thu ghi nhận: ${vnd(summary.recognized)} đ\n` +
          `2. Đã thanh toán (completed_paid): ${vnd(paidTotal)} đ\n` +
          `3. Còn phải thu: ${vnd(summary.outstanding)} đ\n` +
          `4. Tổng chi phí tháng: ${vnd(totalCost)} đ\n` +
          `   • Chi phí chuyến: ${vnd(summary.cost)} đ (khác ${vnd(tripCosts.other)} + thuê đối tác ${vnd(
            tripCosts.partner
          )})\n` +
          `   • Chi phí khác (trang Chi phí khác): ${vnd(otherExpenseTotal)} đ\n` +
          `   • Tiền dầu: ${vnd(fuelTotal)} đ\n` +
          `   • Chi phí lương: ${vnd(salaryCost)} đ\n` +
          `5. Lợi nhuận: ${vnd(profit)} đ\n` +
          `6. Số chuyến ghi nhận doanh thu trong tháng: ${summary.count} chuyến${
            noPriceCount > 0 ? ` (trong đó ${noPriceCount} chuyến chưa có giá)` : ""
          }`
        );
      } catch (err) {
        return `Lỗi tổng hợp tài chính tháng: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}
