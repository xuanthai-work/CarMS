# TASK-058: Sổ Chi Phí — Thêm Trường Nguồn/Xe Và Tổng Chưa Chi

## 1. Thông Tin Chung
- **Mã Task**: TASK-058
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Finance / Chi phí
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Chuẩn bị gộp Tiền dầu + Chi phí khác vào trang Tổng chi phí (TASK-059): dòng sổ cần biết nguồn để mở đúng drawer sửa, lọc theo xe, và có tổng "chưa chi".

## 3. Thay Đổi Theo File
- `utils/costLedger.ts`: `CostLine` thêm `kind` (`fuel|expense|trip|salary`), `refId`, `vehicleId` (chỉ dòng dầu); `CostLedger` thêm `unpaid` (tổng dòng có `paid === false`). Các trường cũ giữ nguyên.
- `utils/costLedger.test.ts`: thêm 2 test (kind/refId/vehicleId đúng nguồn; `unpaid` chỉ gồm dầu + chi phí khác chưa chi trong tháng) và kiểm `unpaid = 0` ở tháng trống.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (165), `npm run build` đạt.
- QA: đọc diff đối chiếu spec; bất biến `ledger.total === buildMonthFinance().totalCost` vẫn đạt. Không có giao diện nên không cần trình duyệt.
