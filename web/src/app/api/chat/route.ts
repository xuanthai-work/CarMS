import { streamText, convertToModelMessages, type UIMessage, type ToolSet } from "ai";
import { getCurrentUser } from "@/services/auth";
import { planChatRoute } from "@/configs/ai";
import { buildLanguageModel, googleSearchTools, hasGeminiKey, hasOpencodeKey } from "@/services/ai";
import { buildSystemPrompt } from "@/configs/systemPrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type ChatBody = {
  messages: UIMessage[];
  model?: string;
  webSearch?: boolean;
  customInstructions?: string;
};

// Formatter dựng 1 lần (locale/timezone resolution đắt hơn .format()); chốt giờ VN dù server chạy UTC.
const VN_DATETIME = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Chưa đăng nhập", { status: 401 });

  // OpenCode Zen là provider chính; Gemini dự phòng (và lo web search). Cần ít nhất 1 key.
  const opencodeKey = hasOpencodeKey();
  const geminiKey = hasGeminiKey();
  if (!opencodeKey && !geminiKey) {
    return new Response("Meow chưa được cấu hình (thiếu OPENCODE_API_KEY và GEMINI_API_KEY).", {
      status: 503,
    });
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Body không hợp lệ", { status: 400 });
  }

  const plan = planChatRoute({
    modelId: body.model,
    webSearch: Boolean(body.webSearch),
    hasOpencodeKey: opencodeKey,
    hasGeminiKey: geminiKey,
  });
  const system = buildSystemPrompt(body.customInstructions, VN_DATETIME.format(new Date()));
  const model = buildLanguageModel(plan);

  // Grounding Google Search chỉ khi thực sự chạy model Gemini (provider-executed tool).
  const tools: ToolSet | undefined = plan.webSearch ? googleSearchTools() : undefined;

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(body.messages),
    tools,
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
