# TASK-019: Đồng Bộ Số Liệu Tài Chính Của Trợ Lý AI Với Màn Doanh Thu

## 1. Thông Tin Chung
- **Mã Task**: TASK-019
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: AI Assistant / Operational Finance
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
- Tool `getMonthlyFinanceTool` không cộng "Chi phí khác" nên lợi nhuận AI báo cao hơn màn Doanh thu đúng bằng khoản đó.
- Nhãn "Số chuyến hoàn tất" (tool tháng) và "Lợi nhuận tạm tính" (tool ngày) gây hiểu nhầm; comment "khớp 100%" sai.
- `monthProfit` là đường tính lợi nhuận thứ hai, không ai dùng; `tripOtherCost` tên sai vì đã gồm `partnerCost`.

## 3. Thay Đổi Theo File
- `web/src/services/systemTools.ts`: tool tháng gọi `getOtherExpenseMonthTotals` và truyền `otherExpenseTotal` vào `buildMonthFinance`; thêm dòng "Chi phí khác"; đổi nhãn mục 6 thành "Số chuyến ghi nhận doanh thu trong tháng"; tool ngày đổi nhãn lợi nhuận tạm tính (công thức giữ nguyên); sửa comment.
- `web/src/utils/revenue.ts`: xóa `monthProfit`; đổi `tripOtherCost` → `tripCost` (công thức không đổi).
- `web/src/services/systemTools.test.ts`: mock `otherExpense`; test cộng chi phí khác (tổng chi phí 4.5M, lợi nhuận -1.5M); test đối chiếu với `buildMonthFinance`.

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx tsc --noEmit`: 0 lỗi.
- `npm test`: 10/10 files, 81/81 tests pass.
- `npm run build`: thành công.
- QA: đọc diff, đối chiếu 7/7 Acceptance Criteria; không có file ngoài phạm vi; tool vẫn chỉ đọc. Không chạy lại gate vì không có code mới sau Dev.

## 5. Ghi Chú
- Không đổi schema, không đổi env, không đụng `buildMonthFinance`/`salary.ts`.
- Status `"completed"`/`"cancelled"` ở tool ngày giữ nguyên (tương thích dữ liệu cũ).
