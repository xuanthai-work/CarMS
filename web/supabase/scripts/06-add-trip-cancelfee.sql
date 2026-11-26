-- Thêm cột phí hủy cho chuyến (hủy chuyến có phí hủy). Chạy TRƯỚC khi deploy code mới.
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "cancelFee" double precision;
