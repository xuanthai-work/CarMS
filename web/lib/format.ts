// Helper ngày tháng cho lịch (thuần, dùng được cả server & client).

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WEEKDAYS_FULL = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Đệm số 0 về 2 chữ số: 7 -> "07". */
export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** "2026-07-15" -> "T3" */
export function weekdayVn(s: string): string {
  return WEEKDAYS[parseDate(s).getDay()];
}

/** "2026-07-20" -> "Thứ Hai" */
function weekdayFull(s: string): string {
  return WEEKDAYS_FULL[parseDate(s).getDay()];
}

export type DayMeta = { d: string; num: number; wd: string; weekend: boolean; isToday: boolean };

/** Thông tin mỗi ngày dùng chung cho lịch: số ngày, thứ, cuối tuần, hôm nay. */
export function buildDayMeta(days: string[], today: string): DayMeta[] {
  return days.map((d) => {
    const wd = weekdayVn(d);
    return { d, num: Number(d.slice(8, 10)), wd, weekend: wd === "T7" || wd === "CN", isToday: d === today };
  });
}

/** "2026-07-20" -> "Thứ Hai, 20/07/2026"; rỗng -> "" */
export function fmtDateFull(s: string | null | undefined): string {
  if (!s) return "";
  return `${weekdayFull(s)}, ${fmtDate(s)}`;
}

/** "2026-07-15" -> "15/07/2026"; rỗng -> "—" */
export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Ngày hôm nay dạng YYYY-MM-DD theo GIỜ VIỆT NAM (Asia/Ho_Chi_Minh),
 * không phụ thuộc timezone server. Trên Vercel server chạy UTC — nếu đọc "giờ máy"
 * thì sau 17:00 UTC (tức đã qua nửa đêm ở VN) sẽ lệch 1 ngày. Client vốn ở giờ VN nên vẫn khớp.
 */
export function todayStr(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** "2026-07-15" -> "2026-07" */
export function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** "2026-07" -> "Tháng 7/2026" */
export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

/** Danh sách các ngày (YYYY-MM-DD) trong tháng. */
export function daysInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split("-").map(Number);
  const n = new Date(y, m, 0).getDate();
  return Array.from({ length: n }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
}

/** "2026-07" + delta tháng -> "2026-08". */
export function addMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
