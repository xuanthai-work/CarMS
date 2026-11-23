# TASK-031: Màn Doanh Thu Tính Lương Cho Mọi Tháng

## 1. Thông Tin Chung
- **Mã Task**: TASK-031
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Operational Finance / Salary
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Lỗi xác nhận bằng dữ liệu thật trên DB local: màn Doanh thu hiện chi phí lương = 0 ở các tháng không thuộc tập {tháng hiện tại, tháng có dòng SalaryMonth, tháng có phiếu công}, làm lợi nhuận cao hơn thực tế (tháng 7: đúng 162,3 tr, màn hiện 198,3 tr; tháng 10: đúng -19 tr, màn hiện +4 tr). Đây là lỗi luồng dữ liệu, không phải công thức lương; task không đổi công thức nào.

## 3. Thay Đổi Theo File
- `web/src/utils/format.ts` + `format.test.ts`: `monthsBetween(from, to)` (tối đa 240 tháng) + 5 test.
- `web/src/utils/salary.ts` + `salary.test.ts`: `salaryCostByMonth(office, drivers, months, payouts, monthKeys)` dùng đúng đường tính của trang Lương + 6 test hồi quy.
- `web/src/app/(main)/doanh-thu/page.tsx`: gom mọi tháng có hoạt động (chuyến, dầu, chi phí khác, dòng lương, phiếu công, tháng hiện tại), tính lương cho từng tháng trong khoảng `[min, max]`.

## 4. Kết Quả Verification Gates
- Dev: `npm test` 12/12 files, 111/111 pass; `tsc --noEmit --noUnusedLocals` sạch; build thành công.
- QA: đọc diff; công thức lương và `buildMonthFinance` không bị sửa. QA chạy lại phép đối chiếu app với SQL độc lập trên DB local (dữ liệu QA) cho 5 tháng 7 đến 11/2026: khớp mọi chỉ số; lương màn Doanh thu bằng trang Lương bằng SQL ở mọi tháng (tháng 7: 36.000.000; tháng 10: 23.000.000, lợi nhuận tháng 10 = -19.000.000).

## 5. Ghi Chú
- Tháng ngoài khoảng có hoạt động vẫn hiện lương 0 (không có doanh thu hay chi phí nào).
- Chưa xét ngày vào làm (`startDate`) khi tính lương; User quyết phần lương sau.
