import { monthKeyOf } from "./format";

export type PaymentTotals = {
  total: number;
  paid: number;
  unpaid: number;
  count: number;
};

/** Gộp tổng/đã trả/chưa trả/số dòng. Dòng nào paymentStatus === "paid" tính vào paid, còn lại vào unpaid. */
export function sumByPaymentStatus(
  entries: { amount: number; paymentStatus: string }[]
): PaymentTotals {
  return entries.reduce<PaymentTotals>(
    (acc, entry) => {
      acc.total += entry.amount;
      acc.count += 1;
      if (entry.paymentStatus === "paid") {
        acc.paid += entry.amount;
      } else {
        acc.unpaid += entry.amount;
      }
      return acc;
    },
    { total: 0, paid: 0, unpaid: 0, count: 0 }
  );
}

/** Tổng tiền theo tháng (YYYY-MM) từ danh sách dòng có ngày YYYY-MM-DD. */
export function sumByMonth<T>(
  rows: T[],
  dateOf: (r: T) => string,
  amountOf: (r: T) => number
): Map<string, number> {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = monthKeyOf(dateOf(r));
    map.set(k, (map.get(k) ?? 0) + amountOf(r));
  }
  return map;
}
