-- =============================================================================
-- 01-audit-readonly.sql
-- Khảo sát hiện trạng database Production (Supabase Cloud).
--
-- QUY TẮC AN TOÀN & CÁCH CHẠY:
-- 1. Script này CHỈ CHỨA CÁC LỆNH SELECT, hoàn toàn KHÔNG thay đổi dữ liệu.
-- 2. Supabase SQL Editor chỉ hiển thị kết quả của câu lệnh CUỐI CÙNG nếu chạy cả file.
--    Vì vậy, hãy chạy TỪNG KHỐI:
--    -> Bôi đen (highlight) đúng một khối bắt đầu từ dòng "-- >>> KHỐI ..." đến hết dấu chấm phẩy (;).
--    -> Nhấn "Run selected" (hoặc phím tắt Ctrl+Enter / Cmd+Enter).
--    -> Sao chép (copy) kết quả của khối đó gửi cho BA.
-- 3. Mọi khối đều được thiết kế trả về TỐI ĐA 100 DÒNG (tránh bị Studio cắt kết quả).
-- =============================================================================

-- >>> KHỐI 01: Danh sách bảng và cột của 9 bảng trong schema public (gom theo bảng)
SELECT
  '01_COLUMNS' AS check_code,
  table_name,
  string_agg(
    column_name || ' ' || data_type || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    ', '
    ORDER BY ordinal_position
  ) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'Vehicle', 'Driver', 'Trip', 'FuelEntry',
    'OfficeStaff', 'SalaryMonth', 'PartnerPayout',
    'OtherExpense', 'PartnerDebt'
  )
GROUP BY table_name
ORDER BY table_name;

-- >>> KHỐI 02: Kiểm tra các cột mới (endDate) và cột cũ đã bỏ (fuelCost)
-- Kỳ vọng: Driver.endDate = PRESENT, OfficeStaff.endDate = PRESENT, Trip.fuelCost = ABSENT
SELECT
  '02_NEW_OLD_COLUMNS' AS check_code,
  t.table_name,
  t.column_name,
  CASE
    WHEN c.column_name IS NOT NULL THEN 'PRESENT'
    ELSE 'ABSENT'
  END AS status
FROM (
  VALUES
    ('Driver', 'endDate'),
    ('OfficeStaff', 'endDate'),
    ('Trip', 'fuelCost')
) AS t(table_name, column_name)
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = t.table_name
 AND c.column_name = t.column_name;

-- >>> KHỐI 03: Danh sách chỉ mục (indexes) trong schema public (gom theo bảng)
SELECT
  '03_INDEXES' AS check_code,
  tablename AS table_name,
  COUNT(indexname)::int AS index_count,
  string_agg(indexname, ', ' ORDER BY indexname) AS index_names
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- >>> KHỐI 04: Trạng thái Row Level Security (RLS) và số lượng chính sách trên từng bảng
-- Kỳ vọng: Cả 9 bảng có rls_enabled = true; Vehicle/Driver/Trip/FuelEntry có policy_count = 1;
-- 5 bảng còn lại có policy_count = 0.
SELECT
  '04_RLS_STATUS' AS check_code,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  COUNT(p.policyname)::int AS policy_count,
  COALESCE(string_agg(p.policyname, ', '), '(none)') AS policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'Vehicle', 'Driver', 'Trip', 'FuelEntry',
    'OfficeStaff', 'SalaryMonth', 'PartnerPayout',
    'OtherExpense', 'PartnerDebt'
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- >>> KHỐI 05: Quyền cấp cho role anon trên 9 bảng (gom theo bảng)
-- Giúp đánh giá nguy cơ rò rỉ nếu bảng chưa bật RLS.
SELECT
  '05_ANON_GRANTS' AS check_code,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND table_name IN (
    'Vehicle', 'Driver', 'Trip', 'FuelEntry',
    'OfficeStaff', 'SalaryMonth', 'PartnerPayout',
    'OtherExpense', 'PartnerDebt'
  )
GROUP BY table_name
ORDER BY table_name;

