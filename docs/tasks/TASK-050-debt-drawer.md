# TASK-050: Cập Nhật Thanh Toán Công Nợ Đối Tác Bằng SideDrawer (Phase 6, Màn Công Nợ)

## 1. Thông Tin Chung
- **Mã Task**: TASK-050
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Debts / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Cập nhật thanh toán công nợ dùng Modal + form `action=`; `updatePartnerDebt` ném lỗi thô và âm thầm ghi `paymentDate = null` cho khoản đã trả. Công nợ sinh từ chuyến nên chỉ có sửa, không thêm/xóa.

## 3. Thay Đổi Theo File
- `api/debts.ts`: `updatePartnerDebt` trả `ActionResult` ("Không tìm thấy khoản công nợ.", "Vui lòng chọn ngày trả." khi đã trả mà thiếu ngày, "Không lưu được. Vui lòng thử lại." khi DB lỗi).
- `components/debts/DebtPayModal.tsx`: tự dựng `SideDrawer` "Cập nhật thanh toán công nợ", `onSubmit` + `noValidate` + `FormError`, một cột, giữ khối tóm tắt; footer chỉ có Lưu.
- `components/debts/DebtScreen.tsx`: bỏ `Modal`, render thẳng `DebtPayModal`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA (Playwright, tài khoản `qa-claude@carms.local`): Drawer mở khi bấm dòng; đổi Chưa trả → Đã trả, lưu, DB `paid` + `paymentDate` 2026-11-25; ô thống kê đổi; mở lại hiện trạng thái mới; Esc đóng; 390px không tràn.
- Chưa kiểm bằng trình duyệt: banner "Vui lòng chọn ngày trả." (nhánh khó tái hiện vì DatePicker mặc định hôm nay), đổi ngược về Chưa trả, tài khoản chỉ-xem. DB local chỉ có 1 khoản công nợ.
