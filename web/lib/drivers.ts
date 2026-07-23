// Hạng bằng lái (VN). Xe 16–45 chỗ thường cần D (≤30 chỗ) hoặc E (>30 chỗ).
export const LICENSE_CLASSES = ["B2", "C", "D", "E", "F"] as const;

// Options cho dropdown hạng bằng: mục rỗng "chưa rõ" + hiển thị "Hạng B2" nhưng lưu "B2".
export const LICENSE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "— Chưa rõ —" },
  ...LICENSE_CLASSES.map((c) => ({ value: c, label: `Hạng ${c}` })),
];

export const DRIVER_TYPES = [
  { value: "own", label: "Của công ty" },
  { value: "partner", label: "Cộng tác / thuê ngoài" },
] as const;

export function driverTypeLabel(type: string): string {
  return DRIVER_TYPES.find((t) => t.value === type)?.label ?? type;
}
