# TASK-003: Tích hợp Tool tra cứu Luật pháp Việt Nam qua Tavily Search

- **Ngày thực hiện:** 2026-10-06
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Legal Search

## 1. Mục tiêu & Vấn đề giải quyết
- **Thay thế giải pháp RAG thủ công phức tạp:** Không cần tự thu thập và quản lý hiệu lực hàng ngàn văn bản luật (vốn thay đổi liên tục). Thay vào đó dùng cơ chế web search trực tiếp nhưng khóa chặt phạm vi tên miền chính thống.
- **Tên miền luật được whitelist (`include_domains`):**
  - `thuvienphapluat.vn`
  - `luatvietnam.vn`
  - `chinhphu.vn`
  - `mt.gov.vn` (Cổng thông tin Bộ Giao thông Vận tải)
  - `csgt.vn` (Cổng thông tin Cục Cảnh sát Giao thông)
- **Công cụ AI chuyên trách:** Cung cấp tool `vietnam_law_search` với mô tả rõ ràng để LLM tự động kích hoạt khi nhận câu hỏi về: luật giao thông đường bộ, nghị định 100/123, mức phạt nồng độ cồn, quá tải, điều kiện kinh doanh xe hợp đồng, bằng lái xe...

## 2. File thay đổi
- `web/src/services/tavily.ts`: Khai báo `VIETNAM_LAW_DOMAINS`, hàm `searchVietnamLaw(query)` với `search_depth: "advanced"`, và AI SDK tool `vietnamLawSearchTool()`.
- `web/src/services/ai.ts`: Cấp cả 2 tools (`tavily_search` & `vietnam_law_search`) trong `buildWebSearchTools`.
- `web/src/services/tavily.test.ts`: Thêm 5 unit test kiểm tra việc gửi đúng payload `include_domains` và format trích dẫn.

## 3. Kết quả Verification
- `npx tsc --noEmit`: PASS
- `npm test`: PASS (9/9 test files, 58/58 tests pass)
- `npm run build`: PASS
