import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireEditor, mockRevalidateAll, mockPrisma } = vi.hoisted(() => {
  const driver = {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  };
  const salaryRate = {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const salaryMonth = {
    findFirst: vi.fn(),
  };
  const salaryAdvance = {
    findFirst: vi.fn(),
  };
  return {
    mockRequireEditor: vi.fn(),
    mockRevalidateAll: vi.fn(),
    mockPrisma: {
      driver,
      salaryRate,
      salaryMonth,
      salaryAdvance,
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => fn({ driver, salaryRate })),
    },
  };
});

vi.mock("@/services/auth", () => ({ requireEditor: mockRequireEditor }));
vi.mock("./revalidate", () => ({ revalidateAll: mockRevalidateAll }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/utils/format", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/format")>();
  return { ...actual, todayStr: () => "2026-11-26" };
});

import { deleteDriver, saveDriver } from "./drivers";

function makeFd(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("saveDriver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.driver.findUnique.mockResolvedValue({ baseSalary: 8_000_000 });
    mockPrisma.driver.update.mockResolvedValue({});
    mockPrisma.salaryRate.findMany.mockResolvedValue([]);
    mockPrisma.salaryRate.create.mockResolvedValue({});
    mockPrisma.salaryRate.update.mockResolvedValue({});
  });

  it("đổi lương khi sửa → tạo rate gốc 1970-01-01 và rate mới", async () => {
    const r = await saveDriver(
      makeFd({
        id: "d1",
        name: "Ba",
        type: "own",
        baseSalary: "10.000.000",
        salaryEffectiveFrom: "2026-12-01",
      })
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryRate.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        personType: "driver",
        personId: "d1",
        effectiveFrom: "1970-01-01",
        amount: 8_000_000,
      }),
    });
    expect(mockPrisma.salaryRate.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        personType: "driver",
        personId: "d1",
        effectiveFrom: "2026-12-01",
        amount: 10_000_000,
      }),
    });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
  });

  it("không đổi lương → không tạo rate", async () => {
    const r = await saveDriver(
      makeFd({ id: "d1", name: "Ba", type: "own", baseSalary: "8.000.000" })
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryRate.create).not.toHaveBeenCalled();
  });

  it("đổi lương nhưng thiếu ngày hiệu lực → fail", async () => {
    const r = await saveDriver(
      makeFd({ id: "d1", name: "Ba", type: "own", baseSalary: "10.000.000" })
    );
    expect(r).toEqual({ ok: false, error: "Vui lòng chọn ngày hiệu lực của mức lương mới." });
    expect(mockPrisma.driver.update).not.toHaveBeenCalled();
  });
});

describe("deleteDriver (xóa mềm)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.driver.update.mockResolvedValue({});
    mockPrisma.salaryMonth.findFirst.mockResolvedValue(null);
    mockPrisma.salaryAdvance.findFirst.mockResolvedValue(null);
  });

  it("lái xe đối tác → chỉ update deletedAt, không gọi delete", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue({
      id: "d2",
      type: "partner",
      startDate: null,
      deletedAt: null,
    });
    const r = await deleteDriver(makeFd({ id: "d2" }));
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.driver.update).toHaveBeenCalledWith({
      where: { id: "d2" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mockPrisma.driver.delete).not.toHaveBeenCalled();
  });

  it("lái xe công ty → từ chối khi ngày làm cuối trống / sau hôm nay / trước startDate", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue({
      id: "d1",
      type: "own",
      startDate: "2026-10-10",
      deletedAt: null,
    });
    expect(await deleteDriver(makeFd({ id: "d1", endDate: "" }))).toEqual({
      ok: false,
      error: "Vui lòng chọn ngày làm cuối.",
    });
    expect(await deleteDriver(makeFd({ id: "d1", endDate: "2026-11-27" }))).toEqual({
      ok: false,
      error: "Ngày làm cuối không được sau hôm nay.",
    });
    expect(await deleteDriver(makeFd({ id: "d1", endDate: "2026-10-09" }))).toEqual({
      ok: false,
      error: "Ngày làm cuối không được trước ngày vào làm (10/10/2026).",
    });
    expect(mockPrisma.driver.update).not.toHaveBeenCalled();
  });

  it("từ chối khi có phiếu lương đã trả hoặc tạm ứng ở tháng sau ngày làm cuối", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue({
      id: "d1",
      type: "own",
      startDate: "2026-08-01",
      deletedAt: null,
    });
    mockPrisma.salaryMonth.findFirst.mockResolvedValue({ monthKey: "2026-11" });
    const r = await deleteDriver(makeFd({ id: "d1", endDate: "2026-10-15" }));
    expect(r).toEqual({
      ok: false,
      error: "Đã có phiếu lương đã trả hoặc tạm ứng ở tháng 2026-11. Vui lòng chọn ngày làm cuối từ tháng 2026-11 trở đi.",
    });
    expect(mockPrisma.driver.update).not.toHaveBeenCalled();
  });

  it("ngày làm cuối hợp lệ → update deletedAt và endDate", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue({
      id: "d1",
      type: "own",
      startDate: "2026-08-01",
      deletedAt: null,
    });
    const r = await deleteDriver(makeFd({ id: "d1", endDate: "2026-11-15" }));
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.driver.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { deletedAt: expect.any(Date), endDate: "2026-11-15" },
    });
  });

  it("startDate trong tương lai → bỏ qua kiểm tra trước ngày vào làm và ghi endDate = hôm nay", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue({
      id: "d1",
      type: "own",
      startDate: "2026-12-01",
      deletedAt: null,
    });
    const r = await deleteDriver(makeFd({ id: "d1", endDate: "" }));
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.driver.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { deletedAt: expect.any(Date), endDate: "2026-11-26" },
    });
  });

  it("startDate trong tương lai nhưng có tạm ứng tháng sau → vẫn từ chối", async () => {
    mockPrisma.driver.findUnique.mockResolvedValue({
      id: "d1",
      type: "own",
      startDate: "2026-12-01",
      deletedAt: null,
    });
    mockPrisma.salaryAdvance.findFirst.mockResolvedValue({ date: "2026-12-05" });
    const r = await deleteDriver(makeFd({ id: "d1", endDate: "2026-11-26" }));
    expect(r).toEqual({
      ok: false,
      error: "Đã có phiếu lương đã trả hoặc tạm ứng ở tháng 2026-12. Vui lòng chọn ngày làm cuối từ tháng 2026-12 trở đi.",
    });
    expect(mockPrisma.driver.update).not.toHaveBeenCalled();
  });
});
