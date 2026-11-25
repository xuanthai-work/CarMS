import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockRequireEditor, mockRequireManagerEditor, mockRevalidateAll, mockPrisma } = vi.hoisted(() => ({
  mockRequireEditor: vi.fn(),
  mockRequireManagerEditor: vi.fn(),
  mockRevalidateAll: vi.fn(),
  mockPrisma: {
    officeStaff: { findUnique: vi.fn() },
    driver: { findUnique: vi.fn() },
    salaryMonth: { upsert: vi.fn() },
    salaryRate: { findMany: vi.fn() },
    partnerPayout: { create: vi.fn(), update: vi.fn() },
    salaryAdvance: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock("@/services/auth", () => ({
  requireEditor: mockRequireEditor,
  requireManagerEditor: mockRequireManagerEditor,
}));
vi.mock("./revalidate", () => ({ revalidateAll: mockRevalidateAll }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { saveSalaryMonth, savePartnerPayout, saveSalaryAdvance, deleteSalaryAdvance } from "./salary";

function makeFd(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("saveSalaryMonth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.officeStaff.findUnique.mockResolvedValue({ baseSalary: 10_000_000 });
    mockPrisma.driver.findUnique.mockResolvedValue({ baseSalary: 8_000_000 });
    mockPrisma.salaryMonth.upsert.mockResolvedValue({});
    mockPrisma.salaryRate.findMany.mockResolvedValue([]);
    mockPrisma.partnerPayout.create.mockResolvedValue({});
    mockPrisma.partnerPayout.update.mockResolvedValue({});
  });

  it("báo lỗi khi thiếu personId hoặc monthKey", async () => {
    const r1 = await saveSalaryMonth(makeFd({ personType: "driver", monthKey: "2026-11" }));
    expect(r1).toEqual({ ok: false, error: "Không xác định được người hoặc tháng lương." });

    const r2 = await saveSalaryMonth(makeFd({ personType: "driver", personId: "d1" }));
    expect(r2).toEqual({ ok: false, error: "Không xác định được người hoặc tháng lương." });
  });

  it("báo lỗi khi personType không hợp lệ", async () => {
    const r = await saveSalaryMonth(
      makeFd({ personType: "other", personId: "d1", monthKey: "2026-11" }),
    );
    expect(r).toEqual({ ok: false, error: "Không xác định được người hoặc tháng lương." });
  });

  it("báo lỗi khi trạng thái Đã trả nhưng thiếu ngày trả lương", async () => {
    const r = await saveSalaryMonth(
      makeFd({
        personType: "office",
        personId: "o1",
        monthKey: "2026-11",
        paymentStatus: "paid",
        paidDate: "",
      }),
    );
    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: false, error: "Vui lòng chọn ngày trả lương." });
    expect(mockPrisma.salaryMonth.upsert).not.toHaveBeenCalled();
  });

  it("lưu hợp lệ và trả OK với đúng fields", async () => {
    const r = await saveSalaryMonth(
      makeFd({
        personType: "driver",
        personId: "d1",
        monthKey: "2026-11",
        additions: "500.000",
        deductions: "100.000",
        paymentStatus: "paid",
        paidDate: "2026-11-25",
        note: "Thưởng",
      }),
    );
    expect(mockRequireEditor).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryMonth.upsert).toHaveBeenCalledWith({
      where: { personType_personId_monthKey: { personType: "driver", personId: "d1", monthKey: "2026-11" } },
      create: expect.objectContaining({
        personType: "driver",
        personId: "d1",
        monthKey: "2026-11",
        baseSalary: 8_000_000,
        additions: 500_000,
        deductions: 100_000,
        paid: true,
        paidDate: "2026-11-25",
        note: "Thưởng",
      }),
      update: {
        additions: 500_000,
        deductions: 100_000,
        paid: true,
        paidDate: "2026-11-25",
        note: "Thưởng",
      },
    });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
  });

  it("trả fail khi prisma upsert lỗi", async () => {
    mockPrisma.salaryMonth.upsert.mockRejectedValueOnce(new Error("DB error"));
    const r = await saveSalaryMonth(
      makeFd({ personType: "driver", personId: "d1", monthKey: "2026-11", paymentStatus: "unpaid" }),
    );
    expect(r).toEqual({ ok: false, error: "Không lưu được. Vui lòng thử lại." });
    expect(mockRevalidateAll).not.toHaveBeenCalled();
  });

  it("dùng mức lương từ SalaryRate theo tháng khi tạo dòng SalaryMonth mới", async () => {
    mockPrisma.salaryRate.findMany.mockResolvedValueOnce([
      { personType: "driver", personId: "d1", effectiveFrom: "1970-01-01", amount: 7_000_000 },
      { personType: "driver", personId: "d1", effectiveFrom: "2026-12-01", amount: 9_000_000 },
    ]);
    const r = await saveSalaryMonth(
      makeFd({ personType: "driver", personId: "d1", monthKey: "2026-11", paymentStatus: "unpaid" })
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryMonth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ baseSalary: 7_000_000 }),
      })
    );
  });
});

