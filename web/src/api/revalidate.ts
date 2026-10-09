import { revalidatePath } from "next/cache";

/**
 * Làm mới mọi trang đọc dữ liệu điều xe sau một lần ghi.
 * Các trang dùng chung xe/lái xe/chuyến nên sửa ở đâu cũng phải revalidate cả cụm.
 */
export function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/lich");
  revalidatePath("/xe");
  revalidatePath("/nhan-su");
  revalidatePath("/doanh-thu");
  revalidatePath("/tien-dau");
  revalidatePath("/chi-phi-khac");
  revalidatePath("/cong-no");
  revalidatePath("/luong");
}
