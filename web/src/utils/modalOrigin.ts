export type Point = { x: number; y: number };
export const FRESH_CLICK_MS = 1500;

/** Điểm bấm gần nhất còn "mới" (trong FRESH_CLICK_MS) hay null nếu quá cũ/không có. */
export function freshOrigin(
  last: { x: number; y: number; t: number } | null,
  now: number
): Point | null {
  if (last == null) return null;
  if (now - last.t > FRESH_CLICK_MS) return null;
  return { x: last.x, y: last.y };
}

/**
 * Độ lệch (px) từ tâm khung nhìn tới điểm bấm; modal căn giữa nên đây là vector zoom.
 * Giới hạn mỗi trục trong [-maxX, +maxX] / [-maxY, +maxY] với max = nửa cạnh khung nhìn,
 * để điểm bấm sát mép không đẩy modal ra ngoài.
 */
export function originOffset(
  origin: Point | null,
  viewport: { w: number; h: number }
): Point {
  if (origin == null) return { x: 0, y: 0 };
  const maxX = viewport.w / 2;
  const maxY = viewport.h / 2;
  const rawX = origin.x - maxX;
  const rawY = origin.y - maxY;
  const clampedX = Math.max(-maxX, Math.min(maxX, rawX));
  const clampedY = Math.max(-maxY, Math.min(maxY, rawY));
  return { x: clampedX, y: clampedY };
}
