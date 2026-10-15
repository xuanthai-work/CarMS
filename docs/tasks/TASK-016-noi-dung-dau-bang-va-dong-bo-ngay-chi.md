# TASK-016: Đưa "Nội Dung" Lên Cột Đầu Tiên & Gộp Ngày Chi / Người Chi Trên Màn Hình Chi Phí Khác (`/chi-phi-khac`)

## 1. Mục tiêu & Yêu cầu nghiệp vụ
- **Mục tiêu**: Tối ưu hóa cấu trúc bảng Chi phí khác (`/chi-phi-khac`) bằng cách đưa cột "Nội dung" lên làm cột đầu tiên và gộp thông tin ngày chi/thanh toán cùng người chi vào một cột 2 dòng đồng bộ với phong cách trang Công nợ.
- **Yêu cầu chi tiết**:
  - Cột 1: "Nội dung" (cột sticky bên trái, font in đậm) giúp người dùng nhận diện ngay khoản chi.
  - Cột 5: "Ngày chi" hiển thị 2 dòng:
    - Dòng trên: Ngày chi thực tế (`fmtDate(paymentDate || date)`).
    - Dòng dưới: Người chi tiền (`payerName` màu xám nhạt).
    - Nếu chưa chi (`unpaid`): Hiển thị dấu gạch ngang `—`.
  - Giảm bảng từ 7 cột xuống còn 6 cột cân đối, không xuất hiện thanh cuộn ngang thừa.

## 2. Các thay đổi kỹ thuật
1. **`web/src/components/expenses/ExpenseScreen.tsx`**:
   - Chia lại tỷ lệ 6 cột (`ExpenseColgroup`):
     - `Nội dung`: 24%
     - `Phân loại`: 15%
     - `Số tiền`: 14%
     - `Trạng thái`: 12%
     - `Ngày chi`: 14%
     - `Ghi chú`: 21%
   - Cập nhật thead: Cột 1 là `Nội dung`, Cột 5 là `Ngày chi`.
   - Cập nhật tbody:
     - Ô cột 1 cố định bên trái (sticky), hiển thị `entry.title` in đậm (`text-[15px] font-bold text-slate-900`) kèm `title` và `truncate`.
     - Ô cột 5 ("Ngày chi") hiển thị ngày chi ở trên, người chi ở dưới khi `entry.paymentStatus === "paid"`, hoặc hiển thị `—` khi chưa chi.
2. **`web/src/components/debts/DebtScreen.tsx`**:
   - Đồng bộ tiêu đề cột thanh toán thành "Ngày trả" ngắn gọn theo đúng ý định của người dùng.

## 3. Kết quả QA Verification
- **TypeScript**: `npx tsc --noEmit` đạt 0 lỗi (PASS).
- **Test Suite**: `npm test` (`vitest run`) đạt 10/10 test files, 79/79 tests passed (PASS).
- **Trải nghiệm UI/UX**:
  - Bảng 6 cột hiển thị thoáng đãng, cân đối, không bị scroll ngang thừa.
  - Cột cố định "Nội dung" giúp tra cứu nhanh chóng và trực quan.