describe("saveSalaryAdvance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.salaryAdvance.create.mockResolvedValue({});
    mockPrisma.salaryAdvance.update.mockResolvedValue({});
  });

  it("kiểm tra validate date, amount và personType", async () => {
    expect(
      await saveSalaryAdvance(makeFd({ personType: "driver", personId: "d1", date: "", amount: "500000" }))
    ).toEqual({ ok: false, error: "Vui lòng chọn ngày ứng." });

    expect(
      await saveSalaryAdvance(makeFd({ personType: "driver", personId: "d1", date: "2026-11-10", amount: "0" }))
    ).toEqual({ ok: false, error: "Vui lòng nhập số tiền." });

    expect(
      await saveSalaryAdvance(makeFd({ personType: "other", personId: "d1", date: "2026-11-10", amount: "500000" }))
    ).toEqual({ ok: false, error: "Không xác định được nhân sự." });
  });

  it("office dùng requireManagerEditor, driver dùng requireEditor và tạo mới thành công", async () => {
    const r1 = await saveSalaryAdvance(
      makeFd({ personType: "office", personId: "o1", date: "2026-11-10", amount: "1.000.000", note: "Ứng" })
    );
    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ ok: true });
    expect(mockPrisma.salaryAdvance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        personType: "office",
        personId: "o1",
        date: "2026-11-10",
        amount: 1_000_000,
        note: "Ứng",
      }),
    });

    const r2 = await saveSalaryAdvance(
      makeFd({ personType: "driver", personId: "d1", date: "2026-11-12", amount: "500000" })
    );
    expect(mockRequireEditor).toHaveBeenCalledTimes(1);
    expect(r2).toEqual({ ok: true });
  });
});

describe("deleteSalaryAdvance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.salaryAdvance.delete.mockResolvedValue({});
  });

  it("trả lỗi nếu thiếu id hoặc không tìm thấy bản ghi", async () => {
    expect(await deleteSalaryAdvance(makeFd({}))).toEqual({
      ok: false,
      error: "Không tìm thấy khoản tạm ứng.",
    });

    mockPrisma.salaryAdvance.findUnique.mockResolvedValueOnce(null);
    expect(await deleteSalaryAdvance(makeFd({ id: "sa1" }))).toEqual({
      ok: false,
      error: "Không tìm thấy khoản tạm ứng.",
    });
  });

  it("áp đúng guard office/driver và xóa thành công", async () => {
    mockPrisma.salaryAdvance.findUnique.mockResolvedValueOnce({ personType: "office" });
    const r = await deleteSalaryAdvance(makeFd({ id: "sa1" }));
    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(mockPrisma.salaryAdvance.delete).toHaveBeenCalledWith({ where: { id: "sa1" } });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: true });
  });
});

