import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireEditor, mockRequireManagerEditor, mockRevalidateAll, mockPrisma } = vi.hoisted(() => ({
  mockRequireEditor: vi.fn(),
  mockRequireManagerEditor: vi.fn(),
  mockRevalidateAll: vi.fn(),
  mockPrisma: {
    trip: { update: vi.fn() },
  },
}));

vi.mock("@/services/auth", () => ({
  requireEditor: mockRequireEditor,
  requireManagerEditor: mockRequireManagerEditor,
}));
vi.mock("./revalidate", () => ({ revalidateAll: mockRevalidateAll }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { setTripStatus } from "./trips";

describe("setTripStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.trip.update.mockResolvedValue({});
  });

  it("cập nhật trạng thái thường và xóa cancelFee về null", async () => {
    await setTripStatus("t1", "completed_paid");

    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(mockPrisma.trip.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { status: "completed_paid", cancelFee: null },
    });
    expect(mockRevalidateAll).toHaveBeenCalledTimes(1);
  });

  it("từ chối đổi sang cancelled và không gọi prisma.trip.update", async () => {
    await expect(setTripStatus("t1", "cancelled")).rejects.toThrow(
      "Hủy chuyến phải nhập phí hủy trong form chuyến."
    );

    expect(mockRequireManagerEditor).toHaveBeenCalledTimes(1);
    expect(mockPrisma.trip.update).not.toHaveBeenCalled();
    expect(mockRevalidateAll).not.toHaveBeenCalled();
  });
});
