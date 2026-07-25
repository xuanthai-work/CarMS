// Chức vụ nhân sự văn phòng (tạm thời). Thêm/bớt tại đây khi cần.
export const OFFICE_POSITIONS = ["CEO", "COO", "Nhân viên"] as const;

// Giới tính.
export const GENDERS = ["Nam", "Nữ", "Khác"] as const;

/** Options chức vụ cho dropdown; giữ lại giá trị cũ (ngoài enum) ở đầu list để không mất khi sửa. */
export function officePositionOptions(current: string | null): readonly string[] {
  return current && !(OFFICE_POSITIONS as readonly string[]).includes(current)
    ? [current, ...OFFICE_POSITIONS]
    : OFFICE_POSITIONS;
}

/**
 * Quyền tách làm 2 trục độc lập:
 *  - isManager → PHẠM VI XEM (thấy Doanh thu, lương văn phòng, nhân sự văn phòng)
 *  - canEdit   → QUYỀN GHI (thêm/sửa/xoá)
 * CEO nằm ở nhóm quản lý (xem hết) nhưng chỉ được xem, không ghi.
 */

// Chức vụ được coi là "quản lý" — xem được mọi trang.
export const MANAGER_POSITIONS = ["CEO", "COO"] as const;

/** True nếu chức vụ thuộc nhóm quản lý (CEO/COO). */
export function isManager(position: string | null): boolean {
  return position != null && (MANAGER_POSITIONS as readonly string[]).includes(position);
}

// Chức vụ chỉ được xem — thấy đủ thông tin nhưng không sửa được gì.
export const READONLY_POSITIONS = ["CEO"] as const;

/**
 * True nếu chức vụ được phép ghi (thêm/sửa/xoá).
 * Cố ý là danh sách CHẶN, không phải danh sách CHO PHÉP: officePositionOptions()
 * giữ lại chức vụ cũ ngoài enum, nếu dùng allowlist thì những người đó sẽ mất
 * quyền ghi ngoài ý muốn.
 */
export function canEdit(position: string | null): boolean {
  return position != null && !(READONLY_POSITIONS as readonly string[]).includes(position);
}
