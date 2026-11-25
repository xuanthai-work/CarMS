# TASK-052: Thêm/Sửa Phiếu Công Ngày Bằng SideDrawer + Sửa Tràn Ngang Trang Lương (Phase 6, kết thúc)

## 1. Thông Tin Chung
- **Mã Task**: TASK-052
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Salary / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Tab Lương ngày dùng Modal cho thêm/sửa, form `action=`, `savePartnerPayout` ném lỗi thô. Kèm theo: trang `/luong` ở 390px rộng 397px do các ô thống kê `Tile` (lưới 2 cột, số `text-2xl` rộng 131px trong ô 99px).

## 3. Thay Đổi Theo File
- `api/salary.ts`: `savePartnerPayout` trả `ActionResult` ("Vui lòng chọn lái xe.", "Vui lòng chọn ngày làm.", "Vui lòng nhập số tiền.", "Không lưu được. Vui lòng thử lại."); bỏ `reqNum`; các trường ghi giữ nguyên (kể cả `paymentDate` luôn null vì form không gửi). `saveSalaryMonth`, `deletePartnerPayout` không đổi.
- `components/salary/PartnerPayoutTable.tsx`: `PartnerPayoutForm` tự dựng `SideDrawer` ("Thêm/Sửa phiếu trả công"), `onSubmit` + `noValidate` + `FormError`, một cột; sửa: xóa (trái) + Lưu (phải); thêm: Hủy + Thêm phiếu; bỏ `Modal`.
- `components/salary/SalaryScreen.tsx`: `Tile` thêm `min-w-0`, `truncate`, `text-xl sm:text-2xl`.
- `api/salary.test.ts` (Dev khai): thêm 6 test cho `savePartnerPayout` (tổng 11).

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (148), `npm run build` đạt.
- QA (Playwright, `qa-claude`): thêm thiếu lái xe/số tiền → banner, giữ dữ liệu; thêm đủ → bảng hiện dòng (800.000, Chưa trả); sửa điền sẵn, không có Hủy, đổi số tiền 900.000 lưu đúng; Esc đóng; 390px không tràn ở cả hai tab và khi Drawer mở (trước đó 397px); desktop Tile vẫn 24px.
- Chưa kiểm bằng trình duyệt: xóa phiếu, tài khoản chỉ-xem.
- Ghi nhận ngoài phạm vi: `PartnerPayout.paymentDate` luôn null (form không có ô ngày trả) — hành vi cũ, giữ nguyên.
