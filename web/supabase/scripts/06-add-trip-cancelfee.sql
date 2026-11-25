-- Thêm cột phí hủy cho chuyến (hủy chuyến có phí hủy). Chạy SAU khi code mới đã deploy.
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "cancelFee" double precision;
