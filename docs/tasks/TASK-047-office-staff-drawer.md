# TASK-047: Thêm/Sửa Nhân Sự Văn Phòng Bằng SideDrawer (Phase 6)

## 1. Thông Tin Chung
- **Mã Task**: TASK-047
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Staff / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Bấm thẻ nhân sự văn phòng mở modal xem rồi bấm ✎ mới sửa; "+ Thêm nhân sự văn phòng" mở modal. Chuyển cả thêm và sửa sang Drawer như màn Xe/Lái xe. `saveOfficeStaff` đã trả `ActionResult` nên không đổi API.

## 3. Thay Đổi Theo File
- `components/staff/OfficeStaffCard.tsx`: `SideDrawer` "Nhân sự <tên>" vào thẳng form sửa, một cột, banner lỗi giữ dữ liệu, footer xóa (trái) + Lưu (phải) không Hủy, `fieldset disabled` cho chỉ-xem, Họ tên `required`.
- `components/staff/AddOfficeStaffButton.tsx`: `SideDrawer` "Thêm nhân sự văn phòng", footer Hủy + Thêm nhân sự, một cột.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, 15 kiểm tra đạt, tab Văn phòng): Drawer mở thẳng form sửa với đủ giá trị (chức vụ, giới tính, ngày sinh, ngày nhận lương, ngày vào/nghỉ việc); thân cuộn (form dài) và footer đứng yên; email trùng → banner, giữ dữ liệu, Drawer còn mở (cả sửa và thêm); "Xóa ngày nghỉ" + đổi lương lưu đúng DB; thêm lưu DB, đóng, mở lại form trống; Esc đóng; xóa; 390px không tràn.
- Chưa kiểm bằng trình duyệt: tài khoản chỉ-xem (đã đọc code).
