import { describe, it, expect } from "vitest";
import { BASE_SYSTEM_PROMPT, buildSystemPrompt } from "./systemPrompt";

describe("buildSystemPrompt", () => {
  it("không có chỉ dẫn → chỉ base", () => {
    expect(buildSystemPrompt()).toBe(BASE_SYSTEM_PROMPT);
    expect(buildSystemPrompt("")).toBe(BASE_SYSTEM_PROMPT);
    expect(buildSystemPrompt("   ")).toBe(BASE_SYSTEM_PROMPT);
  });
  it("có chỉ dẫn → base + chỉ dẫn", () => {
    const out = buildSystemPrompt("Xưng hô thân mật.");
    expect(out.startsWith(BASE_SYSTEM_PROMPT)).toBe(true);
    expect(out).toContain("Xưng hô thân mật.");
  });
  it("có mốc thời gian → chèn vào prompt, sau base", () => {
    const out = buildSystemPrompt("", "Thứ Sáu, 24 tháng 7, 2026 lúc 17:02");
    expect(out.startsWith(BASE_SYSTEM_PROMPT)).toBe(true);
    expect(out).toContain("Thứ Sáu, 24 tháng 7, 2026 lúc 17:02");
  });
  it("mốc thời gian + chỉ dẫn cùng lúc → có cả hai", () => {
    const out = buildSystemPrompt("Nói ngắn.", "24 tháng 7, 2026");
    expect(out).toContain("24 tháng 7, 2026");
    expect(out).toContain("Nói ngắn.");
  });
});
