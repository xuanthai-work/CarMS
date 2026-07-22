import type { Trip } from "./types";
import { monthKeyOf } from "./format";

/** Tiền của một chuyến, suy từ price/deposit/status (không đổi schema). */
export type TripMoney = {
  recognized: number; // doanh thu ghi nhận = price ?? 0
  collected: number; // đã thu
  outstanding: number; // còn phải thu (>= 0)
  cost: number; // tổng chi phí = xăng + VETC + thuê đối tác + khác
  profit: number; // lợi nhuận = recognized − cost
};

/**
 * Quy tắc tiền:
 * - completed_paid  -> đã thu đủ price
 * - còn lại         -> mới thu phần cọc (kẹp trong khoảng price)
 */
export function tripMoney(trip: Trip): TripMoney {
  const recognized = trip.price ?? 0;
  const collected =
    trip.status === "completed_paid" ? recognized : Math.min(trip.deposit ?? 0, recognized);
  const cost =
    (trip.fuelCost ?? 0) + (trip.tollCost ?? 0) + (trip.partnerCost ?? 0) + (trip.otherCost ?? 0);
  return {
    recognized,
    collected,
    outstanding: Math.max(recognized - collected, 0),
    cost,
    profit: recognized - cost,
  };
}

/** Tháng gán doanh thu = tháng của ngày đi. "2026-07-15" -> "2026-07". */
export function revenueMonthKey(trip: Trip): string {
  return monthKeyOf(trip.outbound.date);
}

/** Class chữ cho số lợi nhuận: lãi ≥ 0 → xanh, lỗ < 0 → đỏ. */
export function profitTextClass(profit: number): string {
  return profit >= 0 ? "text-emerald-700" : "text-rose-600";
}

export type RevenueSummary = {
  recognized: number;
  collected: number;
  outstanding: number;
  cost: number;
  profit: number;
  count: number;
};

/** Cộng dồn tiền của nhiều chuyến. */
export function summarize(items: TripMoney[]): RevenueSummary {
  return items.reduce<RevenueSummary>(
    (a, m) => ({
      recognized: a.recognized + m.recognized,
      collected: a.collected + m.collected,
      outstanding: a.outstanding + m.outstanding,
      cost: a.cost + m.cost,
      profit: a.profit + m.profit,
      count: a.count + 1,
    }),
    { recognized: 0, collected: 0, outstanding: 0, cost: 0, profit: 0, count: 0 }
  );
}
