// Chuẩn hoá chuỗi để tìm "tự do": bỏ dấu tiếng Việt + không phân biệt hoa/thường.
// Dùng cho tìm tên lái xe (gõ "hieu" khớp "Nguyễn Xuân Hiếu"); cũng dùng cho biển số
// (chỉ có tác dụng hạ hoa/thường vì biển số không có dấu).
export function normalizeVn(s: string | null | undefined): string {
  return (s || "")
    .normalize("NFD") // tách dấu thành ký tự tổ hợp
    .replace(/[̀-ͯ]/g, "") // bỏ dấu tổ hợp
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim();
}
