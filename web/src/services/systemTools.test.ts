import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma (KHÔNG đụng DB thật). vi.hoisted để hàm mock tồn tại trước khi factory chạy.
const db = vi.hoisted(() => ({
  tripFindMany: vi.fn(),
  vehicleFindMany: vi.fn(),
  fuelEntryFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: { findMany: db.tripFindMany },
    vehicle: { findMany: db.vehicleFindMany },
    fuelEntry: { findMany: db.fuelEntryFindMany },
  },
}));

import {
  getAvailableVehiclesTool,
  getDailySummaryTool,
  getDailyTripsTool,
  systemReadTools,
} from "./systemTools";

const vnd = (n: number) => n.toLocaleString("vi-VN");

/** Tham số thứ 2 của execute (options) — các tool này không dùng tới. */
function callOptions<T extends { execute?: (...args: never[]) => unknown }>(tool: T) {
  return { toolCallId: "test", messages: [] } as unknown as Parameters<NonNullable<T["execute"]>>[1];
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("systemReadTools", () => {
  it("trả về đủ 4 tool đọc với inputSchema + execute", () => {
    const tools = systemReadTools();
    expect(Object.keys(tools).sort()).toEqual([
      "get_available_vehicles",
      "get_daily_summary",
      "get_daily_trips",
      "get_vehicle_inspections",
    ]);
    for (const t of Object.values(tools)) {
      expect(t.inputSchema).toBeDefined();
      expect(typeof t.description).toBe("string");
      expect(typeof t.execute).toBe("function");
    }
  });
});

describe("getDailyTripsTool", () => {
  it("lọc theo ngày bằng AND (không bị OR của bộ lọc khác ghi đè) và format dữ liệu", async () => {
    db.tripFindMany.mockResolvedValue([
      {
        id: "t-1",
        customerName: "Anh Nam",
        customerPhone: "0901234567",
        tourType: "1d",
        status: "pending",
        price: 1_250_000,
        deposit: 300_000,
        outboundDate: "2026-07-15",
        outboundTime: "08:00",
        outboundFrom: "Hà Nội",
        outboundTo: "Cát Bà",
        outboundDriver: { name: "Lái A", phone: "0912" },
        outboundVehicle: { plate: "29A-12345", seats: 7 },
        returnDriver: null,
        returnVehicle: null,
      },
    ]);

    const tool = getDailyTripsTool();
    const out = (await tool.execute!(
      { date: "2026-07-15", driverName: "Lái" },
      callOptions(tool)
    )) as string;

    // Điều kiện ngày + điều kiện tài xế nằm cùng trong AND, không ghi đè nhau.
    const arg = db.tripFindMany.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(Array.isArray(arg.where.AND)).toBe(true);
    expect(arg.where.AND.length).toBe(2);
    expect(arg.where.AND[0]).toEqual({
      OR: [{ outboundDate: "2026-07-15" }, { returnDate: "2026-07-15" }],
    });

    expect(out).toContain("Anh Nam");
    expect(out).toContain("Hà Nội ➔ Cát Bà");
    expect(out).toContain("29A-12345");
    expect(out).toContain("Lái A");
    expect(out).toContain(`${vnd(1_250_000)} đ`);
  });

  it("không có chuyến → thông báo trống", async () => {
    db.tripFindMany.mockResolvedValue([]);
    const tool = getDailyTripsTool();
    const out = (await tool.execute!({ date: "2026-07-15" }, callOptions(tool))) as string;
    expect(out).toBe("Ngày 2026-07-15 không có chuyến xe nào phù hợp với tiêu chí tìm kiếm.");
  });
});

describe("getAvailableVehiclesTool", () => {
  it("tách đúng xe rảnh và xe bận theo lịch trong ngày", async () => {
    db.vehicleFindMany.mockResolvedValue([
      { id: "v1", plate: "29A-111", seats: 7, type: "own", note: null },
      { id: "v2", plate: "29A-222", seats: 4, type: "own", note: null },
      { id: "v3", plate: "29B-333", seats: 16, type: "partner", note: null },
    ]);
    db.tripFindMany.mockResolvedValue([
      {
        outboundDate: "2026-07-15",
        outboundVehicleId: "v1",
        outboundFrom: "Hà Nội",
        outboundTo: "Hạ Long",
        outboundTime: "07:30",
        returnDate: null,
        returnVehicleId: null,
        returnFrom: null,
        returnTo: null,
        returnTime: null,
      },
    ]);

    const tool = getAvailableVehiclesTool();
    const out = (await tool.execute!({ date: "2026-07-15" }, callOptions(tool))) as string;

    expect(out).toContain("XE ĐANG RẢNH (2 xe)");
    expect(out).toContain("XE ĐANG BẬN CÓ LỊCH (1 xe)");
    expect(out).toContain("29A-222");
    expect(out).toContain("29B-333");
    expect(out).toContain("29A-111");
    expect(out).toContain("Đi Hà Nội ➔ Hạ Long");
  });
});

describe("getDailySummaryTool", () => {
  it("tính đúng doanh thu/đã thu/còn thu/chi phí chuyến/tiền dầu theo tripMoney", async () => {
    db.tripFindMany.mockResolvedValue([
      // completed_paid → thu đủ price; chi phí = toll
      { id: "t1", price: 1_000_000, deposit: 200_000, status: "completed_paid", tollCost: 50_000, partnerCost: 0, otherCost: 0 },
      // pending → chỉ thu cọc; chi phí = partner + other
      { id: "t2", price: 2_000_000, deposit: 500_000, status: "pending", tollCost: 0, partnerCost: 300_000, otherCost: 20_000 },
      // cancelled → bị loại hoàn toàn
      { id: "t3", price: 9_000_000, deposit: 0, status: "cancelled", tollCost: 0, partnerCost: 0, otherCost: 0 },
    ]);
    db.fuelEntryFindMany.mockResolvedValue([
      { amount: 400_000, paymentStatus: "paid" },
      { amount: 100_000, paymentStatus: "unpaid" },
    ]);

    const tool = getDailySummaryTool();
    const out = (await tool.execute!({ date: "2026-07-15" }, callOptions(tool))) as string;

    // Doanh thu ghi nhận = 1.0M + 2.0M = 3.0M
    expect(out).toContain(`Doanh thu ghi nhận: ${vnd(3_000_000)} đ`);
    // Đã thu = 1.0M (completed_paid) + 0.5M (cọc) = 1.5M
    expect(out).toContain(`Đã thu (cọc/thu trước): ${vnd(1_500_000)} đ`);
    expect(out).toContain(`Còn phải thu: ${vnd(1_500_000)} đ`);
    // Chi phí chuyến = 50k + 320k = 370k
    expect(out).toContain(`Chi phí chuyến (cầu đường, đối tác, khác): ${vnd(370_000)} đ`);
    // Tiền dầu = 500k, 2 lượt
    expect(out).toContain(`Lượt đổ dầu: 2 lượt`);
    expect(out).toContain(`Tổng tiền dầu: ${vnd(500_000)} đ`);
    // Lợi nhuận = 3.0M - 370k - 500k = 2.13M
    expect(out).toContain(`Lợi nhuận tạm tính (Doanh thu - Chi phí chuyến - Tiền dầu): ${vnd(2_130_000)} đ`);
    // Đếm trạng thái: 3 chuyến, 1 xong, 1 hủy, 1 đang chạy/chờ
    expect(out).toContain("Tổng số chuyến: 3");
  });
});
