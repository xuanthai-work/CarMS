import { describe, it, expect } from "vitest";
import {
  AI_MODELS,
  ALL_MODELS,
  DEFAULT_MODEL_ID,
  FALLBACK_MODEL_ID,
  findModel,
  planChatRoute,
  providerOf,
  resolveModelId,
} from "./ai";

describe("models", () => {
  it("model mặc định nằm trong danh sách và thuộc OpenCode", () => {
    expect(AI_MODELS.some((m) => m.id === DEFAULT_MODEL_ID)).toBe(true);
    expect(DEFAULT_MODEL_ID).toBe("space-bunny-free");
    expect(providerOf(DEFAULT_MODEL_ID)).toBe("opencode");
  });

  it("picker chỉ hiển thị model OpenCode (Gemini là fallback ẩn)", () => {
    expect(AI_MODELS.every((m) => m.provider === "opencode")).toBe(true);
    expect(AI_MODELS.some((m) => m.id === FALLBACK_MODEL_ID)).toBe(false);
  });

  it("fallback là model Gemini hợp lệ", () => {
    expect(findModel(FALLBACK_MODEL_ID)?.provider).toBe("gemini");
  });

  it("resolveModelId giữ id hợp lệ", () => {
    expect(resolveModelId("glm-5.3")).toBe("glm-5.3");
    expect(resolveModelId("gemini-pro-latest")).toBe("gemini-pro-latest");
  });

  it("resolveModelId trả mặc định cho id lạ/null", () => {
    expect(resolveModelId("gpt-4")).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId(null)).toBe(DEFAULT_MODEL_ID);
    expect(resolveModelId(undefined)).toBe(DEFAULT_MODEL_ID);
  });

  it("providerOf phân loại đúng theo provider", () => {
    expect(providerOf("kimi-k3")).toBe("opencode");
    expect(providerOf("gemini-flash-latest")).toBe("gemini");
    expect(providerOf("không-tồn-tại")).toBe("opencode");
    expect(ALL_MODELS.some((m) => m.provider === "gemini")).toBe(true);
  });
});

describe("planChatRoute", () => {
  const both = { hasOpencodeKey: true, hasGeminiKey: true };

  it("mặc định OpenCode, Gemini là fallback", () => {
    const plan = planChatRoute({ modelId: "kimi-k3", webSearch: false, ...both });
    expect(plan.primaryProvider).toBe("opencode");
    expect(plan.primaryModelId).toBe("kimi-k3");
    expect(plan.fallbackProvider).toBe("gemini");
    expect(plan.fallbackModelId).toBe(FALLBACK_MODEL_ID);
  });

  it("bật web search thì ép sang Gemini và không cần fallback", () => {
    const plan = planChatRoute({ modelId: "kimi-k3", webSearch: true, ...both });
    expect(plan.primaryProvider).toBe("gemini");
    expect(plan.fallbackProvider).toBeNull();
    expect(plan.webSearch).toBe(true);
  });

  it("giữ model Gemini khi người dùng chọn Gemini", () => {
    const plan = planChatRoute({ modelId: "gemini-pro-latest", webSearch: false, ...both });
    expect(plan.primaryProvider).toBe("gemini");
    expect(plan.primaryModelId).toBe("gemini-pro-latest");
    expect(plan.fallbackProvider).toBeNull();
  });

  it("thiếu key OpenCode thì rơi về Gemini", () => {
    const plan = planChatRoute({
      modelId: "kimi-k3",
      webSearch: false,
      hasOpencodeKey: false,
      hasGeminiKey: true,
    });
    expect(plan.primaryProvider).toBe("gemini");
    expect(plan.primaryModelId).toBe(FALLBACK_MODEL_ID);
  });

  it("thiếu key Gemini thì dùng OpenCode và bỏ grounding", () => {
    const plan = planChatRoute({
      modelId: "kimi-k3",
      webSearch: true,
      hasOpencodeKey: true,
      hasGeminiKey: false,
    });
    expect(plan.primaryProvider).toBe("opencode");
    expect(plan.primaryModelId).toBe(DEFAULT_MODEL_ID);
    expect(plan.fallbackProvider).toBeNull();
    expect(plan.webSearch).toBe(false);
  });
});