-- >>> KHỐI 06: Đếm số dòng dữ liệu trên từng bảng
SELECT '06_ROW_COUNTS' AS check_code, 'Vehicle' AS table_name, COUNT(*)::bigint AS row_count FROM "Vehicle"
UNION ALL
SELECT '06_ROW_COUNTS', 'Driver', COUNT(*)::bigint FROM "Driver"
UNION ALL
SELECT '06_ROW_COUNTS', 'Trip', COUNT(*)::bigint FROM "Trip"
UNION ALL
SELECT '06_ROW_COUNTS', 'FuelEntry', COUNT(*)::bigint FROM "FuelEntry"
UNION ALL
SELECT '06_ROW_COUNTS', 'OfficeStaff', COUNT(*)::bigint FROM "OfficeStaff"
UNION ALL
SELECT '06_ROW_COUNTS', 'SalaryMonth', COUNT(*)::bigint FROM "SalaryMonth"
UNION ALL
SELECT '06_ROW_COUNTS', 'PartnerPayout', COUNT(*)::bigint FROM "PartnerPayout"
UNION ALL
SELECT '06_ROW_COUNTS', 'OtherExpense', COUNT(*)::bigint FROM "OtherExpense"
UNION ALL
SELECT '06_ROW_COUNTS', 'PartnerDebt', COUNT(*)::bigint FROM "PartnerDebt"
ORDER BY table_name;

-- >>> KHỐI 07.1a: Đếm số dòng PartnerDebt có workDate khác ngày hoàn tất của chuyến
-- (Chuyến khứ hồi lấy returnDate, chuyến một chiều lấy outboundDate)
SELECT
  '07_1a_PARTNER_DEBT_WORKDATE_MISMATCH_COUNT' AS check_code,
  COUNT(*)::bigint AS count
FROM "PartnerDebt" pd
JOIN "Trip" t ON t.id = pd."tripId"
WHERE pd."workDate" <> (
  CASE
    WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
    ELSE t."outboundDate"
  END
);

-- >>> KHỐI 07.1b: 20 mẫu PartnerDebt có workDate lệch ngày hoàn tất của chuyến
SELECT
  '07_1b_PARTNER_DEBT_WORKDATE_MISMATCH_SAMPLES' AS check_code,
  pd.id AS "partnerDebtId",
  pd."tripId",
  pd."workDate" AS current_work_date,
  CASE
    WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
    ELSE t."outboundDate"
  END AS expected_work_date
FROM "PartnerDebt" pd
JOIN "Trip" t ON t.id = pd."tripId"
WHERE pd."workDate" <> (
  CASE
    WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
    ELSE t."outboundDate"
  END
)
LIMIT 20;

-- >>> KHỐI 07.2a: Đếm số chuyến Trip có hasReturn = true nhưng returnDate rỗng hoặc NULL
SELECT
  '07_2a_TRIP_HAS_RETURN_NO_DATE_COUNT' AS check_code,
  COUNT(*)::bigint AS count
FROM "Trip"
WHERE "hasReturn" = true AND ("returnDate" IS NULL OR "returnDate" = '');

-- >>> KHỐI 07.2b: 20 mẫu Trip có hasReturn = true nhưng returnDate rỗng hoặc NULL
SELECT
  '07_2b_TRIP_HAS_RETURN_NO_DATE_SAMPLES' AS check_code,
  id, "customerName", "outboundDate", "returnDate"
FROM "Trip"
WHERE "hasReturn" = true AND ("returnDate" IS NULL OR "returnDate" = '')
LIMIT 20;

-- >>> KHỐI 07.3a: Đếm số chuyến Trip có deposit lớn hơn price
SELECT
  '07_3a_TRIP_DEPOSIT_GT_PRICE_COUNT' AS check_code,
  COUNT(*)::bigint AS count
FROM "Trip"
WHERE "price" IS NOT NULL AND "deposit" > "price";

-- >>> KHỐI 07.3b: 20 mẫu Trip có deposit lớn hơn price
SELECT
  '07_3b_TRIP_DEPOSIT_GT_PRICE_SAMPLES' AS check_code,
  id, "customerName", "price", "deposit"
FROM "Trip"
WHERE "price" IS NOT NULL AND "deposit" > "price"
LIMIT 20;

