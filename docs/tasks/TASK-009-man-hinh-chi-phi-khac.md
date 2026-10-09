# TASK-009: Xây Dựng Màn Hình "Chi Phí Khác" (Quản Lý Chi Phí Độc Lập) & Cập Nhật Form Chuyến

- **Ngày khởi tạo:** 2026-10-09
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** Operational Finance / Core System

---

## 1. Mục tiêu & Yêu cầu nghiệp vụ
1. **Màn hình Chi phí khác (`/chi-phi-khac`)**:
   - Vị trí: Hiển thị ngay dưới menu **Tiền dầu** trên Sidebar.
   - Cơ chế: Quản lý các khoản chi phí phát sinh độc lập của công ty (bảo dưỡng, sửa xe, rửa xe, cầu đường/VETC, bến bãi, phạt/bảo hiểm, chi phí khác...), tồn tại độc lập và không gán cứng vào bất kỳ xe hay chuyến nào.
   - Tính năng: Điều hướng theo tháng (`MonthNav`), thẻ chỉ số tài chính (Tổng chi, Đã chi, Chưa chi, Số khoản chi), lọc theo trạng thái thanh toán và phân loại, tìm kiếm tiếng Việt không dấu (`normalizeVn`), thêm/sửa/xoá khoản chi.
2. **Cập nhật Form Chuyến ([TripForm.tsx](file:///D:/work/Linh/CarMS/web/src/components/schedule/TripForm.tsx))**:
   - Loại bỏ trường `VETC / Cầu đường` (`tollCost`) và `Chi phí khác` (`otherCost`) khỏi giao diện thêm/sửa chuyến.
   - Giữ lại `Tiền thuê đối tác` (`partnerCost`) khi sử dụng xe ngoài.
   - Bảo toàn dữ liệu lịch sử các chuyến cũ trong [trips.ts](file:///D:/work/Linh/CarMS/web/src/api/trips.ts).

---

## 2. Danh sách file thay đổi & tạo mới

### Các file tạo mới:
- `web/src/types/index.ts`: Thêm kiểu `OtherExpensePaymentStatus`, `OtherExpenseCategory`, `OtherExpense`.
- `web/src/utils/expenses.ts`: Định nghĩa danh mục chi phí `OTHER_EXPENSE_CATEGORIES`, màu sắc badge và hàm helper `otherExpenseCategoryMeta`.
- `web/src/services/expenses.ts`: Cung cấp hàm `getOtherExpenses` và `getOtherExpenseMonthTotals`.
- `web/src/api/expenses.ts`: Server Actions `saveOtherExpense`, `deleteOtherExpense` (bảo vệ bởi `requireEditor()`).
- `web/src/components/expenses/ExpenseScreen.tsx`: Giao diện chính quản lý chi phí khác với bộ lọc, bảng dữ liệu và thẻ thống kê.
- `web/src/components/expenses/ExpenseModal.tsx`: Modal thêm và chỉnh sửa khoản chi.
- `web/src/app/(main)/chi-phi-khac/page.tsx`: Server Component trang Chi phí khác.

### Các file sửa đổi:
- `web/prisma/schema.prisma`: Thêm model `OtherExpense` kèm index trên `date` và `paymentStatus`.
- `web/src/components/layout/Sidebar.tsx`: Thêm icon `ReceiptIcon` và liên kết `/chi-phi-khac` dưới `Tiền dầu`.
- `web/src/components/schedule/TripForm.tsx`: Loại bỏ 2 ô nhập chi phí `tollCost` và `otherCost`.
- `web/src/api/trips.ts`: Điều chỉnh cập nhật linh hoạt, không xóa đè trường chi phí của chuyến cũ.
- `web/src/api/revalidate.ts`: Bổ sung `revalidatePath("/chi-phi-khac")` vào `revalidateAll()`.

---

## 3. Kết quả Verification Gates (Audited)

- **TypeScript Typecheck (`npx tsc --noEmit`)**: **PASS** (0 lỗi).
- **Unit Test Suite (`npm test` / Vitest)**: **PASS** (10/10 test files, 77/77 tests passed).
- **Production Build (`npm run build`)**: **PASS** (19/19 routes biên dịch thành công, bao gồm dynamic route `/chi-phi-khac`).
