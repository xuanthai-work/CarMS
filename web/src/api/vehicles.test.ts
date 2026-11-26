import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireEditor, mockRevalidateAll, mockPrisma } = vi.hoisted(() => {
  const vehicle = {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  };
  return {
    mockRequireEditor: vi.fn(),
    mockRevalidateAll: vi.fn(),
    mockPrisma: { vehicle },
  };
});

vi.mock("@/services/auth", () => ({ requireEditor: mockRequireEditor }));
vi.mock("./revalidate", () => ({ revalidateAll: mockRevalidateAll }));
vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { deleteVehicle, quickCreateVehicle, saveVehicle } from "./vehicles";

function makeFd(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("vehicles soft-delete & restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.vehicle.update.mockResolvedValue({});
    mockPrisma.vehicle.create.mockResolvedValue({});
  });

  it("deleteVehicle chỉ update deletedAt, không gọi delete", async () => {
    const r = await deleteVehicle(makeFd({ id: "v1" }));
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: "v1" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(mockPrisma.vehicle.delete).not.toHaveBeenCalled();
  });

  it("saveVehicle thêm mới trùng biển số đã xóa → khôi phục xe đó", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: "v-old",
      deletedAt: new Date("2026-11-20"),
    });
    const r = await saveVehicle(makeFd({ plate: "29B-99999", seats: "16", type: "own" }));
    expect(r).toEqual({ ok: true });
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: "v-old" },
      data: expect.objectContaining({ plate: "29B-99999", seats: 16, deletedAt: null }),
    });
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled();
  });

  it("quickCreateVehicle trùng biển số đã xóa → khôi phục giữ nguyên thông tin cũ", async () => {
    mockPrisma.vehicle.findUnique.mockResolvedValue({
      id: "v-old",
      plate: "29B-88888",
      deletedAt: new Date("2026-11-20"),
    });
    const r = await quickCreateVehicle("29B-88888");
    expect(r).toEqual({ id: "v-old", label: "29B-88888" });
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith({
      where: { id: "v-old" },
      data: { deletedAt: null },
    });
    expect(mockPrisma.vehicle.create).not.toHaveBeenCalled();
  });

  it("saveVehicle sửa xe khác thành biển số đã xóa → trả lỗi hướng dẫn khôi phục", async () => {
    mockPrisma.vehicle.findUnique
      .mockResolvedValueOnce({ deletedAt: null })
      .mockResolvedValueOnce({ deletedAt: new Date("2026-11-20") });
    mockPrisma.vehicle.update.mockRejectedValueOnce({
      code: "P2002",
      meta: { target: ["plate"] },
    });
    const r = await saveVehicle(makeFd({ id: "v2", plate: "29B-99999" }));
    expect(r).toEqual({
      ok: false,
      error: "Biển số này thuộc một xe đã xóa. Thêm mới xe với biển số đó để khôi phục.",
    });
  });
});
