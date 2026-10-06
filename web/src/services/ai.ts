import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel, type LanguageModel, type LanguageModelMiddleware, type ToolSet } from "ai";
import type { ChatPlan } from "@/configs/ai";
import { hasTavilyKey, tavilySearchTool, vietnamLawSearchTool } from "@/services/tavily";

// Kiểu model V4 mà cả hai provider trả về (suy ra, khỏi phụ thuộc trực tiếp @ai-sdk/provider).
type OpencodeModel = ReturnType<ReturnType<typeof createOpenAICompatible>>;
type GeminiModel = ReturnType<ReturnType<typeof createGoogleGenerativeAI>>;
type ProviderModel = OpencodeModel | GeminiModel;

export function hasOpencodeKey(): boolean {
  return Boolean(process.env.OPENCODE_API_KEY);
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function opencodeProvider() {
  return createOpenAICompatible({
    name: "opencode",
    apiKey: process.env.OPENCODE_API_KEY,
    baseURL: process.env.OPENCODE_BASE_URL || "https://opencode.ai/zen/v1",
  });
}

function geminiProvider() {
  return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Bọc model chính bằng middleware tự động chuyển sang model dự phòng khi lỗi:
 *  - Lỗi ngay khi mở stream (401/429/model không khả dụng...) → chạy lại bằng fallback.
 *  - Lỗi xuất hiện trong stream TRƯỚC khi có nội dung → bỏ phần đã đệm, chuyển fallback.
 *  - Lỗi giữa chừng (đã có nội dung) → không thể fallback sạch, đành trả lỗi.
 * Phần meta (stream-start/response-metadata) được đệm tới khi có nội dung thật để
 * tránh phát trùng khi đổi provider.
 */
function withFallback(primary: ProviderModel, fallback: ProviderModel): LanguageModel {
  const middleware: LanguageModelMiddleware = {
    async wrapGenerate({ doGenerate, params }) {
      try {
        return await doGenerate();
      } catch {
        return fallback.doGenerate(params);
      }
    },
    async wrapStream({ doStream, params }) {
      type StreamPart = Awaited<ReturnType<typeof doStream>>["stream"] extends ReadableStream<infer P>
        ? P
        : never;

      let first: Awaited<ReturnType<typeof doStream>>;
      try {
        first = await doStream();
      } catch {
        return fallback.doStream(params);
      }

      let reader = first.stream.getReader();
      let sawContent = false;
      let switched = false;
      const pending: StreamPart[] = [];

      return {
        ...first,
        stream: new ReadableStream<StreamPart>({
          async pull(controller) {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) {
                for (const p of pending) controller.enqueue(p);
                pending.length = 0;
                controller.close();
                return;
              }
              if (value.type === "error") {
                if (!sawContent && !switched) {
                  switched = true;
                  try {
                    const fb = await fallback.doStream(params);
                    reader = fb.stream.getReader();
                    pending.length = 0;
                    continue;
                  } catch {
                    controller.error(value.error);
                    return;
                  }
                }
                controller.error(value.error);
                return;
              }
              // Meta part: giữ lại tới khi biết chắc provider chạy được.
              if (!sawContent && (value.type === "stream-start" || value.type === "response-metadata")) {
                pending.push(value);
                continue;
              }
              sawContent = true;
              for (const p of pending) controller.enqueue(p);
              pending.length = 0;
              controller.enqueue(value);
              return;
            }
          },
          cancel(reason) {
            return reader.cancel(reason);
          },
        }),
      };
    },
  };

  return wrapLanguageModel({ model: primary, middleware });
}

/** Dựng model AI SDK theo kế hoạch đã tính (kèm fallback nếu cần). */
export function buildLanguageModel(plan: ChatPlan): LanguageModel {
  const primary =
    plan.primaryProvider === "opencode"
      ? opencodeProvider()(plan.primaryModelId)
      : geminiProvider()(plan.primaryModelId);

  if (!plan.fallbackProvider) return primary;

  const fallback =
    plan.fallbackProvider === "gemini"
      ? geminiProvider()(plan.fallbackModelId!)
      : opencodeProvider()(plan.fallbackModelId!);

  return withFallback(primary, fallback);
}

/** Grounding Google Search chỉ chạy với model Gemini. */
export function googleSearchTools(): ToolSet {
  return { google_search: geminiProvider().tools.googleSearch({}) };
}

/**
 * Tool tìm kiếm web theo kế hoạch đã tính:
 *  - "tavily": function tool Tavily — chạy trên mọi model (kể cả OpenCode DeepSeek/Qwen).
 *  - "google": grounding Google Search — chỉ Gemini.
 * Trả undefined khi lượt này không bật web search (hoặc key đã bị gỡ sau lúc lập kế hoạch).
 */
export function buildWebSearchTools(plan: ChatPlan): ToolSet | undefined {
  if (plan.webSearchTool === "tavily") {
    if (!hasTavilyKey()) return undefined;
    return {
      tavily_search: tavilySearchTool(),
      vietnam_law_search: vietnamLawSearchTool(),
    };
  }
  if (plan.webSearchTool === "google") return googleSearchTools();
  return undefined;
}
