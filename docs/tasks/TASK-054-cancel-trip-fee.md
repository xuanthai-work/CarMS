# TASK-054: Hủy Chuyến Có Phí Hủy (Giai Đoạn 3, Phần 1: Dữ Liệu + Logic Tiền)

## 1. Thông Tin Chung
- **Mã Task**: TASK-054
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Revenue / Trips (có đổi Prisma schema)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt giai đoạn 3: không làm thu tiền nhiều đợt; làm hủy chuyến có phí hủy. Chuyến hủy không tính giá chuyến, doanh thu = phí hủy; cọc vượt phí thì hoàn phần dư; chi phí đã phát sinh vẫn tính; tháng ghi nhận theo quy tắc cũ.

## 3. Thay Đổi Theo File
- `prisma/schema.prisma`: `Trip.cancelFee Float?`. `types/index.ts`, `services/trips.ts`: thêm `cancelFee`, status `"cancelled"`.
- `utils/trips.ts`: `TRIP_STATUSES` thêm "Đã hủy" (xám).
- `api/trips.ts`: `cancelFee` chỉ ghi khi status cancelled (mặc định 0), ngược lại null.
- `utils/revenue.ts`: `tripMoney` nhánh cancelled (recognized = phí hủy, collected = min(cọc, phí), outstanding, `refund` = cọc − phí nếu dương, cost/profit); nhánh chuyến thường giữ nguyên văn, `refund = 0`.
- `components/schedule/TripForm.tsx`: ô "Phí hủy" + chú thích khi chọn "Đã hủy".
- `components/revenue/RevenueScreen.tsx`: lọc "Còn nợ" xử lý chuyến hủy theo `outstanding > 0`.
- `supabase/scripts/06-add-trip-cancelfee.sql` và `README.md`: script production.
- Test (Dev khai): `utils/revenue.test.ts` (+7 ca), `utils/finance-system.test.ts`, `services/systemTools.test.ts` (thêm `cancelFee: null` vào helper).

## 4. Kết Quả Kiểm Chứng
- Dev: `prisma generate`, `tsc --noEmit --noUnusedLocals`, `npm test` (155), `npm run build` đạt.
- QA: `db:push` local thêm cột; Playwright sửa chuyến `qa-t2` (giá 2.000.000, cọc 500.000, đối tác 400.000) sang "Đã hủy", phí 200.000: ô Phí hủy hiện khi chọn Đã hủy; DB lưu `cancelFee=200000`, status cancelled; màn Doanh thu tháng 8: doanh thu 3.200.000 (3.000.000 + phí hủy 200.000), dòng chuyến hủy hiện giá 200.000, cọc 500.000, chi phí 400.000, còn phải thu "—", không nằm trong lọc "Còn nợ"; thẻ trên lịch có nền xám.
- Chưa kiểm: hiển thị số tiền hoàn (`refund`) trên UI (spec chưa yêu cầu), tài khoản chỉ-xem.

## 5. Việc User cần làm
- **Production**: sau khi deploy, chạy tay `web/supabase/scripts/06-add-trip-cancelfee.sql` (nên cùng đợt với `05`).

## 6. Tồn đọng (chuyển TASK-055)
Dropdown trạng thái ở màn Doanh thu (`StatusSelect` + `setTripStatus`) cho chọn "Đã hủy" nhưng không có ô phí hủy; và đổi chuyến khỏi trạng thái hủy không xóa `cancelFee` cũ.
