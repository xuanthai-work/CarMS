// Loại xe (enum theo số chỗ). Thêm/bớt tại đây khi cần.
export const VEHICLE_TYPES = [4, 7, 16, 29, 35, 45] as const;

export const VEHICLE_STATUS = [
  { value: "active", label: "Hoạt động" },
  { value: "maintenance", label: "Bảo dưỡng" },
  { value: "inactive", label: "Ngưng" },
] as const;

export function seatLabel(seats: number | null | undefined): string {
  return seats ? `${seats} chỗ` : "—";
}

export function statusLabel(status: string): string {
  return VEHICLE_STATUS.find((s) => s.value === status)?.label ?? status;
}
