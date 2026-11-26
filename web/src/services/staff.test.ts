import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    officeStaff: {
      findFirst: mockFindFirst,
    },
  },
}));

import { getOfficeStaffByEmail } from "./staff";

describe("getOfficeStaffByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lọc deletedAt: null để bỏ qua nhân sự đã xóa mềm", async () => {
    mockFindFirst.mockResolvedValue(null);
    const res = await getOfficeStaffByEmail("an@example.com");
    expect(res).toBeNull();
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: "an@example.com", mode: "insensitive" }, deletedAt: null },
      })
    );
  });
});
