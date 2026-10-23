-- Dọn dẹp các chuyến (bản ghi Trip) trùng lặp do lỗi double-submit trên Production.
-- Chạy trên Postgres (Supabase). NAOE dùng NULL-safe: GROUP BY gộp NULL bằng nhau.
--
-- Cách xác định "trùng": các cột nội dung hoàn toàn giống nhau (khách, giá, ngày/giờ đi-về,
-- xe, lái xe, trạng thái, ghi chú, chi phí...). Giữ lại bản ghi có id MỚI NHẤT trong nhóm
-- (id = t-<base36 ms><random>; id lớn hơn ≈ tạo sau). Mỗi nhóm chỉ giữ 1 bản ghi.
--
-- BƯỚC 1 — Xem trước các bản ghi sẽ bị xóa (chỉ SELECT, không thay đổi dữ liệu):

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
SELECT t.*
FROM "Trip" t
JOIN grouped g ON g.id = t.id
WHERE g.rn > 1
ORDER BY t."customerName", t."outboundDate";

-- BƯỚC 2 — Dọn dẹp thật (xóa PartnerDebt trỏ về chuyến sẽ xóa trước, rồi xóa Trip).
-- Chỉ chạy sau khi đã xem lại kết quả Bước 1. Nên backup (hoặc chạy trong transaction):

BEGIN;

WITH doomed AS (
  SELECT id FROM (
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
  ) x
  WHERE rn > 1
)
DELETE FROM "PartnerDebt"
WHERE "tripId" IN (SELECT id FROM doomed);

WITH doomed AS (
  SELECT id FROM (
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
  ) x
  WHERE rn > 1
)
DELETE FROM "Trip"
WHERE id IN (SELECT id FROM doomed);

-- Kiểm tra rồi COMMIT (hoặc ROLLBACK nếu số dòng xóa không đúng expectancy):
COMMIT;
