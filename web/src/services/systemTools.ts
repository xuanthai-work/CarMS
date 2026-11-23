/**
 * Bộ công cụ CHỈ-ĐỌC dữ liệu thật của CarMS cho Trợ lý Meow.
 *
 * Ràng buộc an toàn: chỉ dùng các hàm đọc của Prisma (findMany/count/aggregate),
 * TUYỆT ĐỐI không create/update/delete/upsert.
 *
 * Tiền của chuyến được suy theo đúng quy chuẩn hiện hành ở utils/revenue.ts
 * (tripMoney — bên trong gọi tripCost), không tự cộng tay rồi lệch quy tắc.
 *
 * Chi tiết từng tool được tách theo module trong services/tools/.
 */

export type { UserRoleContext } from "./tools/shared";
export { getDailyTripsTool, searchTripsTool, getDriverScheduleTool } from "./tools/trips";
export { getAvailableVehiclesTool, getVehicleInspectionsTool } from "./tools/vehicles";
export { getDailySummaryTool, getMonthlyFinanceTool } from "./tools/finance";
export { getFuelHistoryTool } from "./tools/fuel";
export { getSalaryBreakdownTool } from "./tools/salary";

import type { UserRoleContext } from "./tools/shared";
import { getDailyTripsTool, searchTripsTool, getDriverScheduleTool } from "./tools/trips";
import { getAvailableVehiclesTool, getVehicleInspectionsTool } from "./tools/vehicles";
import { getDailySummaryTool, getMonthlyFinanceTool } from "./tools/finance";
import { getFuelHistoryTool } from "./tools/fuel";
import { getSalaryBreakdownTool } from "./tools/salary";

/** Gom toàn bộ System Read Tools thành một ToolSet cấp cho model (đã áp ngữ cảnh vai trò). */
export function systemReadTools(ctx: UserRoleContext = { isManager: false }) {
  return {
    get_daily_trips: getDailyTripsTool(),
    get_available_vehicles: getAvailableVehiclesTool(),
    get_daily_summary: getDailySummaryTool(ctx),
    get_vehicle_inspections: getVehicleInspectionsTool(),
    get_monthly_finance: getMonthlyFinanceTool(ctx),
    get_driver_schedule: getDriverScheduleTool(ctx),
    search_trips: searchTripsTool(ctx),
    get_fuel_history: getFuelHistoryTool(ctx),
    get_salary_breakdown: getSalaryBreakdownTool(ctx),
  };
}
