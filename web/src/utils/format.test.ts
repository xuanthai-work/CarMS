import { describe, expect, it } from "vitest";
import { monthRange, monthsBetween } from "./format";

describe("monthRange", () => {
  it("trả về khoảng gte và lt cho tháng bình thường", () => {
    expect(monthRange("2026-09")).toEqual({
      gte: "2026-09-01",
      lt: "2026-10-01",
    });
  });

  it("chuyển giao qua năm cho tháng 12", () => {
    expect(monthRange("2026-12")).toEqual({
      gte: "2026-12-01",
      lt: "2027-01-01",
    });
  });

  it("trả về đúng khoảng cho tháng 1", () => {
    expect(monthRange("2026-01")).toEqual({
      gte: "2026-01-01",
      lt: "2026-02-01",
    });
  });
});

describe("monthsBetween", () => {
  it("cùng tháng → 1 phần tử", () => {
    expect(monthsBetween("2026-07", "2026-07")).toEqual(["2026-07"]);
  });

  it("các tháng liên tiếp trong năm đúng thứ tự", () => {
    expect(monthsBetween("2026-07", "2026-10")).toEqual([
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
    ]);
  });

  it("chuyển giao qua năm", () => {
    expect(monthsBetween("2026-11", "2027-02")).toEqual([
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
    ]);
  });

  it("from > to → mảng rỗng", () => {
    expect(monthsBetween("2026-10", "2026-07")).toEqual([]);
  });

  it("khoảng > 240 tháng bị cắt ở 240 phần tử", () => {
    const list = monthsBetween("2000-01", "2050-01");
    expect(list).toHaveLength(240);
    expect(list[0]).toBe("2000-01");
  });
});
