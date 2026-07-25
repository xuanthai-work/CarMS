import { describe, it, expect } from "vitest";
import { AI_MODELS, DEFAULT_MODEL_ID, resolveModelId } from "./ai";

describe("models", () => {
  it("có ít nhất Flash mặc định trong danh sách", () => {
    expect(AI_MODELS.some((m) => m.id === DEFAULT_MODEL_ID)).toBe(true);
    expect(DEFAULT_MODEL_ID).toBe("gemini-flash-latest");
  });
  it("resolveModelId giữ id hợp lệ", () => {
    expect(resolveModelId("gemini-pro-latest")).toBe("gemini-pro-latest");
  });
  it("resolveModelId trả mặc định cho id lạ/null", () => {
    expect(resolveModelId("gpt-4")).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId(null)).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId(undefined)).toBe(DEFAULT_MODEL_ID);
  });
});
