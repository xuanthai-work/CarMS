import { describe, it, expect } from "vitest";
import { canEdit, isManager, hasLeft } from "./office";

describe("canEdit", () => {
  it("CEO chỉ được xem", () => {
    expect(canEdit("CEO")).toBe(false);
  });

  it("COO và nhân viên vẫn ghi được", () => {
    expect(canEdit("COO")).toBe(true);
    expect(canEdit("Nhân viên")).toBe(true);
  });

  it("chưa gán chức vụ thì không ghi được", () => {
    expect(canEdit(null)).toBe(false);
  });

  it("chức vụ cũ ngoài enum vẫn ghi được (danh sách chặn, không phải cho phép)", () => {
    expect(canEdit("Điều hành")).toBe(true);
  });
});

describe("canEdit độc lập với isManager", () => {
  it("CEO xem được hết nhưng không ghi", () => {
    expect(isManager("CEO")).toBe(true);
    expect(canEdit("CEO")).toBe(false);
  });

  it("nhân viên ghi được nhưng không xem được trang quản lý", () => {
    expect(isManager("Nhân viên")).toBe(false);
    expect(canEdit("Nhân viên")).toBe(true);
  });
});

describe("hasLeft", () => {
  it("endDate null/undefined/rỗng → false", () => {
    expect(hasLeft(null, "2026-09-15")).toBe(false);
    expect(hasLeft(undefined, "2026-09-15")).toBe(false);
    expect(hasLeft("", "2026-09-15")).toBe(false);
  });

  it("endDate = ngày xét → false (vẫn là ngày làm việc cuối cùng)", () => {
    expect(hasLeft("2026-09-15", "2026-09-15")).toBe(false);
  });

  it("endDate trước ngày xét (hôm qua) → true", () => {
    expect(hasLeft("2026-09-14", "2026-09-15")).toBe(true);
  });

  it("endDate sau ngày xét (tương lai) → false", () => {
    expect(hasLeft("2026-09-16", "2026-09-15")).toBe(false);
  });
});
