# TASK-015: Tích Hợp Chi Phí Khác Vào Tổng Chi Phí & Lợi Nhuận Trang Doanh Thu (`/doanh-thu`)

## 1. Mục tiêu & Yêu cầu nghiệp vụ
- **Mục tiêu**: Mount dữ liệu các khoản chi độc lập từ bảng `OtherExpense` (trang Chi phí khác `/chi-phi-khac`) vào trang Doanh thu (`/doanh-thu`).
- **Yêu cầu chi tiết**:
  - Dòng "Chi phí khác" trong modal "Chi tiết tổng chi phí tháng" trên trang Doanh thu hiển thị đúng tổng số tiền chi phí phát sinh từ trang `/chi-phi-khac` trong tháng đang chọn (đồng thời bảo toàn dữ liệu `tollCost`/`otherCost` của các chuyến cũ nếu có).
  - Tự động cộng vào "Tổng chi phí tháng" và tính lại "Lợi nhuận" chuẩn xác.
  - Chuyển tháng bằng `MonthNav` cập nhật tức thời theo tháng tương ứng.

## 2. Các thay đổi kỹ thuật
1. **`web/src/services/expenses.ts`**:
   - Thêm hàm `getOtherExpenseMonthMap(): Promise<Map<string, number>>` thực hiện 1 query duy nhất để gom tổng chi phí theo từng tháng (`YYYY-MM`).
2. **`web/src/app/(main)/doanh-thu/page.tsx`**:
   - Nạp `getOtherExpenseMonthMap()` đồng thời trong `Promise.all` phía Server Component.
   - Truyền `otherExpenseTotalsByMonth={Object.fromEntries(otherExpenseMonthMap)}` vào `<RevenueScreen />`.
3. **`web/src/utils/revenue.ts`**:
   - Cập nhật hàm `buildMonthFinance(trips, monthKey, fuelTotal, salaryCost, otherExpenseTotal = 0)`:
     - `otherCostTotal = tripCosts.other + otherExpenseTotal`
     - `totalCost = tripCosts.partner + otherCostTotal + fuelTotal + salaryCost`
     - `profit = summary.recognized - totalCost`
4. **`web/src/components/revenue/RevenueScreen.tsx`**:
   - Lấy `otherExpenseTotal = otherExpenseTotalsByMonth[monthKey] ?? 0` và truyền vào `buildMonthFinance`.
   - Hiển thị `otherCostTotal` tại dòng "Chi phí khác" trong modal "Chi tiết tổng chi phí tháng".
5. **`web/src/utils/revenue.test.ts`**:
   - Bổ sung 2 unit test kiểm chứng logic tính toán chi phí khác và lợi nhuận khi có dữ liệu từ trang Chi phí khác.

## 3. Kết quả QA Verification
- **TypeScript**: `npx tsc --noEmit` đạt 0 lỗi (PASS).
- **Test Suite**: `npm test` (`vitest run`) đạt 10/10 test files, 79/79 tests passed (PASS).
- **Tính toán tài chính**:
  - Dòng "Chi phí khác" trong modal hiển thị đúng số tiền từ trang Chi phí khác.
  - "Tổng chi phí tháng" và "Lợi nhuận" trên dashboard và modal khớp nhau 100%.
