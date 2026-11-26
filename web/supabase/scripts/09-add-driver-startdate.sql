-- Thêm cột ngày vào làm cho Driver (tính lương theo ngày công).
-- Chạy SAU khi code mới đã deploy. Có thể chạy lại an toàn.

ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "startDate" TEXT;
