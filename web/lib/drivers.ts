// Hạng bằng lái (VN). Xe 16–45 chỗ thường cần D (≤30 chỗ) hoặc E (>30 chỗ).
export const LICENSE_CLASSES = ["B2", "C", "D", "E", "F"] as const;

export const DRIVER_TYPES = [
  { value: "own", label: "Của công ty" },
  { value: "partner", label: "Cộng tác / thuê ngoài" },
] as const;

export function driverTypeLabel(type: string): string {
  return DRIVER_TYPES.find((t) => t.value === type)?.label ?? type;
}
