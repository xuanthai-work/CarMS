import { describe, it, expect } from "vitest";
import { freshOrigin, originOffset, FRESH_CLICK_MS } from "./modalOrigin";

describe("modalOrigin", () => {
  describe("freshOrigin", () => {
    it("trả về null khi last là null", () => {
      expect(freshOrigin(null, 1000)).toBeNull();
    });

    it("trả về điểm khi điểm bấm còn mới (cách 500ms)", () => {
      const last = { x: 100, y: 200, t: 1000 };
      expect(freshOrigin(last, 1500)).toEqual({ x: 100, y: 200 });
    });

    it("trả về null khi điểm bấm quá cũ (cách 2000ms > FRESH_CLICK_MS)", () => {
      const last = { x: 100, y: 200, t: 1000 };
      expect(freshOrigin(last, 3000)).toBeNull();
    });

    it("trả về điểm ở đúng ranh giới FRESH_CLICK_MS (1500ms)", () => {
      const last = { x: 50, y: 60, t: 0 };
      expect(freshOrigin(last, FRESH_CLICK_MS)).toEqual({ x: 50, y: 60 });
    });

    it("trả về null khi vượt quá ranh giới FRESH_CLICK_MS dù chỉ 1ms", () => {
      const last = { x: 50, y: 60, t: 0 };
      expect(freshOrigin(last, FRESH_CLICK_MS + 1)).toBeNull();
    });
  });

  describe("originOffset", () => {
    const vp = { w: 1000, h: 800 };

    it("trả về {x: 0, y: 0} khi origin là null", () => {
      expect(originOffset(null, vp)).toEqual({ x: 0, y: 0 });
    });

    it("trả về {x: 0, y: 0} khi điểm bấm ở đúng tâm khung nhìn", () => {
      expect(originOffset({ x: 500, y: 400 }, vp)).toEqual({ x: 0, y: 0 });
    });

    it("trả về {-w/2, -h/2} khi điểm bấm ở góc trên-trái {x: 0, y: 0}", () => {
      expect(originOffset({ x: 0, y: 0 }, vp)).toEqual({ x: -500, y: -400 });
    });

    it("trả về {w/2, h/2} khi điểm bấm ở góc dưới-phải {x: w, y: h}", () => {
      expect(originOffset({ x: 1000, y: 800 }, vp)).toEqual({ x: 500, y: 400 });
    });

    it("kẹp toạ độ về -w/2 khi x âm lớn ngoài khung nhìn", () => {
      expect(originOffset({ x: -999, y: 400 }, vp)).toEqual({ x: -500, y: 0 });
    });

    it("kẹp toạ độ về +w/2 và +h/2 khi toạ độ vượt quá khung nhìn", () => {
      expect(originOffset({ x: 2500, y: 3000 }, vp)).toEqual({ x: 500, y: 400 });
    });
  });
});
