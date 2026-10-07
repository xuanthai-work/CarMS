import { tool } from "ai";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Trip } from "@/types";
import { monthKeyOf, monthLabel, todayStr } from "@/utils/format";
import { buildMonthFinance, tripMoney } from "@/utils/revenue";
import { buildSalaryRows, salariedPeople, salaryCostForMonth } from "@/utils/salary";
import { getTrips } from "@/services/trips";
import { getFuelMonthTotals } from "@/services/fuel";
import { getSalaryMonths, getPartnerPayouts } from "@/services/salary";
import { getOfficeStaff } from "@/services/staff";
import { getDrivers } from "@/services/drivers";

/**
 * Bộ công cụ CHỈ-ĐỌC dữ liệu thật của CarMS cho Trợ lý Meow.
 *
 * Ràng buộc an toàn: chỉ dùng các hàm đọc của Prisma (findMany/count/aggregate),
 * TUYỆT ĐỐI không create/update/delete/upsert.
 *
 * Tiền của chuyến được suy theo đúng quy chuẩn hiện hành ở utils/revenue.ts
 * (tripMoney — bên trong gọi tripOtherCost), không tự cộng tay rồi lệch quy tắc.
 */

/** Định dạng số theo kiểu Việt Nam: 1250000 -> "1.250.000". */
function vnd(n: number): string {
  return n.toLocaleString("vi-VN");
}

/**
 * 1. Tra cứu danh sách chuyến xe theo ngày / tài xế / xe / trạng thái.
 *
 * Lưu ý: điều kiện được gom vào `AND` — nếu nhét nhiều khóa `OR` thẳng vào object
 * `where` thì cái sau sẽ ghi đè cái trước, làm mất bộ lọc ngày.
 */
