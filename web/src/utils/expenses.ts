import type { OtherExpenseCategory } from "@/types";

/**
 * Danh mục chi phí khác — NGUỒN DUY NHẤT cho nhãn + màu badge.
 * Dùng chung ở màn danh sách (badge) và modal thêm/sửa (dropdown chọn).
 */
export const OTHER_EXPENSE_CATEGORIES = [
  { value: "maintenance", label: "Bảo dưỡng & Sửa xe", badge: "bg-blue-100 text-blue-700", swatch: "bg-blue-500" },
  { value: "washing", label: "Rửa xe", badge: "bg-teal-100 text-teal-700", swatch: "bg-teal-500" },
  { value: "toll", label: "Cầu đường / VETC", badge: "bg-purple-100 text-purple-700", swatch: "bg-purple-500" },
  { value: "parking", label: "Bến bãi", badge: "bg-yellow-100 text-yellow-800", swatch: "bg-yellow-500" },
  { value: "fine_insurance", label: "Phạt & Bảo hiểm", badge: "bg-rose-100 text-rose-700", swatch: "bg-rose-500" },
  { value: "other", label: "Chi phí khác", badge: "bg-slate-100 text-slate-700", swatch: "bg-slate-500" },
] as const satisfies readonly {
  value: OtherExpenseCategory;
  label: string;
  badge: string;
  swatch: string;
}[];

export function otherExpenseCategoryMeta(value: string) {
  return (
    OTHER_EXPENSE_CATEGORIES.find((c) => c.value === value) ??
    OTHER_EXPENSE_CATEGORIES[OTHER_EXPENSE_CATEGORIES.length - 1]
  );
}
