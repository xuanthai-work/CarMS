import { tool } from "ai";
import { z } from "zod";
import { monthKeyOf, monthLabel, todayStr } from "@/utils/format";
import { buildSalaryRows, salariedPeople } from "@/utils/salary";
import { getSalaryMonths, getPartnerPayouts, getSalaryAdvances, getSalaryRates } from "@/services/salary";
import { getOfficeStaff } from "@/services/staff";
import { getDrivers } from "@/services/drivers";
import { NO_PERMISSION, type UserRoleContext, vnd } from "./shared";

/**
 * 9. Chi tiết bảng lương tháng: lương văn phòng, lương lái xe và công nợ tài xế đối tác.
 *
 * Phân quyền chặt chẽ:
 *  - Nhân viên thường (không quản lý) KHÔNG được xem lương nhân sự văn phòng
 *    (theo personType="office" hoặc khi personName khớp OfficeStaff) → từ chối.
 *  - Khi không chỉ định người: nhân viên thường chỉ thấy lương lái xe + công nợ đối tác.
 */
export function getSalaryBreakdownTool(ctx: UserRoleContext) {
  return tool({
    description:
      "Tra cứu chi tiết bảng lương theo tháng (lương cơ bản, phụ cấp/cộng, khấu trừ/tạm ứng, thực nhận) của nhân sự văn phòng & lái xe, cùng công nợ tài xế đối tác. Dùng khi hỏi: 'bảng lương tháng này', 'lương của X', 'công nợ tài xế đối tác'.",
    inputSchema: z.object({
      monthKey: z.string().optional().describe("Tháng dạng YYYY-MM. Mặc định là tháng hiện tại."),
      personName: z.string().optional().describe("Tên nhân sự hoặc tài xế (tìm gần đúng)"),
      personType: z.enum(["office", "driver", "partner"]).optional().describe("Nhóm: văn phòng, lái xe, đối tác"),
    }),
    execute: async ({ monthKey, personName, personType }) => {
      const key = monthKey?.trim() || monthKeyOf(todayStr());
      if (!/^\d{4}-\d{2}$/.test(key)) {
        return `Tháng không hợp lệ: "${key}". Cần định dạng YYYY-MM (ví dụ 2026-09).`;
      }
      if (personType === "office" && !ctx.isManager) {
        return NO_PERMISSION;
      }

      try {
        const [office, drivers, months, payouts, advances, rates] = await Promise.all([
          getOfficeStaff(),
          getDrivers(),
          getSalaryMonths(key),
          getPartnerPayouts(key),
          getSalaryAdvances(key),
          getSalaryRates(),
        ]);

        const name = personName?.trim().toLowerCase();
        const matchedOffice = name ? office.filter((o) => o.name.toLowerCase().includes(name)) : office;
        const matchedDrivers = name ? drivers.filter((d) => d.name.toLowerCase().includes(name)) : drivers;

        // Nhân viên thường hỏi đúng người là nhân sự văn phòng → chặn toàn bộ kết quả.
        if (!ctx.isManager && name && matchedOffice.length > 0) {
          return NO_PERMISSION;
        }

        const rows = buildSalaryRows(salariedPeople(office, drivers, key, rates), months, advances);
        const officeIds = new Set(matchedOffice.map((o) => o.id));
        const driverIds = new Set(matchedDrivers.map((d) => d.id));
        const driverNameById = new Map(drivers.map((d) => [d.id, d.name]));

        const wantOffice = ctx.isManager && personType !== "driver" && personType !== "partner";
        const wantDriver = personType !== "office" && personType !== "partner";
        const wantPartner = personType !== "office" && personType !== "driver";

        const sections: string[] = [];

        if (wantOffice) {
          const officeRows = rows.filter((r) => r.personType === "office" && officeIds.has(r.personId));
          const lines = officeRows.map(
            (r) =>
              `• ${r.name} (${r.role}) — Lương CB: ${vnd(r.baseSalary)} đ | Cộng: ${vnd(r.additions)} đ | Trừ: ${vnd(
                r.deductions + r.advances
              )} đ | Thực nhận: ${vnd(r.net)} đ | ${r.paid ? "Đã trả" : "Chưa trả"}`
          );
          sections.push(
            `1. LƯƠNG NHÂN SỰ VĂN PHÒNG (${officeRows.length}):\n` +
              (lines.length ? lines.join("\n") : "• Không có nhân sự văn phòng nào phù hợp.")
          );
        }

        if (wantDriver) {
          const driverRows = rows.filter((r) => r.personType === "driver" && driverIds.has(r.personId));
          const lines = driverRows.map(
            (r) =>
              `• ${r.name} (Lái xe) — Lương CB: ${vnd(r.baseSalary)} đ | Cộng: ${vnd(r.additions)} đ | Trừ: ${vnd(
                r.deductions + r.advances
              )} đ | Thực nhận: ${vnd(r.net)} đ | ${r.paid ? "Đã trả" : "Chưa trả"}`
          );
          sections.push(
            `LƯƠNG LÁI XE (${driverRows.length}):\n` +
              (lines.length ? lines.join("\n") : "• Không có lái xe nào phù hợp.")
          );
        }

        if (wantPartner) {
          const matchedPayouts = name
            ? payouts.filter((p) => (driverNameById.get(p.driverId) ?? "").toLowerCase().includes(name))
            : payouts;
          const total = matchedPayouts.reduce((acc, p) => acc + p.amount, 0);
          const lines = matchedPayouts.map(
            (p) =>
              `• ${driverNameById.get(p.driverId) ?? "Tài xế ?"} — ${p.workDate}: ${vnd(p.amount)} đ | ${
                p.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"
              }${p.note?.trim() ? ` | ${p.note.trim()}` : ""}`
          );
          sections.push(
            `CÔNG NỢ TÀI XẾ ĐỐI TÁC (${matchedPayouts.length} lượt):\n` +
              (lines.length ? lines.join("\n") : "• Không có công nợ đối tác nào phù hợp.") +
              `\n• Tổng: ${vnd(total)} đ`
          );
        }

        if (sections.length === 0) {
          return "Không có dữ liệu lương phù hợp với tiêu chí tra cứu.";
        }

        return `BẢNG LƯƠNG & CÔNG NỢ — ${monthLabel(key)}:\n\n` + sections.join("\n\n");
      } catch (err) {
        return `Lỗi tra cứu bảng lương: ${err instanceof Error ? err.message : String(err)}`;
      }
    },
  });
}
