import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hasTavilyKey, searchTavily, tavilySearchTool } from "./tavily";

const KEY = "TAVILY_API_KEY";

/** Response giả tối thiểu — đủ cho các nhánh ok/text/json mà service dùng. */
function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response;
}

let savedKey: string | undefined;

beforeEach(() => {
  savedKey = process.env[KEY];
  delete process.env[KEY];
  vi.unstubAllGlobals();
});

afterEach(() => {
  if (savedKey === undefined) delete process.env[KEY];
  else process.env[KEY] = savedKey;
  vi.unstubAllGlobals();
});

describe("hasTavilyKey", () => {
  it("phản ánh đúng TAVILY_API_KEY", () => {
    expect(hasTavilyKey()).toBe(false);
    process.env[KEY] = "tvly-test";
    expect(hasTavilyKey()).toBe(true);
  });
});

describe("searchTavily", () => {
  it("thiếu key → báo lỗi và KHÔNG gọi mạng", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const out = await searchTavily("giá xăng hôm nay");

    expect(out).toBe("Không thể tìm kiếm: Chưa cấu hình TAVILY_API_KEY.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("format kết quả trả về thành các khối đánh số", async () => {
    process.env[KEY] = "tvly-test";
    const fetchMock = vi.fn(async () =>
      fakeResponse({
        results: [
          { title: "Giá xăng dầu", url: "https://vnexpress.net/a", content: "Xăng RON 95 tăng 300đ.", score: 0.9 },
          { title: "Petrolimex", url: "https://petrolimex.com.vn/b", content: "Điều chỉnh giá từ 15h." },
        ],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const out = await searchTavily("giá xăng", 2);

    expect(out).toBe(
      "[1] Tiêu đề: Giá xăng dầu\n" +
        "Nguồn: https://vnexpress.net/a\n" +
        "Nội dung: Xăng RON 95 tăng 300đ.\n\n---\n\n" +
        "[2] Tiêu đề: Petrolimex\n" +
        "Nguồn: https://petrolimex.com.vn/b\n" +
        "Nội dung: Điều chỉnh giá từ 15h."
    );

    // Hợp đồng request gửi lên Tavily.
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.tavily.com/search");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      api_key: "tvly-test",
      query: "giá xăng",
      search_depth: "basic",
      max_results: 2,
      include_answer: false,
    });
  });

  it("không có kết quả → thông báo không tìm thấy", async () => {
    process.env[KEY] = "tvly-test";
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse({ results: [] })));

    const out = await searchTavily("từ khoá không tồn tại abcxyz");

    expect(out).toBe('Không tìm thấy kết quả phù hợp trên web cho từ khoá: "từ khoá không tồn tại abcxyz".');
  });

  it("Tavily trả HTTP lỗi → nêu mã lỗi, không throw", async () => {
    process.env[KEY] = "tvly-test";
    vi.stubGlobal("fetch", vi.fn(async () => fakeResponse("Unauthorized", 401)));

    const out = await searchTavily("giá xăng");

    expect(out).toContain("Lỗi tìm kiếm Tavily (HTTP 401)");
    expect(out).toContain("Unauthorized");
  });

  it("lỗi mạng → trả chuỗi mô tả lỗi, không throw", async () => {
    process.env[KEY] = "tvly-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      })
    );

    const out = await searchTavily("giá xăng");

    expect(out).toBe("Lỗi kết nối Tavily Search: ECONNREFUSED");
  });
});

describe("tavilySearchTool", () => {
  it("execute trả về kết quả đã format cho LLM đọc", async () => {
    process.env[KEY] = "tvly-test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => fakeResponse({ results: [{ title: "T", url: "https://x.vn", content: "C" }] }))
    );

    const execute = tavilySearchTool().execute!;
    const out = await execute(
      { query: "thời tiết Hà Nội" },
      { toolCallId: "call-1", messages: [] } as unknown as Parameters<typeof execute>[1]
    );

    expect(out).toBe("[1] Tiêu đề: T\nNguồn: https://x.vn\nNội dung: C");
  });
});
