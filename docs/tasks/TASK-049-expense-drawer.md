# TASK-049: Thêm/Sửa Khoản Chi Khác Bằng SideDrawer (Phase 6, Màn Chi Phí Khác)

## 1. Thông Tin Chung
- **Mã Task**: TASK-049
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Expenses / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Thêm và sửa khoản chi khác dùng Modal; form dùng `action=` nên lưu lỗi làm mất dữ liệu, và `saveOtherExpense` ném lỗi thô. Chuyển sang Drawer, `ActionResult`, giữ dữ liệu khi lỗi (làm theo TASK-048).

## 3. Thay Đổi Theo File
- `api/expenses.ts`: `saveOtherExpense` trả `ActionResult` ("Vui lòng chọn ngày chi.", "Vui lòng nhập nội dung khoản chi.", "Vui lòng nhập số tiền."); số tiền = bỏ ký tự không phải số rồi `Number`. Logic `paymentDate` và `deleteOtherExpense` giữ nguyên.
- `components/expenses/ExpenseModal.tsx`: tự dựng `SideDrawer` ("Thêm/Sửa khoản chi"), `onSubmit` + `noValidate` + `FormError`, một cột; sửa: xóa (trái) + Lưu (phải) không Hủy; thêm: Hủy + Thêm khoản chi.
- `components/expenses/ExpenseScreen.tsx`: bỏ `Modal`, render thẳng `ExpenseModal`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (137), `npm run build` đạt.
- QA: đọc diff đối chiếu spec và TASK-048, không có file ngoài phạm vi, không còn caller nào khác của `saveOtherExpense`. Không chạy lại gate (không có code mới sau lần Dev chạy).
- Chưa kiểm bằng trình duyệt: Esc, 390px, lưu/sửa/xóa trên DB thật, tài khoản chỉ-xem.
