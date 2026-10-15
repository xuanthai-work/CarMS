# TASK-012: Đồng Bộ Dropdown Chọn Trạng Thái Thanh Toán Giống Màn Tiền Dầu Cho Chi Phí Khác & Công Nợ

- **Ngày khởi tạo:** 2026-10-15
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** Operational Finance / Frontend UI Refinement

---

## 1. Mục tiêu & Yêu cầu
- **Vấn đề**: Trong modal của **Chi phí khác** (`ExpenseModal.tsx`) và **Công nợ** (`DebtPayModal.tsx`), dropdown trạng thái thanh toán dùng component `SelectMenu` thông thường, không đồng bộ với phong cách giao diện dạng chip màu tương tác của `FuelPaymentStatusSelect` ở màn **Tiền dầu** (`/tien-dau`).
- **Giải pháp**:
  - Mở rộng `FuelPaymentStatusSelect` hỗ trợ tùy chỉnh nhãn hiển thị qua `paidLabel` và `unpaidLabel`.
  - Thay thế `SelectMenu` trong `ExpenseModal` và `DebtPayModal` bằng `FuelPaymentStatusSelect`.
  - Giữ trọn vẹn kiểu dáng chip màu (Xanh `emerald` khi Đã trả/Đã chi, Vàng cam `amber` khi Chưa trả/Chưa chi), hiệu ứng chuyển động và chấm màu nhận diện (`swatch`).

---

## 2. File thay đổi thực tế
- `web/src/components/fuel/FuelPaymentStatusSelect.tsx`:
  - Thêm props `paidLabel?: string` (mặc định: "Đã thanh toán") và `unpaidLabel?: string` (mặc định: "Chưa thanh toán").
- `web/src/components/expenses/ExpenseModal.tsx`:
  - Thay thế `SelectMenu` bằng `FuelPaymentStatusSelect` với `paidLabel="Đã chi"` và `unpaidLabel="Chưa chi"`.
  - Xóa mảng hằng số `PAYMENT_OPTIONS` thừa.
- `web/src/components/debts/DebtPayModal.tsx`:
  - Thay thế `SelectMenu` bằng `FuelPaymentStatusSelect` với `paidLabel="Đã trả"` và `unpaidLabel="Chưa trả"`.
  - Xóa mảng hằng số `PAYMENT_OPTIONS` thừa.

---

## 3. Kết quả Verification Gates (Audited)
- **TypeScript Typecheck (`npx tsc --noEmit`)**: **PASS** (0 lỗi).
- **Unit Test Suite (`npm test` / Vitest)**: **PASS** (10/10 test files, 77/77 tests passed).
