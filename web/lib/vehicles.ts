// Loại xe (enum theo số chỗ). Thêm/bớt tại đây khi cần.
export const VEHICLE_TYPES = [4, 7, 16, 29, 35, 45] as const;

export const VEHICLE_STATUS = [
  { value: "active", label: "Hoạt động" },
  { value: "maintenance", label: "Bảo dưỡng" },
  { value: "inactive", label: "Ngưng" },
] as const;

// Sở hữu xe: của công ty hay cộng tác/thuê ngoài.
export const OWNER_TYPES = [
  { value: "own", label: "Của công ty" },
  { value: "partner", label: "Cộng tác / thuê ngoài" },
] as const;

export function ownerLabel(type: string): string {
  return OWNER_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function seatLabel(seats: number | null | undefined): string {
  return seats ? `${seats} chỗ` : "—";
}

export function statusLabel(status: string): string {
  return VEHICLE_STATUS.find((s) => s.value === status)?.label ?? status;
}
