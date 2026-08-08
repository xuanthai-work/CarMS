import type { Trip } from "../types";
import { monthKeyOf } from "./format";

/** Tiền của một chuyến, suy từ price/deposit/status (không đổi schema). */
export type TripMoney = {
  recognized: number; // doanh thu ghi nhận = price ?? 0
  collected: number; // đã thu
  outstanding: number; // còn phải thu (>= 0)
  cost: number; // tổng chi phí còn gắn trên chuyến = VETC + thuê đối tác + khác
  profit: number; // lợi nhuận = recognized − cost
};

export function tripOtherCost(trip: Trip): number {
  return (trip.tollCost ?? 0) + (trip.partnerCost ?? 0) + (trip.otherCost ?? 0);
}

/** Tách chi phí thuê xe đối tác khỏi các chi phí còn lại gắn trên chuyến. */
export function tripCostBreakdown(trips: Trip[]): { other: number; partner: number } {
  return trips.reduce(
    (total, trip) => ({
      other: total.other + (trip.tollCost ?? 0) + (trip.otherCost ?? 0),
      partner: total.partner + (trip.partnerCost ?? 0),
    }),
    { other: 0, partner: 0 }
  );
}

/**
 * Quy tắc tiền:
 * - completed_paid  -> đã thu đủ price
 * - còn lại         -> mới thu phần cọc (kẹp trong khoảng price)
 */
export function tripMoney(trip: Trip): TripMoney {
  const recognized = trip.price ?? 0;
  const collected =
    trip.status === "completed_paid" ? recognized : Math.min(trip.deposit ?? 0, recognized);
  const cost = tripOtherCost(trip);
  return {
    recognized,
    collected,
    outstanding: Math.max(recognized - collected, 0),
    cost,
    profit: recognized - cost,
  };
}

/**
 * Tháng ghi nhận doanh thu = tháng chuyến hoàn tất:
 * - Có lượt về: dùng ngày lượt về.
 * - Một chiều: dùng ngày lượt đi.
 */
export function revenueMonthKey(trip: Trip): string {
  return monthKeyOf(trip.return?.date ?? trip.outbound.date);
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

export function monthProfit(summary: RevenueSummary, fuelTotal: number, salaryCost = 0): number {
  return summary.recognized - summary.cost - fuelTotal - salaryCost;
}

/**
 * Tổng hợp tài chính một tháng bằng một đường tính duy nhất để tránh cộng trùng
 * giữa doanh thu chuyến, chi phí chuyến, dầu và lương.
 */
export function buildMonthFinance(
  trips: Trip[],
  monthKey: string,
  fuelTotal: number,
  salaryCost: number
) {
  const rows = trips
    .filter((trip) => revenueMonthKey(trip) === monthKey)
    .map((trip) => ({ trip, money: tripMoney(trip) }));
  const summary = summarize(rows.map((row) => row.money));
  const tripCosts = tripCostBreakdown(rows.map((row) => row.trip));
  const paidTotal = rows
    .filter((row) => row.trip.status === "completed_paid")
    .reduce((total, row) => total + row.money.recognized, 0);

  return {
    rows,
    summary,
    tripCosts,
    paidTotal,
    totalCost: summary.cost + fuelTotal + salaryCost,
    profit: monthProfit(summary, fuelTotal, salaryCost),
  };
}
