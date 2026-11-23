import { describe, it, expect } from "vitest";
import { OK, fail, uniqueViolationFields } from "./actionResult";

describe("actionResult", () => {
  it("trả về OK = { ok: true }", () => {
    expect(OK).toEqual({ ok: true });
  });

  it("fail('x') trả về { ok: false, error: 'x' }", () => {
    expect(fail("x")).toEqual({ ok: false, error: "x" });
  });

  describe("uniqueViolationFields", () => {
    it("trả về null với null, undefined, chuỗi, số", () => {
      expect(uniqueViolationFields(null)).toBeNull();
      expect(uniqueViolationFields(undefined)).toBeNull();
      expect(uniqueViolationFields("P2002")).toBeNull();
      expect(uniqueViolationFields(123)).toBeNull();
    });

    it("trả về null với Error thông thường không có code", () => {
      expect(uniqueViolationFields(new Error("Lỗi mạng"))).toBeNull();
    });

    it("trả về null với mã lỗi Prisma khác P2002 (như P2025)", () => {
      expect(uniqueViolationFields({ code: "P2025", message: "Record not found" })).toBeNull();
    });

    it("nhận diện P2002 với meta.target là mảng chuỗi", () => {
      const err = {
        code: "P2002",
        meta: { target: ["plate"] },
      };
      expect(uniqueViolationFields(err)).toEqual(["plate"]);
    });

    it("nhận diện P2002 với meta.target là chuỗi (VD: Vehicle_plate_key)", () => {
      const err = {
        code: "P2002",
        meta: { target: "Vehicle_plate_key" },
      };
      const res = uniqueViolationFields(err);
      expect(Array.isArray(res)).toBe(true);
      expect(res).toEqual(["Vehicle_plate_key"]);
    });

    it("nhận diện P2002 với driverAdapterError fields", () => {
      const err = {
        code: "P2002",
        meta: {
          driverAdapterError: {
            cause: {
              constraint: {
                fields: ["plate"],
              },
            },
          },
        },
      };
      expect(uniqueViolationFields(err)).toEqual(["plate"]);
    });

    it("bóc tách trường từ message dạng 'Unique constraint failed on the fields: (`plate`)'", () => {
      const err = {
        code: "P2002",
        message: "Unique constraint failed on the fields: (`plate`)",
      };
      expect(uniqueViolationFields(err)).toEqual(["plate"]);
    });

    it("bóc tách nhiều trường từ message", () => {
      const err = {
        code: "P2002",
        message: "Unique constraint failed on the fields: (`tenantId`, `plate`)",
      };
      expect(uniqueViolationFields(err)).toEqual(["tenantId", "plate"]);
    });

    it("trả về mảng rỗng khi là P2002 nhưng không có meta hay message khớp", () => {
      const err = {
        code: "P2002",
      };
      expect(uniqueViolationFields(err)).toEqual([]);
    });
  });
});
