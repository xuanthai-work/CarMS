# TASK-044: Lịch Chọn Ngày Căn Phải Cho Ô Ngày Về

## 1. Thông Tin Chung
- **Mã Task**: TASK-044
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: UI / Schedule
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Lịch của ô ngày về (cột phải modal chuyến) mở căn trái, rộng 268px nên bị thân modal cắt mất cột Chủ nhật.

## 3. Thay Đổi Theo File
- `components/common/DatePicker.tsx`: prop `align?: "left" | "right"` (mặc định `left`, các nơi khác không đổi); `right` dùng `right-0`.
- `components/schedule/TripForm.tsx`: ô `r_date` truyền `align="right"`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, 5 kiểm tra đạt): 1440px lịch ngày về hiện đủ T2…CN, mép phải nằm trong thân modal; lịch ngày đi vẫn căn trái; chọn ngày về hoạt động; 390px lịch trong thân modal theo chiều ngang, không tràn.
- Ghi nhận (có từ trước): ở 390px lịch mở phía dưới ô nên phần dưới bị thân modal che, phải cuộn thân để thấy hết. Chưa xử lý.
