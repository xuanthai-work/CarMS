import { describe, expect, it } from "vitest";
import { hasPartnerVehicle, legRoute, tripFinishDate } from "./trips";

const vehicles = [
  { id: "own-vehicle", type: "own" },
  { id: "partner-vehicle", type: "partner" },
];

describe("hasPartnerVehicle", () => {
  it("không hiện chi phí thuê đối tác khi chỉ dùng xe công ty", () => {
    expect(hasPartnerVehicle(["own-vehicle"], vehicles)).toBe(false);
  });

  it("hiện chi phí thuê đối tác khi một lượt dùng xe ngoài", () => {
    expect(hasPartnerVehicle(["own-vehicle", "partner-vehicle"], vehicles)).toBe(true);
  });

  it("không coi xe chưa xếp hoặc mẫu số chỗ là xe ngoài", () => {
    expect(hasPartnerVehicle([null, "seat:16"], vehicles)).toBe(false);
  });
});

describe("tripFinishDate", () => {
  it("chuyến một chiều (returnDate null/undefined/rỗng) trả về ngày đi", () => {
    expect(tripFinishDate("2026-09-30", null)).toBe("2026-09-30");
    expect(tripFinishDate("2026-09-30", undefined)).toBe("2026-09-30");
    expect(tripFinishDate("2026-09-30", "")).toBe("2026-09-30");
  });

  it("chuyến khứ hồi trả về ngày về", () => {
    expect(tripFinishDate("2026-09-15", "2026-09-16")).toBe("2026-09-16");
  });

  it("chuyến khứ hồi qua tháng (đi 2026-09-30, về 2026-10-02) trả về ngày về 2026-10-02", () => {
    expect(tripFinishDate("2026-09-30", "2026-10-02")).toBe("2026-10-02");
  });
});

describe("legRoute", () => {
  it("có from/to → trả về lộ trình như cũ", () => {
    expect(legRoute({ from: "Hà Nội", to: "Hải Phòng" }, "Ghi chú")).toBe("Hà Nội → Hải Phòng");
    expect(legRoute({ from: "Hà Nội", to: "" })).toBe("Hà Nội");
    expect(legRoute({ from: "", to: "Hạ Long" })).toBe("Hạ Long");
  });

  it("from/to rỗng + note nhiều dòng → trả về dòng đầu tiên không rỗng", () => {
    expect(
      legRoute({ from: "", to: "" }, "Hà Nội → Hải Phòng\nKhách VIP\nĐón ở sảnh")
    ).toBe("Hà Nội → Hải Phòng");
  });

  it("cả hai rỗng → trả về '—'", () => {
    expect(legRoute({ from: "", to: "" })).toBe("—");
    expect(legRoute({ from: "", to: "" }, "")).toBe("—");
    expect(legRoute({ from: "", to: "" }, null)).toBe("—");
  });

  it("note chỉ khoảng trắng/dòng trống đầu → bỏ qua dòng trống và lấy dòng đầu có chữ", () => {
    expect(
      legRoute({ from: "", to: "" }, "   \n\n  Hà Nội → Sapa  \nKhách có đồ nhiều")
    ).toBe("Hà Nội → Sapa");
    expect(legRoute({ from: "", to: "" }, "   \n\n   ")).toBe("—");
  });
});
