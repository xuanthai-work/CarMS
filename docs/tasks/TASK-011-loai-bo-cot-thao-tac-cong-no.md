# TASK-011: Loại Bỏ Cột "Thao Tác" Thừa Trên Màn Hình Công Nợ Đối Tác

- **Ngày khởi tạo:** 2026-10-15
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** Operational Finance / Frontend UI Refinement

---

## 1. Mục tiêu & Yêu cầu
- **Vấn đề**: Cột "Thao tác" ở cuối bảng công nợ chứa các nút "Thanh toán" và "Sửa" bị trùng lặp chức năng với thao tác click trực tiếp vào dòng (cùng mở `DebtPayModal`), làm chiếm dụng diện tích bảng một cách không cần thiết.
- **Yêu cầu**:
  - Giữ nguyên toàn bộ logic hiện tại (bấm vào dòng vẫn mở modal xem/cập nhật thông tin thanh toán như cũ).
  - Loại bỏ hoàn toàn cột "Thao tác" (cột thứ 8) khỏi `<colgroup>`, `<thead>` và `<tbody>`.
  - Phân bổ lại tỷ lệ độ rộng 7 cột còn lại để bảng thoáng đẹp, hiển thị rõ ràng thông tin lộ trình và khách hàng.

---

## 2. File thay đổi thực tế
- `web/src/components/debts/DebtScreen.tsx`:
  - Cập nhật `DebtColgroup` từ 8 cột về 7 cột (12%, 13%, 18%, 22%, 13%, 10%, 12%).
  - Xóa `<th>Thao tác</th>` ở `<thead>`.
  - Xóa `<td>` chứa nút bấm ở `<tbody>`.
  - Giữ nguyên sự kiện `onClick` trên `<tr>` mở modal thanh toán.

---

## 3. Kết quả Verification Gates (Audited)
- **TypeScript Typecheck (`npx tsc --noEmit`)**: **PASS** (0 lỗi).
- **Unit Test Suite (`npm test` / Vitest)**: **PASS** (10/10 test files, 77/77 tests passed).
