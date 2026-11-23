-- =============================================================================
-- 03-backfill-partner-debt-workdate.sql
-- Cập nhật workDate của PartnerDebt theo ngày hoàn tất của chuyến (ngày về nếu có lượt về, ngược lại ngày đi).
-- Chạy trên Postgres (Supabase SQL Editor).
-- Script CHỈ ĐỂ USER CHẠY TAY, Dev không tự chạy.
--
-- QUAN TRỌNG:
-- Chạy SAU 01-audit-readonly.sql và SAU khi sao lưu database;
-- Xem kỹ kết quả Bước 1 rồi mới chạy Bước 2.
-- =============================================================================

-- BƯỚC 1 — Xem trước các bản ghi có workDate khác ngày hoàn tất của chuyến (chỉ SELECT, không đổi dữ liệu):

SELECT
  pd.id AS "partnerDebtId",
  pd."tripId",
  t."customerName",
  t."hasReturn",
  t."outboundDate",
  t."returnDate",
  pd."workDate" AS "oldWorkDate",
  CASE
    WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
    ELSE t."outboundDate"
  END AS "newWorkDate"
FROM "PartnerDebt" pd
JOIN "Trip" t ON t.id = pd."tripId"
WHERE pd."workDate" <> (
  CASE
    WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
    ELSE t."outboundDate"
  END
)
ORDER BY pd."workDate" DESC;

-- =============================================================================
-- BƯỚC 2 & 3 — Cập nhật workDate và kiểm tra lại:
-- AN TOÀN MẶC ĐỊNH: Khối bên dưới đã được đóng dấu ghi chú comment /* ... */.
-- CHỈ SAU KHI ĐÃ XEM BƯỚC 1 VÀ ĐÃ SAO LƯU:
-- Xóa hai ký tự /* ở đầu và */ ở cuối rồi bôi đen chạy riêng khối này.
-- =============================================================================

/*
BEGIN;

UPDATE "PartnerDebt" pd
SET "workDate" = CASE
  WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
  ELSE t."outboundDate"
END
FROM "Trip" t
WHERE pd."tripId" = t.id
  AND pd."workDate" <> (
    CASE
      WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
      ELSE t."outboundDate"
    END
  );

-- Kiểm tra kết quả trong transaction rồi COMMIT (hoặc ROLLBACK nếu có bất thường):
COMMIT;

-- BƯỚC 3 — Kiểm tra sau cập nhật (kỳ vọng trả về 0 dòng lệch):

SELECT COUNT(*) AS "remainingMismatchedCount"
FROM "PartnerDebt" pd
JOIN "Trip" t ON t.id = pd."tripId"
WHERE pd."workDate" <> (
  CASE
    WHEN t."hasReturn" AND t."returnDate" IS NOT NULL AND t."returnDate" <> '' THEN t."returnDate"
    ELSE t."outboundDate"
  END
);
*/
