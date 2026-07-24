// Danh sách model Gemini cho phép chọn.
// Ưu tiên alias "-latest" của Google: chúng luôn trỏ tới bản được hỗ trợ hiện hành, nên
// không bị lỗi 404 "no longer available" khi một version cụ thể (vd gemini-2.5-flash) bị khai tử.
// Kèm 1 bản version cố định (3.6 Flash) cho ai muốn hành vi ổn định, không đổi theo alias.
// (Đã xác minh 200 với API key hiện tại; kiểm lại tại Google AI Studio nếu Google đổi tên.)
// Nhãn ngắn để vừa "pill" đổi model trong composer (trigger truncate nếu dài).
export const AI_MODELS: { id: string; label: string }[] = [
  { id: "gemini-flash-latest", label: "Flash" },
  { id: "gemini-pro-latest", label: "Pro" },
  { id: "gemini-flash-lite-latest", label: "Flash-Lite" },
  { id: "gemini-3.6-flash", label: "3.6 Flash" },
];

export const DEFAULT_MODEL_ID = "gemini-flash-latest";

/** Chỉ nhận id trong danh sách; id lạ/null → mặc định. Dùng cả client (picker) lẫn server (chặn id tuỳ ý). */
export function resolveModelId(id: string | null | undefined): string {
  return AI_MODELS.some((m) => m.id === id) ? (id as string) : DEFAULT_MODEL_ID;
}
