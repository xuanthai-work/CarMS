# TASK-029: Tạm Tắt Trợ Lý AI

## 1. Thông Tin Chung
- **Mã Task**: TASK-029
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: AI Assistant / Layout
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User quyết định tạm tắt toàn bộ trợ lý AI (làm lại sau); giao diện không còn AI. Tắt chứ không xóa: giữ mã nguồn, bật lại bằng một công tắc.

## 3. Thay Đổi Theo File
- `web/src/configs/features.ts` (mới): `AI_ASSISTANT_ENABLED = false`.
- `web/src/app/(main)/layout.tsx`: `assistantEnabled = AI_ASSISTANT_ENABLED && có key`; `AssistantProvider`, `Drawer`, `RightRail` chỉ render khi bật.
- `web/src/app/api/chat/route.ts`: `POST` trả 410 ngay đầu hàm khi tắt; phần còn lại (kể cả kiểm đăng nhập và hồ sơ nhân sự của TASK-022) giữ nguyên.

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx tsc --noEmit --noUnusedLocals`: 0 lỗi. `npm test`: 12/12 files, 100/100 tests. `npm run build`: thành công.
- Runtime: `POST /api/chat` trả 410; `/lich` không còn thành phần AI. Dev báo đã thử `true` (typecheck pass), bản commit để `false`.
- QA: đọc diff, đối chiếu 6/6 Acceptance Criteria; không file AI nào bị xóa, `package.json` không đổi. Không chạy lại gate.

## 5. Ghi Chú
- Bật lại AI: đổi `AI_ASSISTANT_ENABLED` sang `true` trong `web/src/configs/features.ts`.
- Các biến môi trường `OPENCODE_API_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY` giữ nguyên, hiện không được dùng.
