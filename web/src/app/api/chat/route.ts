import { streamText, convertToModelMessages, type UIMessage, type ToolSet } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCurrentUser } from "@/services/auth";
import { resolveModelId } from "@/configs/ai";
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
  if (!process.env.GEMINI_API_KEY) {
    return new Response("Meow chưa được cấu hình (thiếu GEMINI_API_KEY).", { status: 503 });
  }

  let body: ChatBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Body không hợp lệ", { status: 400 });
  }

  const modelId = resolveModelId(body.model);
  const system = buildSystemPrompt(body.customInstructions, VN_DATETIME.format(new Date()));

  // Provider riêng với apiKey lấy từ GEMINI_API_KEY (mặc định SDK đọc
  // GOOGLE_GENERATIVE_AI_API_KEY, tên biến khác của dự án nên phải set tay).
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

  // Grounding Google Search chỉ khi webSearch = true (mặc định tắt → giữ free).
  // AI SDK v7 + @ai-sdk/google v4: không còn model setting `useSearchGrounding`,
  // grounding bật qua tool provider-executed `google.tools.googleSearch()`.
  const tools: ToolSet | undefined = body.webSearch
    ? { google_search: google.tools.googleSearch({}) }
    : undefined;

  const result = streamText({
    model: google(modelId),
    system,
    messages: await convertToModelMessages(body.messages),
    tools,
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
