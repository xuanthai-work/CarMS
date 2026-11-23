import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { todayStr } from "@/utils/format";

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
