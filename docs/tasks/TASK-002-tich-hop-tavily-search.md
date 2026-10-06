# TASK-002: Tích hợp Tavily Web Search Tool

- **Ngày thực hiện:** 2026-10-06
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Web Search

## 1. Mục tiêu & Vấn đề giải quyết
- **Thay thế hạ tầng tự host (SearXNG / Vane):** Không cần dựng VPS Docker riêng cồng kềnh, deploy 100% serverless trên Vercel qua REST API Tavily.
- **Tìm kiếm web độc lập với provider:** Trước đây web search chỉ chạy được trên model Gemini (qua Google Search Grounding). Sau khi tích hợp Tavily, **MỌI model** (kể cả OpenCode Zen DeepSeek, Qwen... hay Gemini) đều có thể bật tab `Web` để tra cứu internet thời gian thực.
- **Hỗ trợ Agentic Loop:** Cấu hình `stopWhen: stepCountIs(3)` để model có thể gọi search lặp lại nhiều lần nếu cần thu thập thêm thông tin trước khi trả lời.

## 2. File thay đổi
- `web/src/services/tavily.ts` *(Mới)*: Gọi REST API Tavily (`https://api.tavily.com/search`), bọc qua AI SDK `tool()`.
- `web/src/services/tavily.test.ts` *(Mới)*: Unit test cho hàm tìm kiếm và tool execution.
- `web/src/services/ai.ts`: Hàm `buildWebSearchTools(plan)` linh hoạt.
- `web/src/configs/ai.ts`: Cập nhật `planChatRoute` giữ nguyên model OpenCode khi có `hasTavilyKey`.
- `web/src/configs/ai.test.ts`: Bổ sung 5 test case kiểm tra định tuyến.
- `web/src/app/api/chat/route.ts`: Gắn tools và `stopWhen: stepCountIs(3)`.
- `web/.env.example`: Thêm hướng dẫn cấu hình biến `TAVILY_API_KEY`.

## 3. Kết quả Verification
- `npx tsc --noEmit`: PASS
- `npm test`: PASS (9/9 test files, 53/53 tests pass)
- `npm run build`: PASS
