import { tool } from "ai";
import { z } from "zod";

// Tìm kiếm web qua Tavily (https://tavily.com) — REST API, không cần package ngoài.
//
// Vì sao cần: grounding Google Search chỉ chạy được với model Gemini. Tavily là
// function tool thường (LLM gọi → server thực thi → trả kết quả về cho LLM), nên
// bật web search được trên MỌI model, kể cả OpenCode DeepSeek/Qwen.

export type TavilySearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

export type TavilySearchResponse = {
  results?: TavilySearchResult[];
};

export function hasTavilyKey(): boolean {
  return Boolean(process.env.TAVILY_API_KEY);
}

/**
 * Gọi REST API trực tiếp của Tavily, không phụ thuộc package ngoài.
 * Mọi lỗi (thiếu key, HTTP lỗi, mạng) đều trả về CHUỖI mô tả lỗi thay vì throw —
 * để LLM đọc được và tự trả lời người dùng thay vì làm hỏng cả lượt chat.
 */
export async function searchTavily(query: string, maxResults = 5): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return "Không thể tìm kiếm: Chưa cấu hình TAVILY_API_KEY.";
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: maxResults,
        include_answer: false,
      }),
    });

    if (!res.ok) {
      return `Lỗi tìm kiếm Tavily (HTTP ${res.status}): ${await res.text()}`;
    }

    const data = (await res.json()) as TavilySearchResponse;
    const items = data.results ?? [];
    if (items.length === 0) {
      return `Không tìm thấy kết quả phù hợp trên web cho từ khoá: "${query}".`;
    }

    return items
      .map(
        (item, idx) =>
          `[${idx + 1}] Tiêu đề: ${item.title}\nNguồn: ${item.url}\nNội dung: ${item.content}`
      )
      .join("\n\n---\n\n");
  } catch (err) {
    return `Lỗi kết nối Tavily Search: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * AI SDK Tool cho phép LLM tự động gọi tìm kiếm web khi cần tra cứu thông tin thực tế.
 * (AI SDK v7: schema khai qua `inputSchema`, không phải `parameters`.)
 */
export function tavilySearchTool() {
  return tool({
    description:
      "Tìm kiếm thông tin thời gian thực, tin tức, giá cả, thời tiết hoặc dữ liệu internet qua Tavily Search.",
    inputSchema: z.object({
      query: z.string().describe("Từ khoá hoặc câu truy vấn cần tìm kiếm trên internet"),
    }),
    execute: async ({ query }) => searchTavily(query),
  });
}
