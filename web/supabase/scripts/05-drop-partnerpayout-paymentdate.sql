-- Bỏ cột paymentDate của PartnerPayout (không còn theo dõi ngày trả công ngày).
-- Chạy SAU khi code mới đã deploy. Có thể chạy lại an toàn.
ALTER TABLE "PartnerPayout" DROP COLUMN IF EXISTS "paymentDate";
