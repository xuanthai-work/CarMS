// Danh mục model trợ lý AI, chia theo provider.
//
// - OpenCode Zen là provider CHÍNH (model mặc định). Gọi qua endpoint
//   OpenAI-compatible https://opencode.ai/zen/v1/chat/completions nên chỉ khai
//   báo những model dùng @ai-sdk/openai-compatible (xem docs: /docs/zen).
// - Gemini là provider DỰ PHÒNG: khi model chính lỗi (401/429/model không khả
//   dụng...) route tự chuyển sang Gemini. Gemini cũng là provider duy nhất có
//   grounding Google Search.
//
// File này chỉ chứa dữ liệu thuần (không import server) để client dùng cho picker.

export type ProviderId = "opencode" | "gemini";

export type AIModel = {
  /** Model id gửi cho provider (vd "deepseek-v4.1-flash"). */
  id: string;
  /** Nhãn ngắn hiển thị trong pill đổi model. */
  label: string;
  provider: ProviderId;
};

// OpenCode Zen — provider chính (OpenAI-compatible, /chat/completions).
export const OPENCODE_MODELS: AIModel[] = [
  { id: "space-bunny-free", label: "Space Bunny", provider: "opencode" },
  { id: "deepseek-v4.1-flash", label: "DeepSeek 4.1 Flash", provider: "opencode" },
  { id: "deepseek-v4-flash", label: "DeepSeek 4 Flash", provider: "opencode" },
  { id: "deepseek-v4-pro", label: "DeepSeek 4 Pro", provider: "opencode" },
  { id: "qwen3.8-max", label: "Qwen3.8 Max", provider: "opencode" },
  { id: "minimax-m3", label: "MiniMax M3", provider: "opencode" },
  { id: "glm-5.3", label: "GLM 5.3", provider: "opencode" },
  { id: "glm-5.3-flash", label: "GLM 5.3 Flash", provider: "opencode" },
  { id: "kimi-k3", label: "Kimi K3", provider: "opencode" },
  { id: "big-pickle", label: "Big Pickle", provider: "opencode" },
];

// Gemini — provider dự phòng (fallback tự động) + grounding web search.
// Ưu tiên alias "-latest" của Google: luôn trỏ bản được hỗ trợ hiện hành nên
// không bị 404 "no longer available" khi một version cụ thể bị khai tử.
export const GEMINI_MODELS: AIModel[] = [
  { id: "gemini-flash-latest", label: "Flash", provider: "gemini" },
  { id: "gemini-pro-latest", label: "Pro", provider: "gemini" },
  { id: "gemini-flash-lite-latest", label: "Flash-Lite", provider: "gemini" },
];

/** Tất cả model hợp lệ (dùng để resolve id, kể cả giá trị cũ trong localStorage). */
export const ALL_MODELS: AIModel[] = [...OPENCODE_MODELS, ...GEMINI_MODELS];

/** Danh sách cho picker: chỉ model chính (OpenCode); Gemini là fallback ẩn. */
export const AI_MODELS: AIModel[] = OPENCODE_MODELS;

export const DEFAULT_MODEL_ID = "space-bunny-free";

/** Model dự phòng khi provider chính lỗi. */
export const FALLBACK_MODEL_ID = "gemini-flash-latest";

export function findModel(id: string | null | undefined): AIModel | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

/** Chỉ nhận id trong danh mục; id lạ/null → mặc định. Dùng cả client (picker) lẫn server (chặn id tuỳ ý). */
export function resolveModelId(id: string | null | undefined): string {
  return findModel(id)?.id ?? DEFAULT_MODEL_ID;
}

/** Provider của một model id; id lạ → provider của model mặc định. */
export function providerOf(id: string | null | undefined): ProviderId {
  return findModel(id)?.provider ?? findModel(DEFAULT_MODEL_ID)!.provider;
}

/**
 * Cách chạy tìm kiếm web của một lượt chat:
 *  - "tavily": function tool gọi Tavily API → chạy được trên MỌI model.
 *  - "google": grounding Google Search của Gemini → chỉ model Gemini.
 */
