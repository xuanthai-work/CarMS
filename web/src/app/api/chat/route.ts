import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { getCurrentUser, getCurrentStaff } from "@/services/auth";
import { planChatRoute } from "@/configs/ai";
import { buildLanguageModel, buildWebSearchTools, hasGeminiKey, hasOpencodeKey } from "@/services/ai";
import { hasTavilyKey } from "@/services/tavily";
import { systemReadTools } from "@/services/systemTools";
import { buildSystemPrompt } from "@/configs/systemPrompt";
import { isManager } from "@/utils/office";

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
    hasTavilyKey: hasTavilyKey(),
  });
  // Vai trò người đang trò chuyện → kiểm soát quyền truy cập dữ liệu tài chính/lương.
  const staff = await getCurrentStaff();
  const isManagerUser = isManager(staff?.position ?? null);
  const roleContext = {
    isManager: isManagerUser,
    position: staff?.position ?? null,
    staffName: staff?.name ?? null,
  };

  const system = buildSystemPrompt(body.customInstructions, VN_DATETIME.format(new Date()), roleContext);
  const model = buildLanguageModel(plan);

  // System Read Tools luôn sẵn sàng cho AI; Web Search Tools cấp thêm nếu lượt này bật web.
  const webTools = buildWebSearchTools(plan);
  const tools = {
    ...systemReadTools(roleContext),
    ...(webTools ?? {}),
  };

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(body.messages),
    tools,
    // Cho model tự gọi tool rồi tổng hợp câu trả lời: bước 1 gọi search, bước 2 trả lời
    // (chừa dư 1 bước nếu model muốn tra cứu thêm). Mặc định AI SDK chỉ chạy 1 bước.
    stopWhen: stepCountIs(3),
    abortSignal: req.signal,
  });

  return result.toUIMessageStreamResponse();
}
