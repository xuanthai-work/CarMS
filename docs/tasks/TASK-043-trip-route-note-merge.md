# TASK-043: Gộp Ô Lộ Trình Và Ghi Chú Thành "Lộ trình/Note"

## 1. Thông Tin Chung
- **Mã Task**: TASK-043
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User muốn modal chuyến chỉ còn một ô nhiều dòng "Lộ trình/Note" thay cho hai ô Lộ trình và Ghi chú. Nội dung lưu vào `note`; dữ liệu lộ trình cũ không được mất; các màn hiển thị lộ trình vẫn có chữ.

## 3. Thay Đổi Theo File
- `components/schedule/TripForm.tsx`: bỏ dòng Lộ trình; ô nhiều dòng nhãn "Lộ trình/Note", giá trị ban đầu ghép lộ trình cũ (kèm "· Về: …") với ghi chú cũ.
- `api/trips.ts`: không đọc `o_route`; `outboundFrom/To`, `returnFrom/To` ghi rỗng (một chiều: `returnFrom/To` null).
- `utils/trips.ts` (+ `trips.test.ts`, 4 test mới): `legRoute(leg, note?)` ưu tiên from/to cũ, không có thì lấy dòng đầu không rỗng của `note`, không có nữa thì "—".
- `VehicleSchedule.tsx`, `dashboard/Overview.tsx`, `debts/DebtScreen.tsx`, `services/debts.ts`, `types/index.ts`: truyền/lấy `note` để hiển thị và tìm kiếm lộ trình.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, 12 kiểm tra đạt): chuyến cũ mở ra ô hiện "Hà Nội → Sapa · Về: Sapa → Hà Nội" + dòng ghi chú; lưu xong DB có `from/to` rỗng, `note` gộp, SĐT giữ; mở lại không nhân đôi; bảng "Theo xe" hiện lộ trình cũ và dòng đầu của note ở chuyến mới; một chiều ô note giãn lấp chỗ; khung 576px; 390px không tràn.
- Chưa kiểm bằng trình duyệt: màn Công nợ và Tổng quan (đã đọc code, dùng cùng `legRoute`).
- Ghi nhận: ghi chú xuống dòng lưu dạng CRLF; `legRoute` tách theo `\n` rồi `trim` nên vẫn đúng.
