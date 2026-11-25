# TASK-065: Sửa Chữ Giờ Đè Thanh Màu (Tổng Quan) + Bỏ Mũi Tên ▲▼ Ô "Ngày Nhận Lương"

## 1. Thông Tin Chung
- **Mã Task**: TASK-065
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: UI
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User báo 2 lỗi UI. (A) Giờ lượt xe có thể là chữ tự do ("6h30 sáng sớm"); `whitespace-nowrap` ở TASK-064 làm chữ tràn đè thanh màu. (B) Ô `type="number"` hiện mũi tên ▲▼ gốc; toàn dự án chỉ có ô `payday`.

## 3. Thay Đổi Theo File
- `components/dashboard/Overview.tsx`: cột giờ `w-16 shrink-0 break-words leading-tight` (bỏ `whitespace-nowrap`).
- `components/staff/AddOfficeStaffButton.tsx`, `OfficeStaffCard.tsx`: ô `payday` thêm `[appearance:textfield]` và ẩn `::-webkit-inner/outer-spin-button`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright): ở 1440px và 430px, giờ "6h30 sáng sớm" xuống 3 dòng trong cột 64px, cách thanh màu 12px, không đè tên khách, không cuộn ngang; ô payday `appearance: textfield` (cả phần tử và nút spin), gõ 15 nhận đúng. Quét 10 màn: không còn ô number nào khác, không còn chữ tràn.
- Bài học: spec TASK-064 dùng `nowrap` mà không tính dữ liệu giờ dạng chữ; lần sau kiểm với dữ liệu thật trước khi chốt.