-- >>> KHỐI 07.4a: Đếm số chuyến Trip trạng thái completed_paid mà price NULL hoặc bằng 0
SELECT
  '07_4a_TRIP_COMPLETED_PAID_NO_PRICE_COUNT' AS check_code,
  COUNT(*)::bigint AS count
FROM "Trip"
WHERE "status" = 'completed_paid' AND ("price" IS NULL OR "price" = 0);

-- >>> KHỐI 07.4b: 20 mẫu Trip trạng thái completed_paid mà price NULL hoặc bằng 0
SELECT
  '07_4b_TRIP_COMPLETED_PAID_NO_PRICE_SAMPLES' AS check_code,
  id, "customerName", "status", "price"
FROM "Trip"
WHERE "status" = 'completed_paid' AND ("price" IS NULL OR "price" = 0)
LIMIT 20;

-- >>> KHỐI 07.5: Phân bổ số lượng Trip theo từng giá trị status
SELECT
  '07_5_TRIP_STATUS_COUNTS' AS check_code,
  "status",
  COUNT(*)::bigint AS count
FROM "Trip"
GROUP BY "status"
ORDER BY "status";

-- >>> KHỐI 07.6a: Đếm số chuyến Trip có partnerCost > 0 mà không gắn xe đối tác nào
SELECT
  '07_6a_TRIP_PARTNER_COST_NO_PARTNER_VEHICLE_COUNT' AS check_code,
  COUNT(*)::bigint AS count
FROM "Trip" t
LEFT JOIN "Vehicle" ov ON ov.id = t."outboundVehicleId"
LEFT JOIN "Vehicle" rv ON rv.id = t."returnVehicleId"
WHERE COALESCE(t."partnerCost", 0) > 0
  AND COALESCE(ov.type, '') <> 'partner'
  AND COALESCE(rv.type, '') <> 'partner';

-- >>> KHỐI 07.6b: 20 mẫu Trip có partnerCost > 0 mà không gắn xe đối tác nào
SELECT
  '07_6b_TRIP_PARTNER_COST_NO_PARTNER_VEHICLE_SAMPLES' AS check_code,
  t.id, t."customerName", t."partnerCost",
  ov.plate AS outbound_plate, ov.type AS outbound_type,
  rv.plate AS return_plate, rv.type AS return_type
FROM "Trip" t
LEFT JOIN "Vehicle" ov ON ov.id = t."outboundVehicleId"
LEFT JOIN "Vehicle" rv ON rv.id = t."returnVehicleId"
WHERE COALESCE(t."partnerCost", 0) > 0
  AND COALESCE(ov.type, '') <> 'partner'
  AND COALESCE(rv.type, '') <> 'partner'
LIMIT 20;

-- >>> KHỐI 07.7a: Đếm số PartnerDebt mồ côi (Trip không tồn tại) hoặc amount khác Trip.partnerCost
SELECT
  '07_7a_PARTNER_DEBT_ORPHAN_OR_AMOUNT_MISMATCH_COUNT' AS check_code,
  COUNT(*)::bigint AS count
FROM "PartnerDebt" pd
LEFT JOIN "Trip" t ON t.id = pd."tripId"
WHERE t.id IS NULL OR pd."amount" <> COALESCE(t."partnerCost", 0);

-- >>> KHỐI 07.7b: 20 mẫu PartnerDebt mồ côi hoặc amount khác Trip.partnerCost
SELECT
  '07_7b_PARTNER_DEBT_ORPHAN_OR_AMOUNT_MISMATCH_SAMPLES' AS check_code,
  pd.id AS "partnerDebtId",
  pd."tripId",
  pd."amount" AS debt_amount,
  t."partnerCost" AS trip_partner_cost,
  CASE WHEN t.id IS NULL THEN 'ORPHAN_TRIP' ELSE 'AMOUNT_MISMATCH' END AS reason
FROM "PartnerDebt" pd
LEFT JOIN "Trip" t ON t.id = pd."tripId"
WHERE t.id IS NULL OR pd."amount" <> COALESCE(t."partnerCost", 0)
LIMIT 20;

