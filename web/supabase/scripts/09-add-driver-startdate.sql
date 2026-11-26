-- Thêm cột ngày vào làm cho Driver (tính lương theo ngày công).
-- Chạy TRƯỚC khi deploy code mới. Có thể chạy lại an toàn.

ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "startDate" TEXT;
