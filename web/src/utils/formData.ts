/**
 * Đọc trường từ FormData của server action.
 * Chuỗi luôn được trim; rỗng ⇒ null. Số bỏ hết ký tự không phải chữ số
 * (ô tiền hiển thị dạng "1.200.000" nên phải gỡ dấu phân cách trước khi Number()).
 */

export function s(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(fd: FormData, key: string): string | null {
  const v = s(fd, key);
  return v === "" ? null : v;
}

export function optNum(fd: FormData, key: string): number | null {
  const v = s(fd, key).replace(/[^\d]/g, "");
  return v === "" ? null : Number(v);
}

export function reqNum(fd: FormData, key: string): number {
  const v = optNum(fd, key);
  if (v == null) throw new Error(`Thiếu số cho trường ${key}`);
  return v;
}

/** Ngày trong tháng (1–31); trống hoặc ngoài khoảng → null. */
export function dayOfMonth(fd: FormData, key: string): number | null {
  const v = optNum(fd, key);
  return v != null && v >= 1 && v <= 31 ? v : null;
}
