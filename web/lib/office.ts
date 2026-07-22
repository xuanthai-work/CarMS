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

// Chức vụ được coi là "quản lý" — xem được mọi trang.
export const MANAGER_POSITIONS = ["CEO", "COO"] as const;

/** True nếu chức vụ thuộc nhóm quản lý (CEO/COO). */
export function isManager(position: string | null): boolean {
  return position != null && (MANAGER_POSITIONS as readonly string[]).includes(position);
}
