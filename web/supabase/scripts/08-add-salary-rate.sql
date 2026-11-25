-- Thêm bảng SalaryRate (mức lương cơ bản có ngày hiệu lực + lịch sử).
-- Chạy SAU khi code mới đã deploy. Có thể chạy lại an toàn.

CREATE TABLE IF NOT EXISTS "SalaryRate" (
  "id"            TEXT NOT NULL,
  "personType"    TEXT NOT NULL,
  "personId"      TEXT NOT NULL,
  "effectiveFrom" TEXT NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SalaryRate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SalaryRate_personType_personId_effectiveFrom_idx"
  ON "SalaryRate"("personType", "personId", "effectiveFrom");

ALTER TABLE "SalaryRate" ENABLE ROW LEVEL SECURITY;
