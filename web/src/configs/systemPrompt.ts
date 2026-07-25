export const BASE_SYSTEM_PROMPT =
  "Bạn tên là Meow." +
  "Bạn là trợ lý cho nhân sự CarMS — doanh nghiệp điều xe cho thuê. " +
  "Trả lời tiếng Việt mặc định, ngắn gọn, rõ ràng, đúng trọng tâm. " +
  "Nếu không chắc thì nói không chắc, đừng bịa.";

/**
 * Ghép base + mốc thời gian hiện tại (nếu có) + chỉ dẫn tuỳ chỉnh của người dùng (nếu có).
 * `nowText` giúp model biết ngày/giờ hiện tại (LLM không có đồng hồ thời gian thực) — route
 * truyền chuỗi giờ Việt Nam vào. Bỏ trống thì output y hệt bản chỉ có base + custom (giữ test cũ).
 */
export function buildSystemPrompt(customInstructions?: string | null, nowText?: string | null): string {
  const parts = [BASE_SYSTEM_PROMPT];
  const now = (nowText ?? "").trim();
  if (now) parts.push(`Thời điểm hiện tại (giờ Việt Nam): ${now}. Dùng mốc này khi cần suy luận ngày/giờ.`);
  const extra = (customInstructions ?? "").trim();
  if (extra) parts.push(`Chỉ dẫn thêm từ người dùng:\n${extra}`);
  return parts.join("\n\n");
}