export function getDailyTripsTool() {
  return tool({
    description:
      "Tra cứu danh sách các chuyến xe/cuốc xe trong ngày hoặc theo ngày cụ thể, có thể lọc theo tên tài xế hoặc biển số xe. Dùng khi người dùng hỏi: 'hôm nay có chuyến nào', 'lịch xe hôm nay', 'tài xế X hôm nay chạy cuốc nào'.",
    inputSchema: z.object({
      date: z
        .string()
        .optional()
        .describe("Ngày cần tra cứu dạng YYYY-MM-DD. Nếu không truyền, mặc định là ngày hôm nay theo giờ Việt Nam."),
      driverName: z.string().optional().describe("Tên tài xế cần lọc (tìm gần đúng)"),
      vehiclePlate: z.string().optional().describe("Biển số xe cần lọc (tìm gần đúng)"),
      status: z.string().optional().describe("Trạng thái cuốc: pending, in_progress, completed, completed_paid, cancelled..."),
    }),
    execute: async ({ date, driverName, vehiclePlate, status }) => {
      const targetDate = date?.trim() || todayStr();

      try {
        const filters: Prisma.TripWhereInput[] = [
          { OR: [{ outboundDate: targetDate }, { returnDate: targetDate }] },
        ];
        if (status) filters.push({ status });
        if (driverName) {
          filters.push({
            OR: [
              { outboundDriver: { name: { contains: driverName, mode: "insensitive" } } },
              { returnDriver: { name: { contains: driverName, mode: "insensitive" } } },
            ],
          });
        }
        if (vehiclePlate) {
          filters.push({
            OR: [
              { outboundVehicle: { plate: { contains: vehiclePlate, mode: "insensitive" } } },
              { returnVehicle: { plate: { contains: vehiclePlate, mode: "insensitive" } } },
            ],
          });
        }

        const trips = await prisma.trip.findMany({
          where: { AND: filters },
          include: {
            outboundDriver: { select: { name: true, phone: true } },
            outboundVehicle: { select: { plate: true, seats: true } },
            returnDriver: { select: { name: true, phone: true } },
            returnVehicle: { select: { plate: true, seats: true } },
          },
          orderBy: { outboundTime: "asc" },
        });

        if (trips.length === 0) {
          return `Ngày ${targetDate} không có chuyến xe nào phù hợp với tiêu chí tìm kiếm.`;
        }

        return trips
          .map((t, idx) => {
            const isOut = t.outboundDate === targetDate;
            const from = isOut ? t.outboundFrom : (t.returnFrom ?? "Chưa rõ");
            const to = isOut ? t.outboundTo : (t.returnTo ?? "Chưa rõ");
            const time = isOut ? (t.outboundTime ?? "—") : (t.returnTime ?? "—");
            const driver = isOut ? t.outboundDriver?.name : t.returnDriver?.name;
            const plate = isOut ? t.outboundVehicle?.plate : t.returnVehicle?.plate;

            return (
              `[Chuyến ${idx + 1}] ID: ${t.id}\n` +
              `• Khách hàng: ${t.customerName}${t.customerPhone ? ` (${t.customerPhone})` : ""}\n` +
              `• Lộ trình: ${from} ➔ ${to} (Giờ đón: ${time})\n` +
              `• Loại tour: ${t.tourType} | Trạng thái: ${t.status}\n` +
              `• Xe: ${plate ?? "Chưa gán xe"} | Tài xế: ${driver ?? "Chưa gán lái"}\n` +
              `• Giá: ${vnd(t.price ?? 0)} đ | Cọc: ${vnd(t.deposit ?? 0)} đ`
            );
          })
          .join("\n\n---\n\n");
      } catch (err) {
        return `Lỗi tra cứu chuyến xe: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/**
 * 2. Kiểm tra xe rảnh / bận theo ngày.
 */
export function getAvailableVehiclesTool() {
  return tool({
    description:
      "Kiểm tra tình trạng đội xe trong ngày: xe nào đang rảnh (chưa có lịch), xe nào đang bận chạy cuốc. Dùng khi hỏi: 'xe nào đang rảnh', 'còn xe 7 chỗ không', 'xe trống hôm nay'.",
    inputSchema: z.object({
      date: z
        .string()
        .optional()
        .describe("Ngày cần kiểm tra dạng YYYY-MM-DD. Mặc định là ngày hôm nay."),
      seats: z.number().optional().describe("Lọc theo số chỗ ngồi: 4, 7, 16..."),
      type: z.enum(["own", "partner"]).optional().describe("Loại xe: 'own' (xe nhà) hoặc 'partner' (xe đối tác)"),
    }),
    execute: async ({ date, seats, type }) => {
      const targetDate = date?.trim() || todayStr();

      try {
        // Xe đang hoạt động (có thể lọc theo số chỗ / loại xe).
        const allVehicles = await prisma.vehicle.findMany({
          where: {
            status: "active",
            ...(seats ? { seats } : {}),
            ...(type ? { type } : {}),
          },
          select: { id: true, plate: true, seats: true, type: true, note: true },
          orderBy: [{ seats: "asc" }, { plate: "asc" }],
        });

        // Cuốc trong ngày (bỏ cuốc đã huỷ) để xác định xe nào bận.
        const activeTrips = await prisma.trip.findMany({
          where: {
            status: { notIn: ["cancelled"] },
            OR: [{ outboundDate: targetDate }, { returnDate: targetDate }],
          },
          select: {
            outboundDate: true,
            outboundVehicleId: true,
            outboundFrom: true,
            outboundTo: true,
            outboundTime: true,
            returnDate: true,
            returnVehicleId: true,
            returnFrom: true,
            returnTo: true,
            returnTime: true,
          },
        });

        const busyVehicleMap = new Map<string, string>();
        for (const trip of activeTrips) {
          if (trip.outboundDate === targetDate && trip.outboundVehicleId) {
            busyVehicleMap.set(
              trip.outboundVehicleId,
              `Đi ${trip.outboundFrom} ➔ ${trip.outboundTo} lúc ${trip.outboundTime ?? "—"}`
            );
          }
          if (trip.returnDate === targetDate && trip.returnVehicleId) {
            busyVehicleMap.set(
              trip.returnVehicleId,
              `Về ${trip.returnFrom ?? ""} ➔ ${trip.returnTo ?? ""} lúc ${trip.returnTime ?? "—"}`
            );
          }
        }

        const freeVehicles = allVehicles.filter((v) => !busyVehicleMap.has(v.id));
        const busyVehicles = allVehicles.filter((v) => busyVehicleMap.has(v.id));

        const freeList = freeVehicles.length
          ? freeVehicles
              .map((v) => `• ${v.plate} (${v.seats ?? "?"} chỗ, ${v.type === "own" ? "xe nhà" : "xe đối tác"})`)
              .join("\n")
          : "Không có xe nào rảnh.";

        const busyList = busyVehicles.length
          ? busyVehicles
              .map((v) => `• ${v.plate} (${v.seats ?? "?"} chỗ) — Đang chạy: ${busyVehicleMap.get(v.id)}`)
              .join("\n")
          : "Không có xe nào đang bận.";

        return (
          `TÌNH TRẠNG ĐỘI XE NGÀY ${targetDate}:\n\n` +
          `🟢 XE ĐANG RẢNH (${freeVehicles.length} xe):\n${freeList}\n\n` +
          `🔴 XE ĐANG BẬN CÓ LỊCH (${busyVehicles.length} xe):\n${busyList}`
        );
      } catch (err) {
        return `Lỗi kiểm tra tình trạng xe: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/**
 * 3. Tổng quan vận hành & tài chính trong ngày.
 *
 * Tách bạch 2 khái niệm để KHÔNG đếm trùng chuyến khứ hồi/nhiều ngày:
 *  - VẬN HÀNH: chuyến có lượt ĐI hoặc lượt VỀ rơi vào ngày đang xét.
 *  - TÀI CHÍNH: doanh thu chỉ ghi nhận vào NGÀY HOÀN TẤT của chuyến
 *    (finishDate = returnDate ?? outboundDate) — đúng quy chuẩn revenue.ts.
 * Nhờ vậy cộng dồn theo từng ngày khớp 100% với báo cáo tháng (buildMonthFinance).
 */
export function getDailySummaryTool() {
  return tool({
    description:
      "Xem tổng quan hoạt động trong ngày: số chuyến vận hành, doanh thu ghi nhận theo ngày hoàn tất, và tổng tiền dầu đã đổ. Dùng khi hỏi: 'tổng kết hôm nay', 'doanh thu hôm nay', 'tình hình vận hành hôm nay'.",
    inputSchema: z.object({
      date: z.string().optional().describe("Ngày cần tổng hợp YYYY-MM-DD. Mặc định là hôm nay."),
    }),
    execute: async ({ date }) => {
      const targetDate = date?.trim() || todayStr();

      try {
        // Tập VẬN HÀNH: mọi chuyến có lượt đi hoặc lượt về trong ngày.
        const trips = await prisma.trip.findMany({
          where: { OR: [{ outboundDate: targetDate }, { returnDate: targetDate }] },
          select: {
            id: true,
            price: true,
            deposit: true,
            status: true,
            tollCost: true,
            partnerCost: true,
            otherCost: true,
            outboundDate: true,
            returnDate: true,
            hasReturn: true,
          },
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
        const moneys = finished.map((t) => tripMoney(t as unknown as Trip));
        const totalRevenue = moneys.reduce((acc, m) => acc + m.recognized, 0);
        const totalCollected = moneys.reduce((acc, m) => acc + m.collected, 0);
        const totalOutstanding = moneys.reduce((acc, m) => acc + m.outstanding, 0);
        const totalTripCosts = moneys.reduce((acc, m) => acc + m.cost, 0);

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
          `• Doanh thu ghi nhận: ${vnd(totalRevenue)} đ\n` +
          `• Đã thu (cọc/thu trước): ${vnd(totalCollected)} đ\n` +
          `• Còn phải thu: ${vnd(totalOutstanding)} đ\n` +
          `• Chi phí chuyến (cầu đường, đối tác, khác): ${vnd(totalTripCosts)} đ\n\n` +
          `3. Tiêu hao nhiên liệu (Tiền dầu):\n` +
          `• Lượt đổ dầu: ${totalFuelCount} lượt\n` +
          `• Tổng tiền dầu: ${vnd(totalFuelCost)} đ\n\n` +
          `• Lợi nhuận tạm tính (Doanh thu ghi nhận - Chi phí chuyến - Tiền dầu): ${vnd(
            totalRevenue - totalTripCosts - totalFuelCost
          )} đ`
        );
      } catch (err) {
        return `Lỗi tổng hợp báo cáo: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/**
 * 4. Cảnh báo hạn đăng kiểm & bảo hiểm phương tiện.
 */
export function getVehicleInspectionsTool() {
  return tool({
    description:
      "Kiểm tra các xe sắp hết hạn đăng kiểm hoặc bảo hiểm phương tiện. Dùng khi hỏi: 'xe nào sắp hết đăng kiểm', 'xe nào sắp hết hạn bảo hiểm'.",
    inputSchema: z.object({
      daysAhead: z.number().optional().describe("Số ngày tới cần kiểm tra (mặc định 30 ngày)"),
    }),
    execute: async ({ daysAhead = 30 }) => {
      try {
        const vehicles = await prisma.vehicle.findMany({
          where: { status: "active" },
          select: { plate: true, seats: true, inspectionDue: true, insuranceDue: true, note: true },
        });

        const today = todayStr();
        const future = new Date();
        future.setDate(future.getDate() + daysAhead);
        const futureStr = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(
          future.getDate()
        ).padStart(2, "0")}`;

        const expiring = (due: string | null) => Boolean(due && due >= today && due <= futureStr);
        const expired = (due: string | null) => Boolean(due && due < today);

        const expiredInspection = vehicles.filter((v) => expired(v.inspectionDue));
        const inspectionAlerts = vehicles.filter((v) => expiring(v.inspectionDue));
        const expiredInsurance = vehicles.filter((v) => expired(v.insuranceDue));
        const insuranceAlerts = vehicles.filter((v) => expiring(v.insuranceDue));

        let res = `CẢNH BÁO ĐĂNG KIỂM & BẢO HIỂM XE (Trong vòng ${daysAhead} ngày tới):\n\n`;

        res += `1. Đăng kiểm:\n`;
        if (expiredInspection.length) {
          res += `⚠️ ĐÃ QUÁ HẠN:\n` + expiredInspection.map((v) => `• ${v.plate} (Hạn: ${v.inspectionDue})`).join("\n") + "\n";
        }
        if (inspectionAlerts.length) {
          res += `⏳ Sắp đến hạn:\n` + inspectionAlerts.map((v) => `• ${v.plate} (Hạn: ${v.inspectionDue})`).join("\n") + "\n";
        }
        if (!expiredInspection.length && !inspectionAlerts.length) {
          res += `• Không có xe nào quá hạn hoặc sắp đến hạn đăng kiểm.\n`;
        }

        res += `\n2. Bảo hiểm:\n`;
        if (expiredInsurance.length) {
          res += `⚠️ ĐÃ QUÁ HẠN:\n` + expiredInsurance.map((v) => `• ${v.plate} (Hạn: ${v.insuranceDue})`).join("\n") + "\n";
        }
        if (insuranceAlerts.length) {
          res += `⏳ Sắp đến hạn:\n` + insuranceAlerts.map((v) => `• ${v.plate} (Hạn: ${v.insuranceDue})`).join("\n") + "\n";
        }
        if (!expiredInsurance.length && !insuranceAlerts.length) {
          res += `• Không có xe nào quá hạn hoặc sắp đến hạn bảo hiểm.\n`;
        }

        return res;
      } catch (err) {
        return `Lỗi kiểm tra hạn đăng kiểm: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/**
 * 5. Tổng hợp tài chính cả tháng — khớp CHÍNH XÁC với màn hình "Doanh thu".
 *
 * Tái dùng đúng nguồn dữ liệu + hàm tính của trang doanh-thu:
 *  - getTrips() + buildMonthFinance (doanh thu ghi nhận theo ngày hoàn tất).
 *  - getFuelMonthTotals(monthKey) cho tiền dầu.
 *  - Lương: salariedPeople + buildSalaryRows + salaryCostForMonth (office + lái xe
 *    tháng + lái xe nhận công theo ngày qua PartnerPayout).
 * Không tự cộng tay để tránh lệch/nhân đôi số liệu.
 */
export function getMonthlyFinanceTool() {
  return tool({
    description:
      "Tổng hợp tài chính cả tháng (doanh thu ghi nhận, đã thanh toán, còn phải thu, tổng chi phí, lợi nhuận, số chuyến hoàn tất). Dùng khi hỏi: 'doanh thu tháng này', 'tài chính tháng 9', 'lợi nhuận tháng trước'.",
    inputSchema: z.object({
      monthKey: z
        .string()
        .optional()
        .describe("Tháng cần tổng hợp dạng YYYY-MM (ví dụ 2026-09). Mặc định là tháng hiện tại."),
    }),
    execute: async ({ monthKey }) => {
      const key = monthKey?.trim() || monthKeyOf(todayStr());
      if (!/^\d{4}-\d{2}$/.test(key)) {
        return `Tháng không hợp lệ: "${key}". Cần định dạng YYYY-MM (ví dụ 2026-09).`;
      }

      try {
        // Cùng bộ dữ liệu trang Doanh thu dùng (lấy tất cả rồi lọc theo tháng ở hàm chuẩn).
        const [trips, fuelMonth, office, drivers, months, payouts] = await Promise.all([
          getTrips(),
          getFuelMonthTotals(key),
          getOfficeStaff(),
          getDrivers(),
          getSalaryMonths(),
          getPartnerPayouts(),
        ]);

        const fuelTotal = fuelMonth.total;
        const people = salariedPeople(office, drivers);
        const salaryRows = buildSalaryRows(
          people,
          months.filter((m) => m.monthKey === key)
        );
        const salaryCost = salaryCostForMonth(salaryRows, payouts, key);

        // Một đường tính duy nhất — không cộng trùng.
        const { rows, summary, tripCosts, paidTotal, totalCost, profit } = buildMonthFinance(
          trips,
          key,
          fuelTotal,
          salaryCost
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
          `   • Tiền dầu: ${vnd(fuelTotal)} đ\n` +
          `   • Chi phí lương: ${vnd(salaryCost)} đ\n` +
          `5. Lợi nhuận: ${vnd(profit)} đ\n` +
          `6. Số chuyến hoàn tất trong tháng: ${summary.count} chuyến${
            noPriceCount > 0 ? ` (trong đó ${noPriceCount} chuyến chưa có giá)` : ""
          }`
        );
      } catch (err) {
        return `Lỗi tổng hợp tài chính tháng: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/** Gom toàn bộ System Read Tools thành một ToolSet cấp mặc định cho model. */
export function systemReadTools() {
  return {
    get_daily_trips: getDailyTripsTool(),
    get_available_vehicles: getAvailableVehiclesTool(),
    get_daily_summary: getDailySummaryTool(),
    get_vehicle_inspections: getVehicleInspectionsTool(),
    get_monthly_finance: getMonthlyFinanceTool(),
  };
}
