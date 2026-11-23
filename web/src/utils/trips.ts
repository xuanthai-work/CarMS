import type { Trip, TourType, Vehicle } from "@/types";

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

/**
 * Suy loại tour từ ngày đi/về (thay cho việc chọn tay).
 * Không có lượt về ⇒ "một chiều"; có về ⇒ theo số đêm giữa hai ngày.
 */
export function tourTypeFromDates(outboundDate: string, returnDate: string | null): TourType {
  if (!returnDate) return "oneway";
  if (!outboundDate) return "1d";
  const [y1, m1, d1] = outboundDate.split("-").map(Number);
  const [y2, m2, d2] = returnDate.split("-").map(Number);
  const nights = Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86_400_000
  );
  if (nights <= 0) return "1d";
  if (nights === 1) return "2n1d";
  if (nights === 2) return "3n2d";
  return "4n3d"; // 3+ đêm: gộp về mức cao nhất trong enum
}

/** Ngày hoàn tất của chuyến: có lượt về thì ngày về, ngược lại ngày đi (cùng quy tắc revenueMonthKey). */
export function tripFinishDate(outboundDate: string, returnDate: string | null | undefined): string {
  return returnDate || outboundDate;
}

/** Chỉ xe thuê ngoài mới phát sinh ô nhập tiền thuê đối tác; loại tài xế không ảnh hưởng. */
export function hasPartnerVehicle(
  vehicleIds: Array<string | null | undefined>,
  vehicles: Array<Pick<Vehicle, "id" | "type">>
): boolean {
  return vehicleIds.some(
    (vehicleId) => !!vehicleId && vehicles.find((vehicle) => vehicle.id === vehicleId)?.type === "partner"
  );
}

/** Cùng 1 xe chạy cả lượt đi lẫn về? (⇒ "trọn gói") */
export function sameVehicleBothLegs(trip: Trip): boolean {
  return !!trip.return && trip.outbound.vehicleId === trip.return.vehicleId;
}

/** Lộ trình "điểm đón → điểm đến" (bỏ phần rỗng); không có -> "—". */
export function legRoute(leg: { from: string; to: string }): string {
  return [leg.from, leg.to].map((x) => x?.trim()).filter(Boolean).join(" → ") || "—";
}

/** Tiền: 1500000 -> "1.500.000"; null -> "—". Không kèm đơn vị (mặc định là VND, ai cũng hiểu). */
export function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN");
}

/** Như fmtMoney nhưng kèm đơn vị ₫ — chỉ dùng cho thẻ số tổng quan (headline), không dùng trong bảng/thẻ chuyến. */
export function fmtMoneyUnit(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n.toLocaleString("vi-VN")} ₫`;
}

/**
 * Trạng thái chuyến — NGUỒN DUY NHẤT cho nhãn, màu nền thẻ (statusBg) và chấm màu ở
 * chú giải (legend). 👉 Muốn đổi màu/nhãn một trạng thái thì sửa ngay tại đây, cả lịch
 * lẫn màn doanh thu sẽ theo.
 *  - bg     : class nền thẻ trên lịch (qua statusBg) — cyan = đã nhắn khách, xanh lá = đã thanh toán
 *  - swatch : chấm màu hiển thị ở legend (khớp với bg)
 *  - text   : màu CHỮ khi đặt trên nền trắng (VD cột Trạng thái) — pending để đen (nền trắng)
 *  - chip   : nền + viền cho dropdown trạng thái (tô màu theo legend, chữ để đen)
 */
export const TRIP_STATUSES = [
  { value: "pending", label: "Mới/Chưa xử lý", swatch: "border border-slate-300 bg-white", bg: "bg-white text-slate-700 hover:bg-slate-50", text: "text-slate-700", chip: "border-slate-300 bg-white" },
  { value: "info_sent", label: "Đã nhắn khách", swatch: "bg-cyan-100", bg: "bg-cyan-100 text-green-900 hover:bg-cyan-200", text: "text-cyan-700", chip: "border-cyan-200 bg-cyan-100" },
  { value: "completed_paid", label: "Đã thanh toán", swatch: "bg-green-200", bg: "bg-green-200 text-green-900 hover:bg-green-300", text: "text-green-700", chip: "border-green-300 bg-green-200" },
] as const;

export function tripStatusLabel(status?: string): string {
  return (TRIP_STATUSES.find((s) => s.value === status) ?? TRIP_STATUSES[0]).label;
}

/** Nền thẻ chuyến theo trạng thái (dùng chung cho các view lịch). */
export function statusBg(status?: string): string {
  return (TRIP_STATUSES.find((s) => s.value === status) ?? TRIP_STATUSES[0]).bg;
}

/** Màu chữ trạng thái khi đặt trên nền trắng (cột Trạng thái ở màn doanh thu). */
export function statusTextClass(status?: string): string {
  return (TRIP_STATUSES.find((s) => s.value === status) ?? TRIP_STATUSES[0]).text;
}

/** Nền + viền "chip" cho dropdown trạng thái (tô màu theo legend, chữ để đen). */
export function statusChipClass(status?: string): string {
  return (TRIP_STATUSES.find((s) => s.value === status) ?? TRIP_STATUSES[0]).chip;
}

/**
 * Xếp gọn thẻ chiều-cao-thay-đổi có LẤP KHE: mỗi mục rơi xuống Y thấp nhất còn trống
 * trên dải ngày [s, e] của nó (chỉ né mục thực sự trùng ngày). Gán `top`, trả tổng chiều cao.
 */
export function packVariableHeight<T extends { s: number; e: number; top: number; height: number }>(
  items: T[],
  gap: number,
  padTop: number
): number {
  items.sort((a, b) => a.s - b.s || a.e - b.e);
  const placed: { s: number; e: number; top: number; bottom: number }[] = [];
  let bottom = padTop;
  for (const it of items) {
    const overlaps = placed.filter((p) => p.e >= it.s && p.s <= it.e);
    const cands = [padTop, ...overlaps.map((p) => p.bottom + gap)].sort((a, b) => a - b);
    let y = padTop;
    for (const c of cands) {
      if (overlaps.every((p) => c + it.height + gap <= p.top || c >= p.bottom + gap)) {
        y = c;
        break;
      }
    }
    it.top = y;
    placed.push({ s: it.s, e: it.e, top: y, bottom: y + it.height });
    bottom = Math.max(bottom, y + it.height);
  }
  return bottom + padTop;
}
