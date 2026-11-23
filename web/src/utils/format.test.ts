import { describe, expect, it } from "vitest";
import { monthRange } from "./format";

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
