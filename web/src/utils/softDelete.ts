type SoftDeletable = { id: string; deletedAt?: string | null };

/** Lọc các mục chưa xóa mềm. */
export function activeOnly<T extends { deletedAt?: string | null }>(items: readonly T[]): T[] {
  return items.filter((item) => !item.deletedAt);
}

/** Lọc cho ô chọn khi thêm/sửa: giữ mục chưa xóa + mục đang được chọn (nếu đã xóa). */
export function pickableOptions<T extends SoftDeletable>(
  items: readonly T[],
  selectedIds: string | null | undefined | readonly (string | null | undefined)[]
): T[] {
  const selected = new Set(
    (Array.isArray(selectedIds) ? selectedIds : [selectedIds]).filter((x): x is string => !!x)
  );
  return items.filter((item) => !item.deletedAt || selected.has(item.id));
}

/** Gắn hậu tố "(đã xóa)" vào nhãn nếu mục đã xóa mềm. */
export function deletedLabel(label: string, deletedAt?: string | null): string {
  return deletedAt ? `${label} (đã xóa)` : label;
}
