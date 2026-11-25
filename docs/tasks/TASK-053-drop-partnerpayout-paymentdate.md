# TASK-053: Bỏ Trường "Ngày Trả" Của Phiếu Công Ngày (PartnerPayout)

## 1. Thông Tin Chung
- **Mã Task**: TASK-053
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Salary / Dọn dẹp (có đổi Prisma schema)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt phiếu công ngày không cần theo dõi ngày trả. `PartnerPayout.paymentDate` không có ô nhập nên luôn null (code chết). Xóa toàn bộ; giữ `paymentStatus` và cách tính tiền.

## 3. Thay Đổi Theo File
- `prisma/schema.prisma`, `types/index.ts`, `services/salary.ts`, `api/salary.ts`: bỏ `paymentDate` của `PartnerPayout`.
- `services/tools/salary.ts`: bỏ đoạn "(ngày trả: …)" trong công nợ tài xế đối tác (tool vẫn read-only).
- `api/salary.test.ts`, `services/systemTools.test.ts` (Dev khai): bỏ `paymentDate` khỏi mock/kỳ vọng của `PartnerPayout`.
- `supabase/scripts/05-drop-partnerpayout-paymentdate.sql` (mới) và `README.md`: script production `DROP COLUMN IF EXISTS`.
- Không đụng `paymentDate` của `PartnerDebt`, `FuelEntry`, `OtherExpense`, `paidDate` của `SalaryMonth`.

## 4. Kết Quả Kiểm Chứng
- Dev: `prisma generate`, `tsc --noEmit --noUnusedLocals`, `npm test` (148), `npm run build` đạt.
- QA: `db:push` local (được User cho phép) bỏ cột; DB local còn các cột `amount, createdAt, driverId, id, note, payerName, paymentStatus, updatedAt, workDate`; khởi động lại dev server (client Prisma cũ); Playwright: danh sách tải được, thêm/sửa/xóa phiếu công ngày đều chạy.

## 5. Việc User cần làm
- **Production**: sau khi deploy code mới, chạy tay `web/supabase/scripts/05-drop-partnerpayout-paymentdate.sql` trên Supabase SQL Editor (chạy trước deploy sẽ làm code cũ lỗi truy vấn).
