# TASK-027: Gom Truy Vấn Và Phép Tổng Theo Tháng Bị Lặp (Clean Code Đợt 4)

## 1. Thông Tin Chung
- **Mã Task**: TASK-027
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Code Quality / Operational Finance
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Gom ba đoạn code lặp ở tầng services, không đổi hành vi hay truy vấn gửi lên DB: (1) khoảng ngày của một tháng lặp 5 nơi; (2) tổng theo trạng thái thanh toán lặp ở dầu và chi phí khác; (3) tổng tiền theo từng tháng lặp ở hai hàm `...MonthMap`. Đây là đường tính tiền của màn Doanh thu và AI nên bắt buộc có test hồi quy.

## 3. Thay Đổi Theo File
- `web/src/utils/format.ts`: thêm `monthRange(monthKey)` → `{ gte, lt }`.
- `web/src/utils/format.test.ts` (mới): 3 test (tháng thường, qua năm, tháng 1).
- `web/src/utils/totals.ts` (mới): `PaymentTotals`, `sumByPaymentStatus`, `sumByMonth`.
- `web/src/utils/totals.test.ts` (mới): 4 test (rỗng, trộn trạng thái gồm trạng thái lạ, cộng dồn theo tháng, qua năm).
- `web/src/services/debts.ts`, `expenses.ts`, `fuel.ts`, `salary.ts`, `tools/fuel.ts`: dùng `monthRange`; `fuel.ts` và `expenses.ts` dùng `sumByPaymentStatus` và `sumByMonth`, dọn import thừa.
- `systemTools.test.ts`: không sửa (test kiểm `refuelDate: { gte, lt }` vẫn pass).

## 4. Kết Quả Verification Gates (Dev chạy)
- `vitest` 3 file liên quan: 29/29 pass.
- `npx tsc --noEmit --noUnusedLocals`: 0 lỗi.
- `npm test`: 12/12 files, 100/100 tests pass.
- `npm run build`: thành công (không có dev server chạy ngầm).
- QA: đọc diff, đối chiếu 5/5 Acceptance Criteria; chữ ký và kiểu trả về các hàm công khai không đổi, logic `reduce`/`for` được chuyển nguyên văn. Không chạy lại gate vì không có code mới.
