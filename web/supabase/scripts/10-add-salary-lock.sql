-- Thêm các cột chốt phiếu lương cho SalaryMonth.
-- Chạy SAU khi code mới đã deploy. Có thể chạy lại an toàn.

ALTER TABLE "SalaryMonth" ADD COLUMN IF NOT EXISTS "locked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SalaryMonth" ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP(3);
ALTER TABLE "SalaryMonth" ADD COLUMN IF NOT EXISTS "workDays" INTEGER;
ALTER TABLE "SalaryMonth" ADD COLUMN IF NOT EXISTS "earned" DOUBLE PRECISION;
ALTER TABLE "SalaryMonth" ADD COLUMN IF NOT EXISTS "advances" DOUBLE PRECISION;
