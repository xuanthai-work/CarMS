import { describe, expect, it } from "vitest";
import type { Trip } from "../types";
import { buildMonthFinance, revenueMonthKey, tripCostBreakdown, tripMoney } from "./revenue";

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
    cancelFee: null,
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

describe("tripMoney", () => {
  it("giữ nguyên công thức cũ và refund = 0 cho chuyến không hủy", () => {
    const pendingWithDeposit = tripWithDates("2026-08-01", null);
    pendingWithDeposit.price = 2_000_000;
    pendingWithDeposit.deposit = 500_000;
    expect(tripMoney(pendingWithDeposit)).toEqual({
      recognized: 2_000_000,
      collected: 500_000,
      outstanding: 1_500_000,
      refund: 0,
      cost: 0,
      profit: 2_000_000,
    });

    const completedPaid = tripWithDates("2026-08-02", null);
    completedPaid.price = 2_000_000;
    completedPaid.deposit = 500_000;
    completedPaid.status = "completed_paid";
    expect(tripMoney(completedPaid)).toEqual({
      recognized: 2_000_000,
      collected: 2_000_000,
      outstanding: 0,
      refund: 0,
      cost: 0,
      profit: 2_000_000,
    });

    const noPrice = tripWithDates("2026-08-03", null);
    noPrice.price = null;
    noPrice.deposit = 500_000;
    expect(tripMoney(noPrice)).toEqual({
      recognized: 0,
      collected: 0,
      outstanding: 0,
      refund: 0,
      cost: 0,
      profit: 0,
    });

    const overDeposit = tripWithDates("2026-08-04", null);
    overDeposit.price = 1_000_000;
    overDeposit.deposit = 1_500_000;
    expect(tripMoney(overDeposit)).toEqual({
      recognized: 1_000_000,
      collected: 1_000_000,
      outstanding: 0,
      refund: 0,
      cost: 0,
      profit: 1_000_000,
    });
  });

  it("hủy, cọc 0, phí 500.000", () => {
    const t = tripWithDates("2026-08-05", null);
    t.status = "cancelled";
    t.price = 3_000_000;
    t.deposit = 0;
    t.cancelFee = 500_000;
    expect(tripMoney(t)).toEqual({
      recognized: 500_000,
      collected: 0,
      outstanding: 500_000,
      refund: 0,
      cost: 0,
      profit: 500_000,
    });
  });

  it("hủy, cọc 2.000.000, phí 500.000 → hoàn 1.500.000", () => {
    const t = tripWithDates("2026-08-05", null);
    t.status = "cancelled";
    t.price = 3_000_000;
    t.deposit = 2_000_000;
    t.cancelFee = 500_000;
    expect(tripMoney(t)).toEqual({
      recognized: 500_000,
      collected: 500_000,
      outstanding: 0,
      refund: 1_500_000,
      cost: 0,
      profit: 500_000,
    });
  });

  it("hủy, cọc 300.000, phí 500.000 → còn phải thu 200.000", () => {
    const t = tripWithDates("2026-08-05", null);
    t.status = "cancelled";
    t.deposit = 300_000;
    t.cancelFee = 500_000;
    expect(tripMoney(t)).toEqual({
      recognized: 500_000,
      collected: 300_000,
      outstanding: 200_000,
      refund: 0,
      cost: 0,
      profit: 500_000,
    });
  });

  it("hủy, phí null → recognized 0, refund = cọc", () => {
    const t = tripWithDates("2026-08-05", null);
    t.status = "cancelled";
    t.deposit = 700_000;
    t.cancelFee = null;
    expect(tripMoney(t)).toEqual({
      recognized: 0,
      collected: 0,
      outstanding: 0,
      refund: 700_000,
      cost: 0,
      profit: 0,
    });
  });

  it("hủy có partnerCost/tollCost → profit = phí hủy − chi phí (có thể âm)", () => {
    const t = tripWithDates("2026-08-05", null);
    t.status = "cancelled";
    t.cancelFee = 500_000;
    t.partnerCost = 800_000;
    t.tollCost = 100_000;
    expect(tripMoney(t)).toEqual({
      recognized: 500_000,
      collected: 0,
      outstanding: 500_000,
      refund: 0,
      cost: 900_000,
      profit: -400_000,
    });
  });

  it("buildMonthFinance: một chuyến hủy + một chuyến thường", () => {
    const cancelled = tripWithDates("2026-08-05", null);
    cancelled.status = "cancelled";
    cancelled.price = 4_000_000;
    cancelled.deposit = 1_000_000;
    cancelled.cancelFee = 500_000;

    const normal = tripWithDates("2026-08-10", null);
    normal.status = "completed_paid";
    normal.price = 2_000_000;

    const finance = buildMonthFinance([cancelled, normal], "2026-08", 0, 0);
    expect(finance.summary.recognized).toBe(2_500_000);
    expect(finance.paidTotal).toBe(2_000_000);
  });
});
