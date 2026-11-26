-- Thêm cột xóa mềm deletedAt cho Vehicle, Driver, OfficeStaff.
-- Chạy TRƯỚC khi deploy code mới. Có thể chạy lại an toàn.

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "OfficeStaff" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
