import { describe, expect, it } from "vitest";
import type { Trip } from "../types";
import { buildMonthFinance, revenueMonthKey, tripCostBreakdown } from "./revenue";

function tripWithDates(outboundDate: string, returnDate: string | null): Trip {
  const leg = (date: string) => ({
    date,
    time: null,
    endTime: null,
    from: "A",
    to: "B",
    vehicleId: null,
    driverId: null,
    seatClass: null,
  });

  return {
    id: "trip-test",
    customerName: "Khách test",
    customerPhone: null,
    tourType: returnDate ? "2n1d" : "oneway",
    price: 1000000,
    deposit: null,
    status: "pending",
    heldThroughTour: false,
    note: "",
    tollCost: null,
    partnerCost: null,
    otherCost: null,
    outbound: leg(outboundDate),
    return: returnDate ? leg(returnDate) : null,
  };
}

describe("revenueMonthKey", () => {
  it("ghi nhận chuyến nhiều lượt vào tháng của ngày lượt về", () => {
    const trip = tripWithDates("2026-07-31", "2026-08-01");

    expect(revenueMonthKey(trip)).toBe("2026-08");
  });

  it("ghi nhận chuyến một chiều vào tháng của ngày lượt đi", () => {
    const trip = tripWithDates("2026-07-31", null);

    expect(revenueMonthKey(trip)).toBe("2026-07");
  });

  it("giữ đúng tháng lượt về khi chuyến hoàn tất trong cùng tháng", () => {
    const trip = tripWithDates("2026-07-10", "2026-07-12");

    expect(revenueMonthKey(trip)).toBe("2026-07");
  });
});

describe("tripCostBreakdown", () => {
  it("tách tiền thuê xe đối tác khỏi các chi phí chuyến khác", () => {
    const trip = tripWithDates("2026-08-01", null);
    trip.tollCost = 200_000;
    trip.partnerCost = 3_000_000;
    trip.otherCost = 400_000;

    expect(tripCostBreakdown([trip])).toEqual({
      other: 600_000,
      partner: 3_000_000,
    });
  });
});

describe("buildMonthFinance với chi phí khác trong tháng", () => {
  it("cộng chi phí khác ngoài chuyến vào tổng chi phí và lợi nhuận", () => {
    const trip = tripWithDates("2026-08-05", null);
    trip.price = 10_000_000;
    trip.partnerCost = 2_000_000;
    trip.tollCost = 500_000;

    const finance = buildMonthFinance([trip], "2026-08", 1_000_000, 3_000_000, 750_000);

    // 500.000 gắn trên chuyến + 750.000 nhập từ trang Chi phí khác
    expect(finance.otherCostTotal).toBe(1_250_000);
    expect(finance.totalCost).toBe(2_000_000 + 1_250_000 + 1_000_000 + 3_000_000);
    expect(finance.profit).toBe(10_000_000 - finance.totalCost);
  });

  it("mặc định không cộng chi phí khác khi không truyền tham số", () => {
    const trip = tripWithDates("2026-08-05", null);
    trip.price = 5_000_000;

    const finance = buildMonthFinance([trip], "2026-08", 0, 0);

    expect(finance.otherCostTotal).toBe(0);
    expect(finance.profit).toBe(5_000_000);
  });
});
