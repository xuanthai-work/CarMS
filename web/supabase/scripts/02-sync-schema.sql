-- =============================================================================
-- 02-sync-schema.sql
-- Đồng bộ schema Production: thêm cột endDate và bật Row Level Security (RLS).
--
-- CHÚ Ý:
-- 1. Chỉ chạy script này SAU KHI đã chạy xong 01-audit-readonly.sql và đã SAO LƯU database.
-- 2. Nếu 01-audit cho thấy THIẾU BẢNG hoặc thiếu cột nào khác ngoài endDate, hãy DỪNG LẠI
--    và báo BA, không tự ý chỉnh sửa.
-- 3. Script này mang tính IDEMPOTENT (an toàn khi chạy lại nhiều lần).
--    Chỉ dùng ADD COLUMN IF NOT EXISTS và ENABLE ROW LEVEL SECURITY.
--    Tuyệt đối không xoá bảng, không sửa kiểu dữ liệu, không đổi dữ liệu hàng.
-- =============================================================================

-- >>> KHỐI 01: Bổ sung cột endDate và kích hoạt RLS cho cả 9 bảng (transaction BEGIN / COMMIT)
BEGIN;

-- 1. Bổ sung cột endDate cho Driver và OfficeStaff nếu chưa có
ALTER TABLE "Driver" ADD COLUMN IF NOT EXISTS "endDate" TEXT;
ALTER TABLE "OfficeStaff" ADD COLUMN IF NOT EXISTS "endDate" TEXT;

-- 2. Kích hoạt Row Level Security (RLS) cho cả 9 bảng (idempotent, không ảnh hưởng policy hiện có)
ALTER TABLE "Vehicle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trip" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FuelEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OfficeStaff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalaryMonth" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OtherExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerDebt" ENABLE ROW LEVEL SECURITY;

COMMIT;

-- -----------------------------------------------------------------------------
-- Kiểm tra lại kết quả đồng bộ sau khi commit (chạy từng khối bên dưới)
-- -----------------------------------------------------------------------------

-- >>> KHỐI 02: Kiểm tra cột endDate trên Driver và OfficeStaff
-- Kỳ vọng: Hiển thị 2 dòng (cột endDate kiểu text trên Driver và OfficeStaff)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Driver', 'OfficeStaff')
  AND column_name = 'endDate';

-- >>> KHỐI 03: Kiểm tra bảng nào chưa bật RLS
-- Kỳ vọng: Trả về 0 dòng (cả 9 bảng đều đã bật rls_enabled = true)
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'Vehicle', 'Driver', 'Trip', 'FuelEntry',
    'OfficeStaff', 'SalaryMonth', 'PartnerPayout',
    'OtherExpense', 'PartnerDebt'
  )
  AND c.relrowsecurity = false;
