import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockRequireEditor, mockRequireManagerEditor, mockRevalidateAll, mockPrisma } = vi.hoisted(() => ({
  mockRequireEditor: vi.fn(),
  mockRequireManagerEditor: vi.fn(),
  mockRevalidateAll: vi.fn(),
  mockPrisma: {
    officeStaff: { findUnique: vi.fn() },
    driver: { findUnique: vi.fn() },
    salaryMonth: { upsert: vi.fn() },
  },
}));

vi.mock("@/services/auth", () => ({
  requireEditor: mockRequireEditor,
  requireManagerEditor: mockRequireManagerEditor,
}));
vi.mock("./revalidate", () => ({ revalidateAll: mockRevalidateAll }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { saveSalaryMonth } from "./salary";

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
});