export type WebSearchTool = "tavily" | "google";

export type ChatPlan = {
  /** Provider gọi trước. */
  primaryProvider: ProviderId;
  primaryModelId: string;
  /** Provider tự động chuyển sang khi provider chính lỗi (null = không có). */
  fallbackProvider: ProviderId | null;
  fallbackModelId: string | null;
  /** Có thực sự bật tìm kiếm web không (đã tính cả chuyện thiếu key). */
  webSearch: boolean;
  /** Cách chạy tìm kiếm web; null = lượt này không tìm kiếm web. */
  webSearchTool: WebSearchTool | null;
};

export type ChatPlanInput = {
  modelId: string | null | undefined;
  webSearch: boolean;
  hasOpencodeKey: boolean;
  hasGeminiKey: boolean;
  /** Có TAVILY_API_KEY → web search chạy trên mọi model, khỏi ép sang Gemini. */
  hasTavilyKey?: boolean;
};

/**
 * Quyết định provider/model cho một lượt chat (thuần, dễ test):
 *  1. Mặc định bám model người dùng chọn (OpenCode).
 *  2. Bật web search: có Tavily thì giữ nguyên model người dùng chọn (Tavily là
 *     function tool, model nào cũng gọi được); không có Tavily thì grounding Google
 *     Search chỉ Gemini làm được → ép sang Gemini.
 *  3. Thiếu key provider mong muốn thì rơi về provider còn lại.
 *  4. Provider chính là OpenCode → Gemini là fallback tự động.
 */
export function planChatRoute(input: ChatPlanInput): ChatPlan {
  const requested = resolveModelId(input.modelId);
  const requestedProvider = providerOf(requested);
  const useTavily = Boolean(input.hasTavilyKey);

  // Muốn Gemini nếu người dùng chọn Gemini, hoặc bật web search mà không có Tavily.
  const wantsGemini = (input.webSearch && !useTavily) || requestedProvider === "gemini";

  let primaryProvider: ProviderId;
  let primaryModelId: string;

  if (wantsGemini && input.hasGeminiKey) {
    primaryProvider = "gemini";
    primaryModelId = requestedProvider === "gemini" ? requested : FALLBACK_MODEL_ID;
  } else if (!wantsGemini && input.hasOpencodeKey) {
    primaryProvider = "opencode";
    primaryModelId = requestedProvider === "opencode" ? requested : DEFAULT_MODEL_ID;
  } else if (input.hasOpencodeKey) {
    // Muốn Gemini nhưng thiếu key → dùng OpenCode. Mất grounding Google, nhưng nếu có
    // Tavily thì web search vẫn chạy được (webSearchTool bên dưới tính theo Tavily).
    primaryProvider = "opencode";
    primaryModelId = DEFAULT_MODEL_ID;
  } else if (input.hasGeminiKey) {
    primaryProvider = "gemini";
    primaryModelId = requestedProvider === "gemini" ? requested : FALLBACK_MODEL_ID;
  } else {
    // Không có key nào; route đã chặn trước đó — giữ giá trị hợp lệ để không crash.
    primaryProvider = "opencode";
    primaryModelId = DEFAULT_MODEL_ID;
  }

  // Có Tavily thì dùng Tavily cho mọi provider; không có thì chỉ Gemini grounding chạy được.
  const webSearchTool: WebSearchTool | null = !input.webSearch
    ? null
    : useTavily
      ? "tavily"
      : primaryProvider === "gemini"
        ? "google"
        : null;

  return {
    primaryProvider,
    primaryModelId,
    fallbackProvider: primaryProvider === "opencode" && input.hasGeminiKey ? "gemini" : null,
    fallbackModelId: primaryProvider === "opencode" && input.hasGeminiKey ? FALLBACK_MODEL_ID : null,
    webSearch: webSearchTool !== null,
    webSearchTool,
  };
}
