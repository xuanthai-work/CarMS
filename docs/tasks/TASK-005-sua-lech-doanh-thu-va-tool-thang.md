# TASK-005: Sửa Lỗi Lệch Doanh Thu (Double Counting) & Bổ Sung Tool Tổng Hợp Tháng

- **Ngày khởi tạo:** 2026-10-07
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Financial & Analytics Engine

## 1. Bối cảnh & Vấn đề phát hiện
- **Sự cố:** Trợ lý Meow báo cáo số liệu doanh thu tháng 9/2026 lệch nghiêm trọng so với màn hình **Tài chính vận hành / Doanh thu** của CarMS:
  - Giao diện thực tế CarMS: **114.300.000 đ** (49 chuyến).
  - Meow trả lời trong Chat: **148.800.000 đ** (60 chuyến).
- **Nguyên nhân gốc rễ (Root Cause):**
  1. **Lỗi đếm trùng chuyến nhiều ngày (Double Counting):** Tool `get_daily_summary` dùng query `{ OR: [{ outboundDate: targetDate }, { returnDate: targetDate }] }`. Khi AI tự cộng từng ngày trong tháng, chuyến tour 2 chiều có ngày đi và ngày về khác nhau bị tính lặp lại 2 lần.
  2. **Vi phạm chuẩn hạch toán CarMS:** Theo [revenue.ts](file:///D:/work/Linh/CarMS/web/src/utils/revenue.ts), doanh thu chỉ được ghi nhận vào ngày kết thúc chuyến (`returnDate ?? outboundDate`). Chuyến đang chạy dở dang không ghi nhận doanh thu vào ngày xuất phát.
  3. **Thiếu tool cấp tháng:** AI chưa có tool tổng hợp tháng (`get_monthly_finance`), buộc phải tự truy vấn ngày rồi cộng dồn dẫn đến sai lệch.
  4. **Sai lệch chỉ số thanh toán & chi phí:** Số liệu "Đã thanh toán" trên màn hình Doanh thu là `paidTotal` (chỉ tính chuyến `completed_paid`), và tổng chi phí tháng bao gồm cả chi phí lương nhân viên/tài xế (`salaryCost`).

## 2. Kế hoạch giải pháp & Yêu cầu kỹ thuật
- **Bước 1 - Sửa `getDailySummaryTool`:**
  - Tách bạch: Vận hành (chạy trên đường) vs Doanh thu (chỉ ghi nhận vào ngày hoàn tất `returnDate ?? outboundDate === targetDate`).
- **Bước 2 - Bổ sung `getMonthlyFinanceTool` (`get_monthly_finance`):**
  - Nhận tham số `monthKey` (`YYYY-MM`).
  - Gọi trực tiếp `buildMonthFinance(trips, monthKey, fuelTotal, salaryCost)` từ [revenue.ts](file:///D:/work/Linh/CarMS/web/src/utils/revenue.ts) để đồng bộ tuyệt đối với màn hình Doanh thu.
  - Trả về đủ 6 chỉ số: Doanh thu ghi nhận, Đã thanh toán, Còn phải thu, Chi phí, Lợi nhuận, Số chuyến hoàn tất.
- **Bước 3 - Cập nhật `systemPrompt.ts`:**
  - Bổ sung chỉ dẫn: Mọi câu hỏi về doanh thu tháng/tháng này/tháng cụ thể BẮT BUỘC gọi `get_monthly_finance`.
- **Bước 4 - Cập nhật Unit Test:**
  - Test kiểm tra chống double-counting trong `getDailySummaryTool`.
  - Test kiểm tra kết quả `getMonthlyFinanceTool` khớp với `buildMonthFinance`.

## 3. File tác động thực tế
- `web/src/services/systemTools.ts`: Sửa logic ngày hoàn tất cho `getDailySummaryTool`, thêm `getMonthlyFinanceTool` và xuất vào `systemReadTools()`.
- `web/src/services/systemTools.test.ts`: Bổ sung 2 test case mới kiểm thử chống double-counting và đối soát 6 chỉ số tài chính tháng.
- `web/src/configs/systemPrompt.ts`: Bổ sung quy tắc ưu tiên gọi `get_monthly_finance` khi hỏi về tháng.

## 4. Kết quả Verification Gates (Audited)
- `npx tsc --noEmit`: **PASS** (0 lỗi TypeScript).
- `npm test`: **PASS** (10/10 test files, 66/66 unit tests passed).
- `npm run build`: **PASS** (18/18 routes biên dịch production thành công trong 10.6s).
