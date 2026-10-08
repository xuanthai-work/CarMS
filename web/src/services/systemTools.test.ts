import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Prisma (KHÔNG đụng DB thật). vi.hoisted để hàm mock tồn tại trước khi factory chạy.
const db = vi.hoisted(() => ({
  tripFindMany: vi.fn(),
  vehicleFindMany: vi.fn(),
  fuelEntryFindMany: vi.fn(),
  salaryMonthFindMany: vi.fn(),
  partnerPayoutFindMany: vi.fn(),
  officeStaffFindMany: vi.fn(),
  driverFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    trip: { findMany: db.tripFindMany },
    vehicle: { findMany: db.vehicleFindMany },
    fuelEntry: { findMany: db.fuelEntryFindMany },
    salaryMonth: { findMany: db.salaryMonthFindMany },
    partnerPayout: { findMany: db.partnerPayoutFindMany },
    officeStaff: { findMany: db.officeStaffFindMany },
    driver: { findMany: db.driverFindMany },
  },
}));

import {
  getAvailableVehiclesTool,
  getDailySummaryTool,
  getDailyTripsTool,
  getDriverScheduleTool,
  getFuelHistoryTool,
  getMonthlyFinanceTool,
  getSalaryBreakdownTool,
  searchTripsTool,
  systemReadTools,
} from "./systemTools";

const MANAGER = { isManager: true };
const STAFF = { isManager: false };

const vnd = (n: number) => n.toLocaleString("vi-VN");

/** Tham số thứ 2 của execute (options) — các tool này không dùng tới. */
function callOptions<T extends { execute?: (...args: never[]) => unknown }>(tool: T) {
  return { toolCallId: "test", messages: [] } as unknown as Parameters<NonNullable<T["execute"]>>[1];
}

/** Hàng Trip Prisma đầy đủ field (mapper toTrip trong services/trips đọc hết). */
function tripRow(over: Record<string, unknown> = {}) {
  return {
    id: "t-x",
    customerName: "Khách",
    customerPhone: null,
    tourType: "1d",
    price: null,
    deposit: null,
    status: "pending",
    heldThroughTour: false,
    note: null,
    tollCost: null,
    partnerCost: null,
    otherCost: null,
    outboundDate: "2026-09-01",
    outboundTime: null,
    outboundEndTime: null,
    outboundFrom: "A",
    outboundTo: "B",
    outboundVehicleId: null,
    outboundDriverId: null,
    outboundSeatClass: null,
    hasReturn: false,
    returnDate: null,
    returnTime: null,
    returnEndTime: null,
    returnFrom: null,
    returnTo: null,
    returnVehicleId: null,
    returnDriverId: null,
    returnSeatClass: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  db.salaryMonthFindMany.mockResolvedValue([]);
  db.partnerPayoutFindMany.mockResolvedValue([]);
  db.officeStaffFindMany.mockResolvedValue([]);
  db.driverFindMany.mockResolvedValue([]);
});

