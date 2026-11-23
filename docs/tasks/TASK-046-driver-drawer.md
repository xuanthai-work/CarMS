# TASK-046: Thêm/Sửa Lái Xe Bằng SideDrawer (Phase 6, Màn Lái Xe)

## 1. Thông Tin Chung
- **Mã Task**: TASK-046
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Drivers / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Bấm thẻ lái xe mở modal xem rồi bấm ✎ mới sửa; "+ Thêm lái xe" mở modal; lưu không báo lỗi và form sửa lưu được họ tên rỗng. Chuyển cả thêm và sửa sang Drawer như màn Xe (TASK-045), dùng mẫu `ActionResult`.

## 3. Thay Đổi Theo File
- `api/drivers.ts`: `saveDriver` trả `ActionResult`; họ tên `trim`, rỗng → "Vui lòng nhập họ tên lái xe."
- `components/drivers/DriverCard.tsx`: `SideDrawer` "Lái xe <tên>" vào thẳng form sửa, một cột, `onSubmit` + banner lỗi giữ dữ liệu, footer xóa (trái) + Lưu (phải) không Hủy, `fieldset disabled` cho chỉ-xem.
- `components/drivers/AddDriverButton.tsx`: `SideDrawer` "Thêm lái xe", footer Hủy + Thêm lái xe, `ActionResult` + banner.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, 16 kiểm tra đạt): màn Nhân sự; Drawer mở thẳng form sửa với giá trị hiện có; họ tên trắng → banner và giữ dữ liệu (sửa và thêm); sửa + "Xóa ngày nghỉ" → `endDate` null, lương giữ; lái xe cộng tác không có Lương tháng; thêm lưu DB, đóng, mở lại form trống; Esc đóng; xóa; 390px không tràn.
- Chưa kiểm bằng trình duyệt: tài khoản chỉ-xem (đã đọc code: `fieldset disabled`, Lưu/Xóa ẩn theo `canEdit`, nút Thêm trả null).
- Ghi nhận: họ tên rỗng hoàn toàn bị trình duyệt chặn bằng `required` (gợi ý gốc), còn toàn khoảng trắng mới tới banner của server.
