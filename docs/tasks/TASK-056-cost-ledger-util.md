# TASK-056: Hàm Gom Sổ Chi Phí Theo Tháng (Giai Đoạn 4, Phần 1: Logic Thuần + Test)

## 1. Thông Tin Chung
- **Mã Task**: TASK-056
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Finance / Chi phí
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt giai đoạn 4: không đổi dữ liệu, chỉ gom mọi khoản chi trong tháng vào một màn tổng hợp. Task này viết hàm thuần; màn hình là TASK-057. Bất biến: tổng sổ = `buildMonthFinance(...).totalCost`.

## 3. Thay Đổi Theo File
- `utils/costLedger.ts` (mới): `buildCostLedger`, `COST_GROUPS`, type `CostGroup/CostLine/CostLedger`. 5 nhóm: xăng dầu, thuê xe đối tác, cầu đường, chi phí khác, lương. Nguồn: `FuelEntry` (theo `refuelDate`), `OtherExpense` (`toll` → cầu đường, còn lại → chi phí khác), chi phí ghi trên chuyến (lọc theo `revenueMonthKey`, gồm cả chuyến hủy), ba nhóm lương. Bỏ dòng amount ≤ 0; sắp ngày giảm dần.
- `utils/costLedger.test.ts` (mới): 6 test, gồm bất biến `ledger.total === buildMonthFinance().totalCost` với dữ liệu hỗn hợp (chuyến hủy, tháng khác, đủ 6 loại chi phí).
- Không sửa `revenue.ts`, `salary.ts`, schema.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (163), `npm run build` đạt.
- QA: đọc code đối chiếu spec và `buildMonthFinance`; không có giao diện nên chưa kiểm trình duyệt (thuộc TASK-057).
- Lưu ý: chi phí âm trên chuyến (nếu có) bị bỏ khỏi sổ nhưng `buildMonthFinance` vẫn cộng; dữ liệu thực tế không có chi phí âm.
