import { describe, it, expect } from "vitest";
import { canEdit, isManager } from "./office";

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
