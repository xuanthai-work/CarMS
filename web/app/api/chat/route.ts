import { streamText, convertToModelMessages, type UIMessage, type ToolSet } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getCurrentUser } from "@/lib/auth";
import { resolveModelId } from "@/lib/ai/models";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Chưa đăng nhập", { status: 401 });
  if (!process.env.GEMINI_API_KEY) {
    return new Response("Trợ lý chưa được cấu hình (thiếu GEMINI_API_KEY).", { status: 503 });
  }

  let body: {
    messages: UIMessage[];
    model?: string;
    webSearch?: boolean;
    customInstructions?: string;
  };

  try {
    body = (await req.json()) as {
      messages: UIMessage[];
      model?: string;
      webSearch?: boolean;
      customInstructions?: string;
    };
  } catch {
    return new Response("Body không hợp lệ", { status: 400 });
  }

  const modelId = resolveModelId(body.model);
  // Ngày giờ hiện tại theo giờ VN — chốt ở timeZone nên đúng dù server (Vercel) chạy UTC.
  const nowText = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  const system = buildSystemPrompt(body.customInstructions, nowText);

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
