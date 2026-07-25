/** Sinh id có tiền tố (v/d/t) cho bản ghi mới. */
export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, "0")}`;
}
