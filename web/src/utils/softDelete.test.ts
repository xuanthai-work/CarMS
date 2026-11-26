import { describe, expect, it } from "vitest";
import { activeOnly, deletedLabel, pickableOptions } from "./softDelete";

describe("softDelete helpers", () => {
  const items = [
    { id: "1", name: "A", deletedAt: null },
    { id: "2", name: "B", deletedAt: "2026-11-26T00:00:00.000Z" },
    { id: "3", name: "C", deletedAt: null },
  ];

  it("activeOnly bỏ mục đã xóa mềm", () => {
    expect(activeOnly(items).map((x) => x.id)).toEqual(["1", "3"]);
  });

  it("pickableOptions giữ mục chưa xóa + mục đã xóa đang được chọn", () => {
    expect(pickableOptions(items, null).map((x) => x.id)).toEqual(["1", "3"]);
    expect(pickableOptions(items, "2").map((x) => x.id)).toEqual(["1", "2", "3"]);
    expect(pickableOptions(items, ["1", "2"]).map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("deletedLabel gắn (đã xóa) khi có deletedAt", () => {
    expect(deletedLabel("29B-12345", null)).toBe("29B-12345");
    expect(deletedLabel("29B-12345", "2026-11-26T00:00:00.000Z")).toBe("29B-12345 (đã xóa)");
  });
});
