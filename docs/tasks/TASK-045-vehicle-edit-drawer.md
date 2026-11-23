# TASK-045: Sửa Xe Bằng SideDrawer (Phase 6, Màn Quản Lý Xe)

## 1. Thông Tin Chung
- **Mã Task**: TASK-045
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Vehicles / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Bấm thẻ xe mở modal "Thông tin xe" (xem) rồi phải bấm ✎ mới sửa. Theo roadmap, màn khác dùng Drawer cho thêm/sửa: bấm thẻ xe mở Drawer vào thẳng form sửa.

## 3. Thay Đổi Theo File
- `components/vehicles/VehicleCard.tsx`: thay `Modal` xem/sửa bằng `SideDrawer` tiêu đề "Xe <biển số>", form sửa một cột; footer xóa (trái) + Lưu (phải), không Hủy; `fieldset disabled` cho tài khoản chỉ-xem; bỏ chế độ xem, nút ✎, `editing`, `editForm`, import thừa.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, 13 kiểm tra đạt): Drawer mở thẳng form sửa với giá trị hiện có; gõ dấu cách trong biển số bình thường; trùng biển số → banner và giữ dữ liệu, Drawer không đóng; lưu cập nhật DB và đóng; xe cộng tác có SĐT, không có hạn đăng kiểm; Esc và bấm nền đóng; xóa xe; 390px Drawer toàn chiều rộng.
- Chưa kiểm bằng trình duyệt: tài khoản chỉ-xem (đã đọc code: `fieldset disabled`, Lưu/Xóa ẩn theo `canEdit`).