describe("systemReadTools", () => {
  it("trả về đủ 9 tool đọc với inputSchema + execute", () => {
    const tools = systemReadTools(MANAGER);
    expect(Object.keys(tools).sort()).toEqual([
      "get_available_vehicles",
      "get_daily_summary",
      "get_daily_trips",
      "get_driver_schedule",
      "get_fuel_history",
      "get_monthly_finance",
      "get_salary_breakdown",
      "get_vehicle_inspections",
      "search_trips",
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
  it("tính doanh thu theo NGÀY HOÀN TẤT, đếm vận hành riêng", async () => {
    db.tripFindMany.mockResolvedValue([
      // Hoàn tất 15/07 (một chiều) → tính doanh thu ngày 15/07.
      tripRow({
        id: "t1",
        outboundDate: "2026-07-15",
        hasReturn: false,
        status: "completed_paid",
        price: 1_000_000,
        deposit: 200_000,
        tollCost: 50_000,
      }),
      // Hoàn tất 15/07 (khứ hồi, về 15/07) → tính doanh thu ngày 15/07.
      tripRow({
        id: "t2",
        outboundDate: "2026-07-14",
        hasReturn: true,
        returnDate: "2026-07-15",
        status: "pending",
        price: 2_000_000,
        deposit: 500_000,
        partnerCost: 300_000,
        otherCost: 20_000,
      }),
      // Vận hành 15/07 nhưng HOÀN TẤT 16/07 → KHÔNG tính doanh thu ngày 15/07.
      tripRow({
        id: "t3",
        outboundDate: "2026-07-15",
        hasReturn: true,
        returnDate: "2026-07-16",
        status: "pending",
        price: 9_000_000,
      }),
    ]);
    db.fuelEntryFindMany.mockResolvedValue([
      { amount: 400_000, paymentStatus: "paid" },
      { amount: 100_000, paymentStatus: "unpaid" },
    ]);

    const tool = getDailySummaryTool(MANAGER);
    const out = (await tool.execute!({ date: "2026-07-15" }, callOptions(tool))) as string;

    // Vận hành: cả 3 chuyến đều có lượt đi/về rơi vào 15/07.
    expect(out).toContain("Lượt chuyến hoạt động: 3");
    // Tài chính: chỉ t1 + t2 hoàn tất 15/07.
    expect(out).toContain("Số chuyến hoàn tất hôm nay: 2");
    expect(out).toContain(`Doanh thu ghi nhận: ${vnd(3_000_000)} đ`);
    expect(out).toContain(`Đã thu (cọc/thu trước): ${vnd(1_500_000)} đ`);
    expect(out).toContain(`Còn phải thu: ${vnd(1_500_000)} đ`);
    expect(out).toContain(`Chi phí chuyến (cầu đường, đối tác, khác): ${vnd(370_000)} đ`);
    expect(out).toContain("Lượt đổ dầu: 2 lượt");
    expect(out).toContain(`Tổng tiền dầu: ${vnd(500_000)} đ`);
    expect(out).toContain(`Lợi nhuận tạm tính (Doanh thu ghi nhận - Chi phí chuyến - Tiền dầu): ${vnd(2_130_000)} đ`);
  });

  it("chuyến khứ hồi đi 01/09 về 02/09: doanh thu chỉ ghi nhận ngày 02/09, không trùng ngày 01/09", async () => {
    db.tripFindMany.mockResolvedValue([
      tripRow({
        id: "r1",
        outboundDate: "2026-09-01",
        hasReturn: true,
        returnDate: "2026-09-02",
        status: "pending",
        price: 1_000_000,
        deposit: 100_000,
      }),
    ]);
    db.fuelEntryFindMany.mockResolvedValue([]);

    const tool = getDailySummaryTool(MANAGER);
    const out0109 = (await tool.execute!({ date: "2026-09-01" }, callOptions(tool))) as string;
    const out0209 = (await tool.execute!({ date: "2026-09-02" }, callOptions(tool))) as string;

    // Ngày đi: chuyến có vận hành nhưng chưa hoàn tất → doanh thu 0.
    expect(out0109).toContain("Lượt chuyến hoạt động: 1");
    expect(out0109).toContain(`Doanh thu ghi nhận: ${vnd(0)} đ`);
    // Ngày về: mới ghi nhận doanh thu.
    expect(out0209).toContain(`Doanh thu ghi nhận: ${vnd(1_000_000)} đ`);
  });
});

describe("getMonthlyFinanceTool", () => {
  it("trả về đủ 6 chỉ số tài chính tháng, khớp buildMonthFinance", async () => {
    db.tripFindMany.mockResolvedValue([
      // Khứ hồi hoàn tất 02/09: doanh thu 1tr, đã thu cọc 200k, chi phí 50k.
      tripRow({
        id: "t1",
        outboundDate: "2026-09-01",
        hasReturn: true,
        returnDate: "2026-09-02",
        returnFrom: "B",
        returnTo: "A",
        status: "pending",
        price: 1_000_000,
        deposit: 200_000,
        tollCost: 50_000,
      }),
      // Một chiều hoàn tất 10/09, đã thanh toán đủ, chi phí đối tác 300k.
      tripRow({
        id: "t2",
        outboundDate: "2026-09-10",
        status: "completed_paid",
        price: 2_000_000,
        deposit: 2_000_000,
        partnerCost: 300_000,
      }),
      // Tháng 8 → không thuộc báo cáo tháng 9.
      tripRow({ id: "t3", outboundDate: "2026-08-20", status: "pending", price: 5_000_000 }),
    ]);
    db.fuelEntryFindMany.mockResolvedValue([
      {
        id: "f1",
        vehicleId: "v1",
        refuelDate: "2026-09-05",
        amount: 500_000,
        paymentStatus: "paid",
        paymentDate: null,
        payerName: "",
        note: null,
        source: "manual",
        createdAt: new Date("2026-09-05T00:00:00Z"),
        updatedAt: new Date("2026-09-05T00:00:00Z"),
      },
    ]);
    db.officeStaffFindMany.mockResolvedValue([
      {
        id: "o1",
        name: "Office",
        phone: null,
        position: "Nhân viên",
        baseSalary: 1_000_000,
        startDate: null,
        note: null,
        dob: null,
        gender: null,
        email: null,
        idNumber: null,
        socialInsurance: null,
        payday: null,
      },
    ]);
    db.driverFindMany.mockResolvedValue([
      { id: "d1", name: "Lái", phone: null, licenseClass: "B2", type: "own", baseSalary: 2_000_000, note: null },
    ]);
    db.partnerPayoutFindMany.mockResolvedValue([
      {
        id: "p1",
        driverId: "d1",
        workDate: "2026-09-05",
        amount: 400_000,
        paymentStatus: "unpaid",
        paymentDate: null,
        payerName: "",
        note: null,
        createdAt: new Date("2026-09-05T00:00:00Z"),
        updatedAt: new Date("2026-09-05T00:00:00Z"),
      },
    ]);

    const tool = getMonthlyFinanceTool(MANAGER);
    const out = (await tool.execute!({ monthKey: "2026-09" }, callOptions(tool))) as string;

    // Doanh thu ghi nhận = 1.0M + 2.0M = 3.0M
    expect(out).toContain(`1. Doanh thu ghi nhận: ${vnd(3_000_000)} đ`);
    // Đã thanh toán = chuyến completed_paid = 2.0M
    expect(out).toContain(`2. Đã thanh toán (completed_paid): ${vnd(2_000_000)} đ`);
    // Còn phải thu = 800k (t1) + 0 (t2) = 800k
    expect(out).toContain(`3. Còn phải thu: ${vnd(800_000)} đ`);
    // Tổng chi phí = 350k chuyến + 500k dầu + 3.4M lương = 4.25M
    expect(out).toContain(`4. Tổng chi phí tháng: ${vnd(4_250_000)} đ`);
    expect(out).toContain(`• Tiền dầu: ${vnd(500_000)} đ`);
    expect(out).toContain(`• Chi phí lương: ${vnd(3_400_000)} đ`);
    // Lợi nhuận = 3.0M - 4.25M = -1.25M
    expect(out).toContain(`5. Lợi nhuận: ${vnd(-1_250_000)} đ`);
    // 2 chuyến hoàn tất trong tháng 9
    expect(out).toContain("6. Số chuyến hoàn tất trong tháng: 2 chuyến");
  });

  it("monthKey sai định dạng → báo lỗi, không truy vấn", async () => {
    const tool = getMonthlyFinanceTool(MANAGER);
    const out = (await tool.execute!({ monthKey: "09/2026" }, callOptions(tool))) as string;
    expect(out).toContain("Tháng không hợp lệ");
    expect(db.tripFindMany).not.toHaveBeenCalled();
  });
});

describe("role guard các tool tài chính", () => {
  it("getDailySummaryTool: nhân viên thường bị từ chối", async () => {
    const tool = getDailySummaryTool(STAFF);
    const out = (await tool.execute!({ date: "2026-07-15" }, callOptions(tool))) as string;
    expect(out).toBe("Bạn không có quyền truy cập thông tin này");
    expect(db.tripFindMany).not.toHaveBeenCalled();
  });

  it("getMonthlyFinanceTool: nhân viên thường bị từ chối", async () => {
    const tool = getMonthlyFinanceTool(STAFF);
    const out = (await tool.execute!({ monthKey: "2026-09" }, callOptions(tool))) as string;
    expect(out).toBe("Bạn không có quyền truy cập thông tin này");
  });
});

describe("getDriverScheduleTool", () => {
  const drivers = [
    { id: "d1", name: "Lái A", phone: "0912", licenseClass: "B2", type: "own", baseSalary: 5_000_000 },
  ];
  const trips = [
    {
      id: "t1",
      customerName: "Anh Nam",
      status: "pending",
      hasReturn: false,
      outboundDate: "2026-07-15",
      outboundTime: "08:00",
      outboundFrom: "Hà Nội",
      outboundTo: "Cát Bà",
      outboundDriverId: "d1",
      returnDriverId: null,
      returnDate: null,
      returnTime: null,
      returnFrom: null,
      returnTo: null,
      outboundVehicle: { plate: "29A-12345" },
      returnVehicle: null,
    },
  ];

  it("quản lý thấy lương cơ bản và lịch chạy", async () => {
    db.driverFindMany.mockResolvedValue(drivers);
    db.tripFindMany.mockResolvedValue(trips);

    const tool = getDriverScheduleTool(MANAGER);
    const out = (await tool.execute!({ fromDate: "2026-07-15" }, callOptions(tool))) as string;

    expect(out).toContain("Lái A");
    expect(out).toContain(`Lương cơ bản: ${vnd(5_000_000)} đ`);
    expect(out).toContain("Hà Nội ➔ Cát Bà");
    expect(out).toContain("29A-12345");
  });

  it("nhân viên thường KHÔNG thấy baseSalary", async () => {
    db.driverFindMany.mockResolvedValue(drivers);
    db.tripFindMany.mockResolvedValue(trips);

    const tool = getDriverScheduleTool(STAFF);
    const out = (await tool.execute!({ fromDate: "2026-07-15" }, callOptions(tool))) as string;

    expect(out).toContain("Lái A");
    expect(out).not.toContain("Lương cơ bản");
    expect(out).not.toContain(vnd(5_000_000));
  });
});

describe("searchTripsTool", () => {
  it("lọc theo SĐT + khoảng ngày và format kết quả", async () => {
    db.tripFindMany.mockResolvedValue([
      {
        id: "t-9",
        customerName: "Chị Hoa",
        customerPhone: "0909999888",
        tourType: "1d",
        status: "completed",
        price: 2_000_000,
        deposit: 500_000,
        outboundDate: "2026-07-15",
        outboundTime: "07:00",
        outboundFrom: "Hà Nội",
        outboundTo: "Ninh Bình",
        hasReturn: true,
        returnDate: "2026-07-16",
        returnTime: "17:00",
        returnFrom: "Ninh Bình",
        returnTo: "Hà Nội",
        outboundDriver: { name: "Lái A", phone: "0912" },
        outboundVehicle: { plate: "29A-12345", seats: 7 },
        returnDriver: { name: "Lái B", phone: "0913" },
        returnVehicle: { plate: "29A-12345", seats: 7 },
      },
    ]);

    const tool = searchTripsTool(STAFF);
    const out = (await tool.execute!(
      { customerPhone: "0909999", fromDate: "2026-07-01", toDate: "2026-07-31" },
      callOptions(tool)
    )) as string;

    const arg = db.tripFindMany.mock.calls[0][0] as { where: { AND: unknown[] }; take: number };
    expect(arg.where.AND).toContainEqual({
      customerPhone: { contains: "0909999", mode: "insensitive" },
    });
    expect(arg.where.AND).toContainEqual({
      OR: [
        { outboundDate: { gte: "2026-07-01", lte: "2026-07-31" } },
        { returnDate: { gte: "2026-07-01", lte: "2026-07-31" } },
      ],
    });
    expect(arg.take).toBe(20);
    expect(out).toContain("Chị Hoa");
    expect(out).toContain("0909999888");
    expect(out).toContain("Lái A");
    expect(out).toContain("Lái B");
  });

  it("không có kết quả → thông báo trống", async () => {
    db.tripFindMany.mockResolvedValue([]);
    const tool = searchTripsTool(STAFF);
    const out = (await tool.execute!({ customerName: "Không Tồn Tại" }, callOptions(tool))) as string;
    expect(out).toBe("Không tìm thấy cuốc xe nào phù hợp với tiêu chí tìm kiếm.");
  });
});

describe("getFuelHistoryTool", () => {
  it("lọc theo biển số và trạng thái thanh toán, tính tổng", async () => {
    db.fuelEntryFindMany.mockResolvedValue([
      {
        refuelDate: "2026-09-05",
        amount: 500_000,
        paymentStatus: "unpaid",
        payerName: "",
        note: "",
        vehicle: { plate: "29A-12345" },
      },
      {
        refuelDate: "2026-09-08",
        amount: 300_000,
        paymentStatus: "unpaid",
        payerName: "Anh Tuấn",
        note: "Đổ dọc đường",
        vehicle: { plate: "29A-12345" },
      },
    ]);

    const tool = getFuelHistoryTool(STAFF);
    const out = (await tool.execute!(
      { vehiclePlate: "29A-12345", monthKey: "2026-09", paymentStatus: "unpaid" },
      callOptions(tool)
    )) as string;

    const arg = db.fuelEntryFindMany.mock.calls[0][0] as { where: { AND: unknown[] } };
    expect(arg.where.AND).toContainEqual({
      vehicle: { plate: { contains: "29A-12345", mode: "insensitive" } },
    });
    expect(arg.where.AND).toContainEqual({ paymentStatus: "unpaid" });
    expect(arg.where.AND).toContainEqual({
      refuelDate: { gte: "2026-09-01", lt: "2026-10-01" },
    });
    expect(out).toContain("Tổng số lần đổ dầu: 2 lượt");
    expect(out).toContain(`Tổng tiền dầu: ${vnd(800_000)} đ`);
    expect(out).toContain("Anh Tuấn");
  });
});

describe("getSalaryBreakdownTool", () => {
  const office = [
    {
      id: "o1",
      name: "Trợ lý An",
      phone: null,
      position: "Nhân viên",
      baseSalary: 8_000_000,
      startDate: null,
      note: null,
      dob: null,
      gender: null,
      email: null,
      idNumber: null,
      socialInsurance: null,
      payday: null,
    },
  ];
  const drivers = [
    { id: "d1", name: "Lái A", phone: null, licenseClass: "B2", type: "own", baseSalary: 6_000_000, note: null },
    { id: "d2", name: "Tài đối tác", phone: null, licenseClass: "C", type: "partner", baseSalary: null, note: null },
  ];

  it("quản lý tra cứu được lương văn phòng và lái xe", async () => {
    db.officeStaffFindMany.mockResolvedValue(office);
    db.driverFindMany.mockResolvedValue(drivers);
    db.salaryMonthFindMany.mockResolvedValue([]);
    db.partnerPayoutFindMany.mockResolvedValue([]);

    const tool = getSalaryBreakdownTool(MANAGER);
    const out = (await tool.execute!({ monthKey: "2026-09" }, callOptions(tool))) as string;

    expect(out).toContain("LƯƠNG NHÂN SỰ VĂN PHÒNG");
    expect(out).toContain("Trợ lý An");
    expect(out).toContain("LƯƠNG LÁI XE");
    expect(out).toContain("Lái A");
  });

  it("nhân viên thường hỏi lương văn phòng (personType=office) → từ chối", async () => {
    const tool = getSalaryBreakdownTool(STAFF);
    const out = (await tool.execute!({ monthKey: "2026-09", personType: "office" }, callOptions(tool))) as string;
    expect(out).toBe("Bạn không có quyền truy cập thông tin này");
    expect(db.officeStaffFindMany).not.toHaveBeenCalled();
  });

  it("nhân viên thường hỏi tên một nhân sự văn phòng → từ chối", async () => {
    db.officeStaffFindMany.mockResolvedValue(office);
    db.driverFindMany.mockResolvedValue(drivers);

    const tool = getSalaryBreakdownTool(STAFF);
    const out = (await tool.execute!({ monthKey: "2026-09", personName: "An" }, callOptions(tool))) as string;
    expect(out).toBe("Bạn không có quyền truy cập thông tin này");
  });

  it("nhân viên thường KHÔNG chỉ định người: chỉ thấy lái xe + công nợ đối tác, không có văn phòng", async () => {
    db.officeStaffFindMany.mockResolvedValue(office);
    db.driverFindMany.mockResolvedValue(drivers);
    db.salaryMonthFindMany.mockResolvedValue([]);
    db.partnerPayoutFindMany.mockResolvedValue([
      {
        id: "p1",
        driverId: "d2",
        workDate: "2026-09-05",
        amount: 400_000,
        paymentStatus: "unpaid",
        paymentDate: null,
        payerName: "",
        note: null,
        createdAt: new Date("2026-09-05T00:00:00Z"),
        updatedAt: new Date("2026-09-05T00:00:00Z"),
      },
    ]);

    const tool = getSalaryBreakdownTool(STAFF);
    const out = (await tool.execute!({ monthKey: "2026-09" }, callOptions(tool))) as string;

    expect(out).not.toContain("LƯƠNG NHÂN SỰ VĂN PHÒNG");
    expect(out).not.toContain("Trợ lý An");
    expect(out).toContain("LƯƠNG LÁI XE");
    expect(out).toContain("CÔNG NỢ TÀI XẾ ĐỐI TÁC");
    expect(out).toContain("Tài đối tác");
    expect(out).toContain(`${vnd(400_000)} đ`);
  });
});
