import { describe, expect, it } from "vitest";
import { hasPartnerVehicle } from "./trips";

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
