# TASK-030: Bộ Script SQL Kiểm Tra Và Đồng Bộ Production

## 1. Thông Tin Chung
- **Mã Task**: TASK-030
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Database / Security / Tooling
- **Trạng thái**:  **Đã xong (QA AUDIT PASS sau 1 lần FAIL)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User lâu không đụng dự án và không còn nhớ phần nào đã chạy trên production. Cần bộ script SQL an toàn để (a) xem hiện trạng, (b) đồng bộ schema, (c) sửa dữ liệu cũ. User chạy tay trên Supabase SQL Editor; mọi SQL đặt trong `web/supabase/scripts/` (không dùng `migrations/` vì CLI tự chạy). Phát hiện bảo mật: `realtime-setup.mjs` bỏ sót `OtherExpense` và `PartnerDebt` nên hai bảng này có thể không bật RLS.

## 3. Thay Đổi Theo File
- `web/supabase/scripts/01-audit-readonly.sql`: 26 khối chỉ `SELECT`, chạy từng khối (bôi đen rồi Run selected); mọi khối trả tối đa 100 dòng (gom bằng `string_agg`/`LIMIT`).
- `web/supabase/scripts/02-sync-schema.sql`: `ADD COLUMN IF NOT EXISTS "endDate"` cho `Driver`/`OfficeStaff` và `ENABLE ROW LEVEL SECURITY` cho cả 9 bảng; không DROP/UPDATE/DELETE/policy; có 2 khối kiểm tra lại.
- `web/supabase/scripts/03-backfill-partner-debt-workdate.sql`: chuyển từ `web/docs/`; bước ghi bọc trong `/* ... */`, chỉ mở sau khi xem bước 1 và sao lưu.
- `web/supabase/scripts/04-cleanup-duplicate-trips.sql`: chuyển từ `web/docs/`; bước DELETE bọc `/* ... */`.
- `web/supabase/scripts/README.md`: thứ tự chạy, sao lưu, xử lý sự cố, khuyến nghị chạy thử trên Studio local.
- `web/prisma/realtime-setup.mjs`: thêm `OtherExpense`, `PartnerDebt` vào `PRIVATE_TABLES`.
- Xóa `web/docs/backfill-partner-debt-workdate.sql` và `web/docs/cleanup-duplicate-trips.sql` (đã chuyển).

## 4. Kết Quả Kiểm Tra
- QA lần 1 FAIL vì cách dùng chưa an toàn: Supabase SQL Editor chỉ hiện kết quả câu cuối, bước ghi nằm chung file với bước xem trước, README thiếu chỉ dẫn chạy thử local và hoàn tác.
- Chạy thử thật khối 1 trên Studio local lộ thêm lỗi: Studio giới hạn 100 dòng, khối cột bị cắt. Đã sửa bằng gom theo bảng.
- QA lần 2: đọc lại toàn bộ SQL; không còn `BEGIN READ ONLY` bao ngoài; `grep` từ khóa ghi trên `01` và `02` ngoài dòng comment: rỗng; mọi khối có giới hạn dòng; README đúng hướng dẫn.
- Dev báo `npx tsc --noEmit` sạch và `npm test` 100/100 pass.
- User đã chạy các khối 1, 2, 4, 5, 6 trên Studio local. Kết quả: `endDate` có ở cả hai bảng, `Trip.fuelCost` đã bỏ; **`OtherExpense` và `PartnerDebt` có `rls_enabled = false`** (xác nhận lỗ hổng RLS), role `anon` có đủ quyền INSERT/UPDATE/DELETE/TRUNCATE trên cả 9 bảng (mặc định Supabase); local có Vehicle 8, Driver 17, Trip 50, OfficeStaff 1, PartnerDebt 1.

## 5. Việc User cần làm
- Chạy `01` từng khối trên **production** và gửi kết quả cho BA.
- Sao lưu production, sau đó chạy `02`, rồi `03` theo hướng dẫn trong `README.md`.
- Chưa chạy gì trên production tại thời điểm commit.
