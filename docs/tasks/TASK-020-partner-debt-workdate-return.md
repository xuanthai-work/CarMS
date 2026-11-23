# TASK-020: Công Nợ Đối Tác Tính Theo Ngày Về

## 1. Thông Tin Chung
- **Mã Task**: TASK-020
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Partner Debt / Operational Finance
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Chi phí thuê đối tác của chuyến nằm ở tháng ngày về (`revenueMonthKey`), nhưng `PartnerDebt.workDate` lấy ngày đi. Chuyến khứ hồi qua tháng (đi 30/09, về 02/10) làm trang Công nợ và Doanh thu lệch tháng. Quyết định của User: công nợ nằm ở tháng ngày về; một chiều dùng ngày đi.

## 3. Thay Đổi Theo File
- `web/src/utils/trips.ts`: thêm `tripFinishDate(outboundDate, returnDate)`.
- `web/src/utils/trips.test.ts`: 3 ca (một chiều, khứ hồi, khứ hồi qua tháng).
- `web/src/api/trips.ts`: `syncPartnerDebt` nhận `workDate` = `tripFinishDate(...)`; logic khác giữ nguyên.
- `web/prisma/schema.prisma`: chỉ sửa comment `PartnerDebt.workDate` (không cần `db:push`).
- `web/docs/backfill-partner-debt-workdate.sql`: script User tự chạy để sửa dữ liệu cũ (preview, UPDATE, kiểm sau).

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx tsc --noEmit`: 0 lỗi.
- `npm test`: 10/10 files, 84/84 tests pass.
- `npm run build`: thành công.
- QA: đọc diff, đối chiếu 7/7 Acceptance Criteria; không có file ngoài phạm vi. `DebtScreen.tsx` không sửa (nhãn "Ngày chạy" trung tính). Không chạy lại gate vì không có code mới.

## 5. Việc User cần làm
- Chạy `web/docs/backfill-partner-debt-workdate.sql` trên Supabase SQL Editor (xem trước bước 1, rồi bước 2, kiểm bước 3 kỳ vọng 0). Chưa chạy khi commit.
