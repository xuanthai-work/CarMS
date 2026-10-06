# TASK-001: Cải thiện Base System Prompt cho Trợ lý Meow

- **Ngày thực hiện:** 2026-10-06
- **Trạng thái:**  **Hoàn thành** (Commit: `c5ea06c`, đã push lên `main`)
- **Phân hệ:** AI Assistant

## 1. Mục tiêu & Vấn đề giải quyết
- **Lỗi chuỗi dính ký tự:** Khắc phục lỗi nối chuỗi `"Bạn tên là Meow." + "Bạn là trợ lý..."` dính liền thành `"Bạn tên là Meow.Bạn là trợ lý..."`.
- **Bổ sung nghiệp vụ CarMS:** Khai báo 5 phân hệ cốt lõi: Lịch điều xe, phân ca tài xế, quản lý đội xe/bảo dưỡng, quản lý chi phí dầu/cầu đường, đối soát doanh thu - tính lương.
- **Ranh giới dữ liệu (Anti-hallucination):** Quy định rõ Meow không tự ý bịa số liệu nội bộ; hướng dẫn người dùng vào đúng phân hệ khi hỏi về dữ liệu real-time.
- **Xưng hô & định dạng:** Quy định xưng hô "Meow" - "bạn/anh/chị"; yêu cầu định dạng Markdown rõ ràng, dùng bullet points và bảng biểu.

## 2. File thay đổi
- `web/src/configs/systemPrompt.ts` (Cập nhật `BASE_SYSTEM_PROMPT` và `buildSystemPrompt`)

## 3. Kết quả Verification
- `npx tsc --noEmit`: PASS
- `npm test`: PASS (8/8 test files, 41/41 tests pass bao gồm 4 unit test của `systemPrompt.test.ts`)
- `npm run build`: PASS (18/18 routes biên dịch thành công)
