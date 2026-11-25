-- Thêm bảng SalaryAdvance (tạm ứng lương riêng theo tháng của ngày ứng).
-- Chạy SAU khi code mới đã deploy. Có thể chạy lại an toàn.

CREATE TABLE IF NOT EXISTS "SalaryAdvance" (
  "id"         TEXT NOT NULL,
  "personType" TEXT NOT NULL,
  "personId"   TEXT NOT NULL,
  "date"       TEXT NOT NULL,
  "amount"     DOUBLE PRECISION NOT NULL,
  "note"       TEXT DEFAULT '',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SalaryAdvance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SalaryAdvance_personType_personId_date_idx"
  ON "SalaryAdvance"("personType", "personId", "date");

CREATE INDEX IF NOT EXISTS "SalaryAdvance_date_idx"
  ON "SalaryAdvance"("date");

ALTER TABLE "SalaryAdvance" ENABLE ROW LEVEL SECURITY;
