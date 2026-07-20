import type { Trip } from "./types";

/** Loại tour + số ngày (calendar day) tour trải qua. */
export const TOUR_TYPES = [
  { value: "1d", label: "Trong ngày", span: 1 },
  { value: "2n1d", label: "2N1Đ", span: 2 },
  { value: "3n2d", label: "3N2Đ", span: 3 },
  { value: "4n3d", label: "4N3Đ", span: 4 },
  { value: "oneway", label: "Một chiều", span: 1 },
] as const;

export function tourTypeLabel(t: string): string {
  return TOUR_TYPES.find((x) => x.value === t)?.label ?? t;
}

/** Số ngày tour trải qua (mặc định 1 nếu không rõ). */
function tourSpanDays(t: string): number {
  return TOUR_TYPES.find((x) => x.value === t)?.span ?? 1;
}

/** Gợi ý ngày lượt về từ ngày đi + loại tour. "2026-07-03" + 3N2Đ -> "2026-07-05". */
export function defaultReturnDate(outboundDate: string, tourType: string): string {
  const span = tourSpanDays(tourType);
  const [y, m, d] = outboundDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d + (span - 1));
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

/** Cùng 1 xe chạy cả lượt đi lẫn về? (⇒ "trọn gói") */
export function sameVehicleBothLegs(trip: Trip): boolean {
  return !!trip.return && trip.outbound.vehicleId === trip.return.vehicleId;
}

/** Nhãn + màu cho 1 lượt trên card: cùng xe cả đi/về => "Trọn gói", ngược lại "Lượt đi"/"Lượt về". */
export function legMeta(trip: Trip, kind: "out" | "ret"): { label: string; tone: "round" | "go" | "back" } {
  if (sameVehicleBothLegs(trip)) return { label: "Theo đoàn", tone: "round" };
  return kind === "out" ? { label: "Lượt đi", tone: "go" } : { label: "Lượt về", tone: "back" };
}

/** Tiền: 1500000 -> "1.500.000 ₫"; null -> "—". */
export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("vi-VN")} ₫`;
}

/** Nền thẻ chuyến theo trạng thái (dùng chung cho các view lịch). */
export function statusBg(status?: string): string {
  if (status === "completed_paid") return "bg-green-600 text-white hover:bg-green-700";
  if (status === "info_sent") return "bg-green-200 text-green-900 hover:bg-green-300";
  return "bg-white text-slate-700 hover:bg-slate-50";
}

/**
 * Xếp các mục vào lane (hàng) sao cho không đè nhau theo khoảng [startOf, endOf).
 * Gán `lane` cho từng mục (dùng nửa-mở: item kế tiếp bắt đầu đúng chỗ item trước kết thúc thì chung lane).
 * Trả về số lane đã dùng.
 */
export function assignLanes<T extends { lane: number }>(
  items: T[],
  startOf: (t: T) => number,
  endOf: (t: T) => number
): number {
  items.sort((a, b) => startOf(a) - startOf(b) || endOf(a) - endOf(b));
  const laneEnd: number[] = [];
  for (const it of items) {
    let lane = laneEnd.findIndex((end) => end <= startOf(it));
    if (lane === -1) {
      lane = laneEnd.length;
      laneEnd.push(endOf(it));
    } else laneEnd[lane] = endOf(it);
    it.lane = lane;
  }
  return laneEnd.length;
}
