import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * PrismaClient dùng chung (singleton).
 * Prisma 7 (Rust-free / query compiler) chạy qua driver adapter `pg`,
 * nối tới Postgres của Supabase bằng DATABASE_URL.
 * Giữ 1 instance qua globalThis để dev (hot-reload) không mở quá nhiều kết nối.
 */
function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Thiếu DATABASE_URL — xem .env.example");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
