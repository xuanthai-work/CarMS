# TASK-017: Chống Double-Submit / Multi-Click Khi Thêm & Sửa Chuyến

## 1. Thông Tin Chung
- **Mã Task**: TASK-017
- **Ngày hoàn thành**: 2026-10-23
- **Phân hệ**: Dispatch Calendar / Core UI & Data Integrity
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**

---

## 2. Mục Tiêu & Vấn Đề Xử Lý
- **Vấn đề**: Trên môi trường Production (Vercel Serverless + Supabase), người dùng tạo chuyến mới (ví dụ khách "Hoàng Hải", ngày 26, 29 chỗ, 1.500.000đ). Do request mất 1-3s để hoàn tất và nút bấm không có trạng thái loading/disabled, người dùng bấm liên tiếp nhiều lần (hoặc double-click), dẫn đến việc sinh ra hàng loạt chuyến trùng lặp trên database.
- **Giải pháp**:
  - Tích hợp `useTransition` (`isPending`) và đồng bộ chốt chặn `useRef` (`isSubmittingRef`) vào `TripForm.tsx`.
  - Khoá cả nút Submit và nút Huỷ (`disabled={isPending}`).
  - Hiển thị nhãn trực quan: "Đang thêm…" / "Đang lưu…".
  - Cung cấp script SQL dọn dẹp các chuyến trùng lặp trên database Production tại `web/docs/cleanup-duplicate-trips.sql`.

---

## 3. Các File Thay Đổi
- `web/src/components/schedule/TripForm.tsx`: Thêm `useTransition`, `isSubmittingRef`, disable nút bấm và hiển thị trạng thái pending.
- `web/docs/cleanup-duplicate-trips.sql`: Script dọn dẹp các bản ghi trùng lặp trên Production (có bước xem trước SELECT và bước DELETE an toàn trong transaction).

---

## 4. Kết Quả Verification Gates
- **TypeScript Typecheck**: `npx tsc --noEmit` -> **0 lỗi (PASS)**.
- **Vitest Test Suite**: `npm test` -> **10/10 test files, 79/79 tests passed (PASS)**.
- **Acceptance Criteria**: Đạt 100% yêu cầu đề ra.