-- >>> KHỐI 07.8: Số lượng bản ghi Trip trùng lặp nội dung cần dọn dẹp (tiêu chí script 04)
WITH grouped AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY
        "customerName", "customerPhone", "tourType", "price", "deposit",
        "tollCost", "partnerCost", "otherCost",
        "status", "heldThroughTour", "note",
        "outboundDate", "outboundTime", "outboundFrom", "outboundTo",
        "outboundVehicleId", "outboundDriverId", "outboundSeatClass",
        "hasReturn",
        "returnDate", "returnTime", "returnFrom", "returnTo",
        "returnVehicleId", "returnDriverId", "returnSeatClass"
      ORDER BY id DESC
    ) AS rn
  FROM "Trip"
)
SELECT
  '07_8_DUPLICATE_TRIPS_COUNT' AS check_code,
  COUNT(*)::bigint AS duplicate_trip_rows_count
FROM grouped
WHERE rn > 1;

-- >>> KHỐI 07.9: OfficeStaff có email trùng nhau (không phân biệt hoa/thường) hoặc email NULL
SELECT
  '07_9_OFFICE_STAFF_DUPLICATE_OR_NULL_EMAIL' AS check_code,
  LOWER(TRIM(email)) AS normalized_email,
  COUNT(*)::bigint AS count,
  string_agg(id, ', ') AS staff_ids,
  string_agg(name, ', ') AS staff_names
FROM "OfficeStaff"
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1 OR LOWER(TRIM(email)) IS NULL
LIMIT 50;

-- >>> KHỐI 07.10: Kiểm tra sự tồn tại của cột endDate trên Driver và OfficeStaff
-- (Dùng information_schema để an toàn tuyệt đối, không phát sinh lỗi cú pháp khi cột chưa có)
SELECT
  '07_10_END_DATE_COLUMN_CHECK' AS check_code,
  table_name,
  column_name,
  'Cột đã có sẵn, có thể xem chi tiết nhân sự nghỉ việc' AS note
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('Driver', 'OfficeStaff')
  AND column_name = 'endDate';

-- >>> KHỐI 07.11: Số lượng bản ghi SalaryMonth theo từng tháng (monthKey)
SELECT
  '07_11_SALARY_MONTH_COUNTS' AS check_code,
  "monthKey",
  COUNT(*)::bigint AS count
FROM "SalaryMonth"
GROUP BY "monthKey"
ORDER BY "monthKey" DESC
LIMIT 100;

-- >>> KHỐI 08.1: Tài khoản auth.users nhưng chưa được gán với nhân sự OfficeStaff nào
SELECT
  '08_1_AUTH_USER_NO_OFFICE_STAFF' AS check_code,
  u.id AS auth_user_id,
  u.email AS auth_email
FROM auth.users u
LEFT JOIN "OfficeStaff" os ON LOWER(TRIM(os.email)) = LOWER(TRIM(u.email))
WHERE os.id IS NULL
LIMIT 100;

-- >>> KHỐI 08.2: Nhân sự OfficeStaff có email nhưng chưa có tài khoản đăng nhập trong auth.users
SELECT
  '08_2_OFFICE_STAFF_NO_AUTH_USER' AS check_code,
  os.id AS office_staff_id,
  os.name AS staff_name,
  os.email AS staff_email
FROM "OfficeStaff" os
LEFT JOIN auth.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(os.email))
WHERE os.email IS NOT NULL AND u.id IS NULL
LIMIT 100;

-- =============================================================================
-- GHI CHÚ BỔ SUNG CHO MỤC 07.10:
-- Sau khi đã chạy script 02-sync-schema.sql (đã có cột endDate), bạn có thể chạy
-- riêng câu lệnh SELECT dưới đây để xem danh sách nhân sự / tài xế đã nghỉ việc:
--
-- SELECT '07_10_OFFICESTAFF_END_DATE', id, name, "endDate" FROM "OfficeStaff" WHERE "endDate" IS NOT NULL
-- UNION ALL
-- SELECT '07_10_DRIVER_END_DATE', id, name, "endDate" FROM "Driver" WHERE "endDate" IS NOT NULL;
-- =============================================================================
