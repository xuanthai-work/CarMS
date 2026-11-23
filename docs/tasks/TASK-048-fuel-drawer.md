# TASK-048: Thêm/Sửa Phiếu Dầu Bằng SideDrawer (Phase 6, Màn Tiền Dầu)

## 1. Thông Tin Chung
- **Mã Task**: TASK-048
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Fuel / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Thêm và sửa phiếu dầu dùng chung một Modal; form dùng `action=` nên lưu lỗi làm mất dữ liệu và `saveFuelEntry` ném lỗi thô. Chuyển sang Drawer, `ActionResult`, giữ dữ liệu khi lỗi.

## 3. Thay Đổi Theo File
- `api/fuel.ts`: `saveFuelEntry` trả `ActionResult` ("Vui lòng chọn xe.", "Vui lòng chọn ngày đổ.", "Vui lòng nhập số tiền."); số tiền = bỏ ký tự không phải số rồi `Number` (tương đương `optNum` cũ).
- `components/fuel/FuelEntryEditorRow.tsx`: `FuelEntryForm` tự dựng `SideDrawer` ("Thêm/Sửa phiếu dầu"), `onSubmit` + `FormError`, một cột; sửa: footer xóa (trái) + Lưu (phải) không Hủy; thêm: Hủy + Thêm phiếu dầu.
- `components/fuel/FuelScreen.tsx`: bỏ `Modal`, render thẳng `FuelEntryForm`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, 14 kiểm tra đạt): Drawer sửa với giá trị hiện có; đổi sang chưa thanh toán → ô ngày thanh toán trống, DB `paymentDate` null; thêm: ngày đổ mặc định ngày 1 tháng đang xem, thiếu xe → banner và giữ dữ liệu, thiếu số tiền bị chặn (thuộc tính `required` của trình duyệt), thêm đủ lưu `paid`/`source=manual`; mở lại form trống; Esc đóng; xóa; 390px không tràn.
- Chưa kiểm bằng trình duyệt: tài khoản chỉ-xem (dòng bảng chỉ bấm được khi `canEdit`, đã đọc code).
