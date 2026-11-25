import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireManagerEditor, mockRevalidateAll, mockPrisma } = vi.hoisted(() => {
  const officeStaff = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  };
  const salaryRate = {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  return {
    mockRequireManagerEditor: vi.fn(),
    mockRevalidateAll: vi.fn(),
    mockPrisma: {
      officeStaff,
      salaryRate,
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) => fn({ officeStaff, salaryRate })),
    },
  };
});

vi.mock("@/services/auth", () => ({ requireManagerEditor: mockRequireManagerEditor }));
vi.mock("./revalidate", () => ({ revalidateAll: mockRevalidateAll }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { saveOfficeStaff } from "./staff";

function makeFd(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("saveOfficeStaff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.officeStaff.findFirst.mockResolvedValue(null);
    mockPrisma.officeStaff.findUnique.mockResolvedValue({ baseSalary: 10_000_000 });
    mockPrisma.officeStaff.update.mockResolvedValue({});
    mockPrisma.salaryRate.findMany.mockResolvedValue([]);
    mockPrisma.salaryRate.create.mockResolvedValue({});
    mockPrisma.salaryRate.update.mockResolvedValue({});
  });

  it("đổi lương khi sửa → tạo rate gốc 1970-01-01 và rate mới", async () => {
    const r = await saveOfficeStaff(
      makeFd({
        id: "o1",
        name: "An",
        position: "COO",
        baseSalary: "12.000.000",
        salaryEffectiveFrom: "2026-12-01",
      })
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryRate.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        personType: "office",
        personId: "o1",
        effectiveFrom: "1970-01-01",
        amount: 10_000_000,
      }),
    });
    expect(mockPrisma.salaryRate.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        personType: "office",
        personId: "o1",
        effectiveFrom: "2026-12-01",
        amount: 12_000_000,
      }),
    });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
  });

  it("không đổi lương → không tạo rate", async () => {
    const r = await saveOfficeStaff(
      makeFd({ id: "o1", name: "An", position: "COO", baseSalary: "10.000.000" })
    );
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.salaryRate.create).not.toHaveBeenCalled();
  });

  it("đổi lương nhưng thiếu ngày hiệu lực → fail", async () => {
    const r = await saveOfficeStaff(
      makeFd({ id: "o1", name: "An", position: "COO", baseSalary: "12.000.000" })
    );
    expect(r).toEqual({ ok: false, error: "Vui lòng chọn ngày hiệu lực của mức lương mới." });
    expect(mockPrisma.officeStaff.update).not.toHaveBeenCalled();
  });
});
