import { tool } from "ai";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { todayStr } from "@/utils/format";
import { dateRange, resolveRange, type UserRoleContext, vnd } from "./shared";

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
 * 6. Lịch chạy & thông tin tài xế theo khoảng ngày.
 *
 * Quy tắc an toàn: trường `baseSalary` CHỈ hiển thị cho quản lý; nhân viên thường
 * chỉ thấy tên, SĐT, bằng lái, loại tài xế và lịch chạy.
 */
export function getDriverScheduleTool(ctx: UserRoleContext) {
  return tool({
    description:
      "Tra cứu danh sách tài xế (tên, SĐT, bằng lái, lái xe nhà/đối tác) và lịch chạy cuốc của từng người theo khoảng ngày hoặc theo ngày. Dùng khi hỏi: 'lịch chạy của tài xế X', 'tài xế nào chạy cuốc nào', 'danh sách tài xế đối tác'.",
    inputSchema: z.object({
      driverName: z.string().optional().describe("Tên tài xế cần tìm (tìm gần đúng)"),
      fromDate: z.string().optional().describe("Từ ngày YYYY-MM-DD. Mặc định là hôm nay nếu không có toDate."),
      toDate: z.string().optional().describe("Đến ngày YYYY-MM-DD"),
      type: z.enum(["own", "partner"]).optional().describe("Lọc lái xe nhà (own) hay lái xe đối tác (partner)"),
    }),
    execute: async ({ driverName, fromDate, toDate, type }) => {
      const { from, to } = resolveRange(fromDate, toDate);

      try {
        const drivers = await prisma.driver.findMany({
          where: {
            ...(driverName ? { name: { contains: driverName, mode: "insensitive" } } : {}),
            ...(type ? { type } : {}),
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            phone: true,
            licenseClass: true,
            type: true,
            baseSalary: true,
          },
        });

        if (drivers.length === 0) {
          return `Không tìm thấy tài xế nào phù hợp${driverName ? ` với tên "${driverName}"` : ""}.`;
        }

        const driverIds = drivers.map((d) => d.id);
        const trips = await prisma.trip.findMany({
          where: {
            AND: [
              { OR: [{ outboundDriverId: { in: driverIds } }, { returnDriverId: { in: driverIds } }] },
              { OR: [{ outboundDate: dateRange(from, to) }, { returnDate: dateRange(from, to) }] },
            ],
          },
          include: {
            outboundVehicle: { select: { plate: true } },
            returnVehicle: { select: { plate: true } },
          },
          orderBy: [{ outboundDate: "asc" }, { outboundTime: "asc" }],
        });

        const blocks = drivers.map((d) => {
          const salaryLine = ctx.isManager ? ` | Lương cơ bản: ${vnd(d.baseSalary ?? 0)} đ` : "";
          const header =
            `[Tài xế] ${d.name}${d.phone ? ` — SĐT: ${d.phone}` : ""}\n` +
            `• Bằng lái: ${d.licenseClass ?? "—"} | Loại: ${
              d.type === "own" ? "Lái xe nhà" : "Lái xe đối tác"
            }${salaryLine}`;

          const lines: string[] = [];
          for (const t of trips) {
            if (t.outboundDriverId === d.id && t.outboundDate >= from && t.outboundDate <= to) {
              const plate = t.outboundVehicle?.plate ?? "Chưa gán xe";
              lines.push(
                `   - ${t.outboundDate} ${t.outboundTime ?? "—"}: ${t.outboundFrom} ➔ ${t.outboundTo} | Khách: ${
                  t.customerName
                } | Xe: ${plate} | ${t.status}`
              );
            }
            if (
              t.hasReturn &&
              t.returnDriverId === d.id &&
              (t.returnDate ?? "") >= from &&
              (t.returnDate ?? "") <= to
            ) {
              const plate = t.returnVehicle?.plate ?? "Chưa gán xe";
              lines.push(
                `   - ${t.returnDate} ${t.returnTime ?? "—"}: ${t.returnFrom ?? "?"} ➔ ${t.returnTo ?? "?"} (lượt về) | Khách: ${
                  t.customerName
                } | Xe: ${plate} | ${t.status}`
              );
            }
          }

          return `${header}\n${lines.length ? lines.join("\n") : "   (Không có cuốc nào trong khoảng ngày)"}`;
        });

        return `LỊCH CHẠY TÀI XẾ (${from} → ${to}):\n\n` + blocks.join("\n\n---\n\n");
      } catch (err) {
        return `Lỗi tra cứu lịch tài xế: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}

/**
 * 7. Tìm kiếm cuốc xe linh hoạt theo khách hàng / SĐT / mã chuyến / khoảng ngày / trạng thái.
 * Giới hạn 20 kết quả gần nhất để tránh quá tải context.
 */
export function searchTripsTool(ctx: UserRoleContext) {
  return tool({
    description:
      "Tìm kiếm cuốc xe theo tên/SĐT khách hàng, mã chuyến, khoảng ngày hoặc trạng thái. Dùng khi hỏi: 'cuốc của khách X', 'tìm chuyến theo SĐT', 'chuyến mã ABC', 'các cuốc từ ngày A đến ngày B'.",
    inputSchema: z.object({
      customerName: z.string().optional().describe("Tên khách hàng (tìm gần đúng)"),
      customerPhone: z.string().optional().describe("SĐT khách hàng (tìm gần đúng)"),
      tripId: z.string().optional().describe("Mã chuyến xe"),
      fromDate: z.string().optional().describe("Từ ngày YYYY-MM-DD"),
      toDate: z.string().optional().describe("Đến ngày YYYY-MM-DD"),
      status: z
        .string()
        .optional()
        .describe("Trạng thái chuyến: pending, in_progress, completed, completed_paid, cancelled"),
    }),
    execute: async ({ customerName, customerPhone, tripId, fromDate, toDate, status }) => {
      const hasDateFilter = Boolean(fromDate?.trim() || toDate?.trim());
      const { from, to } = resolveRange(fromDate, toDate);

      try {
        const filters: Prisma.TripWhereInput[] = [];
        if (tripId?.trim()) filters.push({ id: tripId.trim() });
        if (customerName?.trim()) {
          filters.push({ customerName: { contains: customerName.trim(), mode: "insensitive" } });
        }
        if (customerPhone?.trim()) {
          filters.push({ customerPhone: { contains: customerPhone.trim(), mode: "insensitive" } });
        }
        if (status?.trim()) filters.push({ status: status.trim() });
        if (hasDateFilter) {
          filters.push({ OR: [{ outboundDate: dateRange(from, to) }, { returnDate: dateRange(from, to) }] });
        }

        const trips = await prisma.trip.findMany({
          where: filters.length ? { AND: filters } : undefined,
          include: {
            outboundDriver: { select: { name: true, phone: true } },
            outboundVehicle: { select: { plate: true, seats: true } },
            returnDriver: { select: { name: true, phone: true } },
            returnVehicle: { select: { plate: true, seats: true } },
          },
          orderBy: [{ outboundDate: "desc" }, { outboundTime: "desc" }],
          take: 20,
        });

        if (trips.length === 0) {
          return "Không tìm thấy cuốc xe nào phù hợp với tiêu chí tìm kiếm.";
        }

        return (
          `TÌM THẤY ${trips.length} CUỐC XE (tối đa 20 kết quả gần nhất):\n\n` +
          trips
            .map((t, idx) => {
              const outLine = `${t.outboundFrom} ➔ ${t.outboundTo} (${t.outboundDate} ${t.outboundTime ?? "—"})`;
              const retLine =
                t.hasReturn && t.returnDate
                  ? `${t.returnFrom ?? "?"} ➔ ${t.returnTo ?? "?"} (${t.returnDate} ${t.returnTime ?? "—"})`
                  : null;
              const returnInfo =
                `\n• Chiều về: ${retLine}` +
                `\n• Xe về: ${t.returnVehicle?.plate ?? "Chưa gán"} | Lái về: ${t.returnDriver?.name ?? "Chưa gán"}`;

              return (
                `[Cuốc ${idx + 1}] Mã: ${t.id}\n` +
                `• Khách hàng: ${t.customerName}${t.customerPhone ? ` (${t.customerPhone})` : ""}\n` +
                `• Lộ trình: ${outLine}\n` +
                `• Xe đi: ${t.outboundVehicle?.plate ?? "Chưa gán"} | Lái đi: ${t.outboundDriver?.name ?? "Chưa gán"}` +
                (retLine ? returnInfo : "") +
                `\n• Loại tour: ${t.tourType} | Trạng thái: ${t.status}\n` +
                `• Giá: ${vnd(t.price ?? 0)} đ | Cọc: ${vnd(t.deposit ?? 0)} đ`
              );
            })
            .join("\n\n---\n\n")
        );
      } catch (err) {
        return `Lỗi tìm kiếm cuốc xe: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}