describe("savePartnerPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.partnerPayout.create.mockResolvedValue({});
    mockPrisma.partnerPayout.update.mockResolvedValue({});
  });

  it("báo lỗi khi thiếu driverId", async () => {
    const r = await savePartnerPayout(makeFd({ workDate: "2026-11-01", amount: "500000" }));
    expect(r).toEqual({ ok: false, error: "Vui lòng chọn lái xe." });
    expect(mockPrisma.partnerPayout.create).not.toHaveBeenCalled();
  });

  it("báo lỗi khi thiếu workDate", async () => {
    const r = await savePartnerPayout(makeFd({ driverId: "d1", amount: "500000" }));
    expect(r).toEqual({ ok: false, error: "Vui lòng chọn ngày làm." });
    expect(mockPrisma.partnerPayout.create).not.toHaveBeenCalled();
  });

  it("báo lỗi khi thiếu amount (rỗng hoặc chỉ chữ)", async () => {
    const r1 = await savePartnerPayout(makeFd({ driverId: "d1", workDate: "2026-11-01", amount: "" }));
    expect(r1).toEqual({ ok: false, error: "Vui lòng nhập số tiền." });

    const r2 = await savePartnerPayout(makeFd({ driverId: "d1", workDate: "2026-11-01", amount: "abc" }));
    expect(r2).toEqual({ ok: false, error: "Vui lòng nhập số tiền." });
  });

  it("tạo mới hợp lệ với amount đúng số và paymentStatus mặc định unpaid", async () => {
    const r = await savePartnerPayout(
      makeFd({ driverId: "d1", workDate: "2026-11-01", amount: "800.000", payerName: "A", note: "Ghi chú" }),
    );
    expect(mockRequireEditor).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.partnerPayout.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        driverId: "d1",
        workDate: "2026-11-01",
        amount: 800_000,
        paymentStatus: "unpaid",
        payerName: "A",
        note: "Ghi chú",
      }),
    });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
  });

  it("sửa hợp lệ gọi update", async () => {
    const r = await savePartnerPayout(
      makeFd({ id: "pp1", driverId: "d1", workDate: "2026-11-02", amount: "1.200.000", paymentStatus: "paid" }),
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.partnerPayout.update).toHaveBeenCalledWith({
      where: { id: "pp1" },
      data: {
        driverId: "d1",
        workDate: "2026-11-02",
        amount: 1_200_000,
        paymentStatus: "paid",
        payerName: "",
        note: "",
      },
    });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
  });

  it("trả fail khi prisma create lỗi và không revalidateAll", async () => {
    mockPrisma.partnerPayout.create.mockRejectedValueOnce(new Error("DB error"));
    const r = await savePartnerPayout(
      makeFd({ driverId: "d1", workDate: "2026-11-01", amount: "500000" }),
    );
    expect(r).toEqual({ ok: false, error: "Không lưu được. Vui lòng thử lại." });
    expect(mockRevalidateAll).not.toHaveBeenCalled();
  });

  it("dùng mức lương từ SalaryRate theo tháng khi tạo dòng SalaryMonth mới", async () => {
    mockPrisma.salaryRate.findMany.mockResolvedValueOnce([
      { personType: "driver", personId: "d1", effectiveFrom: "1970-01-01", amount: 7_000_000 },
      { personType: "driver", personId: "d1", effectiveFrom: "2026-12-01", amount: 9_000_000 },
    ]);
    const r = await saveSalaryMonth(
      makeFd({ personType: "driver", personId: "d1", monthKey: "2026-11", paymentStatus: "unpaid" })
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryMonth.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ baseSalary: 7_000_000 }),
      })
    );
  });
});

describe("saveSalaryAdvance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.salaryAdvance.create.mockResolvedValue({});
    mockPrisma.salaryAdvance.update.mockResolvedValue({});
  });

  it("kiểm tra validate date, amount và personType", async () => {
    expect(
      await saveSalaryAdvance(makeFd({ personType: "driver", personId: "d1", date: "", amount: "500000" }))
    ).toEqual({ ok: false, error: "Vui lòng chọn ngày ứng." });

    expect(
      await saveSalaryAdvance(makeFd({ personType: "driver", personId: "d1", date: "2026-11-10", amount: "0" }))
    ).toEqual({ ok: false, error: "Vui lòng nhập số tiền." });

    expect(
      await saveSalaryAdvance(makeFd({ personType: "other", personId: "d1", date: "2026-11-10", amount: "500000" }))
    ).toEqual({ ok: false, error: "Không xác định được nhân sự." });
  });

  it("office dùng requireManagerEditor, driver dùng requireEditor và tạo mới thành công", async () => {
    const r1 = await saveSalaryAdvance(
      makeFd({ personType: "office", personId: "o1", date: "2026-11-10", amount: "1.000.000", note: "Ứng" })
    );
    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(r1).toEqual({ ok: true });
    expect(mockPrisma.salaryAdvance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        personType: "office",
        personId: "o1",
        date: "2026-11-10",
        amount: 1_000_000,
        note: "Ứng",
      }),
    });

    const r2 = await saveSalaryAdvance(
      makeFd({ personType: "driver", personId: "d1", date: "2026-11-12", amount: "500000" })
    );
    expect(mockRequireEditor).toHaveBeenCalledTimes(1);
    expect(r2).toEqual({ ok: true });
  });
});

describe("deleteSalaryAdvance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.salaryAdvance.delete.mockResolvedValue({});
  });

  it("trả lỗi nếu thiếu id hoặc không tìm thấy bản ghi", async () => {
    expect(await deleteSalaryAdvance(makeFd({}))).toEqual({
      ok: false,
      error: "Không tìm thấy khoản tạm ứng.",
    });

    mockPrisma.salaryAdvance.findUnique.mockResolvedValueOnce(null);
    expect(await deleteSalaryAdvance(makeFd({ id: "sa1" }))).toEqual({
      ok: false,
      error: "Không tìm thấy khoản tạm ứng.",
    });
  });

  it("áp đúng guard office/driver và xóa thành công", async () => {
    mockPrisma.salaryAdvance.findUnique.mockResolvedValueOnce({ personType: "office" });
    const r = await deleteSalaryAdvance(makeFd({ id: "sa1" }));
    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(mockPrisma.salaryAdvance.delete).toHaveBeenCalledWith({ where: { id: "sa1" } });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ ok: true });
  });
});
