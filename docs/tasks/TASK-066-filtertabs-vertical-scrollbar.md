# TASK-066: Sửa Thanh Cuộn Dọc (Mũi Tên ▲▼) Lòi Ra Ở Tab Lọc FilterTabs

## 1. Thông Tin Chung
- **Mã Task**: TASK-066
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: UI
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User gửi ảnh có cặp mũi tên ▲▼ cạnh nhóm tab lọc. Nguyên nhân: `FilterTabs` container `h-9` có viền 1px (nội dung 34px) nhưng nút tab `h-9` (36px) tràn dọc; do `overflow-x-auto` nên `overflow-y` tự thành `auto` và hiện thanh cuộn dọc. (TASK-065 đã chẩn đoán nhầm là ô number; phần ẩn spinner `payday` vẫn giữ, vô hại.)

## 3. Thay Đổi Theo File
- `components/common/FilterTabs.tsx`: container thêm `overflow-y-hidden`; nút tab `h-9` → `h-full`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright): 7 màn (Lịch, Doanh thu, Tiền dầu, Chi phí khác, Công nợ, Nhân sự, Lương) ở 1440px và 430px: `scrollHeight = clientHeight = 34`, không cuộn ngang trang; xem ảnh chụp tab xanh không bị cắt góc.
