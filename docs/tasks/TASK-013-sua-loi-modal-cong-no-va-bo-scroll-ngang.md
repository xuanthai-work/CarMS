# TASK-013: Sửa Lỗi Modal Công Nợ Luôn Hiện 'Đã Trả' & Loại Bỏ Thanh Cuộn Ngang Thừa

- **Ngày khởi tạo:** 2026-10-15
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** Operational Finance / Frontend Bug Fix & Layout Refinement

---

## 1. Mục tiêu & Nguyên nhân xử lý
1. **Lỗi trạng thái trong modal công nợ luôn hiện "Đã trả" dù dòng là "Chưa trả"**:
   - *Nguyên nhân*: State `paymentStatus` trong `DebtPayModal.tsx` bị gán logic `mode === "pay" ? "paid" : debt.paymentStatus`, và `DebtScreen` luôn truyền `mode = "pay"` khi bản ghi chưa trả, làm modal tự động ép sang "Đã trả".
   - *Xử lý*: Khởi tạo `paymentStatus` luôn bằng đúng `debt.paymentStatus` của bản ghi. Chuẩn hóa tiêu đề thành "Cập nhật thanh toán công nợ" và nút lưu thành "Lưu thông tin".
2. **Lỗi thanh cuộn ngang (Scroll ngang) thừa ở đáy bảng**:
   - *Nguyên nhân*: Thẻ `<table>` ở `DebtScreen.tsx` và `ExpenseScreen.tsx` bị gán cứng `min-w-[1040px]` và `min-w-[920px]`, gây tràn khung khi duyệt web trên laptop có sidebar.
   - *Xử lý*: Loại bỏ thuộc tính `min-w`, để bảng `w-full` tự co giãn 100% theo container, triệt tiêu hoàn toàn thanh scroll ngang.

---

## 2. File thay đổi thực tế
- `web/src/components/debts/DebtPayModal.tsx`:
  - Khởi tạo `paymentStatus` chuẩn xác bằng `debt.paymentStatus`.
  - Đổi nút submit thành "Lưu thông tin", bỏ prop `mode` ép buộc.
- `web/src/components/debts/DebtScreen.tsx`:
  - Bỏ `min-w-[1040px]`, giữ `w-full table-fixed`.
  - Chuẩn hóa tiêu đề Modal thành "Cập nhật thanh toán công nợ".
- `web/src/components/expenses/ExpenseScreen.tsx`:
  - Bỏ `min-w-[920px]`, giữ `w-full table-fixed`.

---

## 3. Kết quả Verification Gates (Audited)
- **TypeScript Typecheck (`npx tsc --noEmit`)**: **PASS** (0 lỗi).
- **Unit Test Suite (`npm test` / Vitest)**: **PASS** (10/10 test files, 77/77 tests passed).
