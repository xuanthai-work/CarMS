import { describe, expect, it } from "vitest";
import { sumByMonth, sumByPaymentStatus } from "./totals";

describe("sumByPaymentStatus", () => {
  it("danh sách rỗng → toàn 0", () => {
    expect(sumByPaymentStatus([])).toEqual({
      total: 0,
      paid: 0,
      unpaid: 0,
      count: 0,
    });
  });

  it("trộn paid, unpaid và trạng thái khác (tính vào unpaid), total = paid + unpaid", () => {
    const entries = [
      { amount: 100_000, paymentStatus: "paid" },
      { amount: 200_000, paymentStatus: "unpaid" },
      { amount: 50_000, paymentStatus: "pending" },
      { amount: 300_000, paymentStatus: "paid" },
    ];
    const res = sumByPaymentStatus(entries);
    expect(res).toEqual({
      total: 650_000,
      paid: 400_000,
      unpaid: 250_000,
      count: 4,
    });
    expect(res.total).toBe(res.paid + res.unpaid);
  });
});

describe("sumByMonth", () => {
  it("danh sách rỗng → Map rỗng", () => {
    const map = sumByMonth([], (r: { date: string; amount: number }) => r.date, (r) => r.amount);
    expect(map.size).toBe(0);
  });

  it("nhiều dòng cùng tháng cộng dồn, hai tháng khác nhau tách riêng, hỗ trợ qua năm", () => {
    const rows = [
      { d: "2026-07-01", val: 100 },
      { d: "2026-07-15", val: 150 },
      { d: "2026-08-01", val: 300 },
      { d: "2027-01-05", val: 500 },
    ];
    const map = sumByMonth(rows, (r) => r.d, (r) => r.val);
    expect(map.get("2026-07")).toBe(250);
    expect(map.get("2026-08")).toBe(300);
    expect(map.get("2027-01")).toBe(500);
    expect(map.size).toBe(3);
  });
});
