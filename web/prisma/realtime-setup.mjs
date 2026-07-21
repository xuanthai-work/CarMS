import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Thiết lập một lần cho Supabase Realtime + bảo mật (idempotent, chạy lại được):
 *  1. Bật RLS trên các bảng do Prisma tạo (mặc định Prisma KHÔNG bật → bảng đang hở
 *     với anon key qua PostgREST).
 *  2. Policy SELECT cho role `authenticated` — người đã đăng nhập đọc được (và nhờ đó
 *     Realtime mới gửi được Postgres Changes cho họ). KHÔNG có policy ghi ⇒ mọi INSERT/
 *     UPDATE/DELETE chỉ đi qua Prisma (role `postgres`, owner, bỏ qua RLS) ở server.
 *  3. Đưa 3 bảng vào publication `supabase_realtime`.
 */

const TABLES = ["Vehicle", "Driver", "Trip"];

const statements = [
  // (0) Đảm bảo publication tồn tại (Supabase tạo sẵn, nhưng phòng trường hợp thiếu).
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
       CREATE PUBLICATION supabase_realtime;
     END IF;
   END $$;`,
];

for (const t of TABLES) {
  statements.push(
    `ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "authenticated_read" ON public."${t}";`,
    `CREATE POLICY "authenticated_read" ON public."${t}" FOR SELECT TO authenticated USING (true);`,
    `DO $$ BEGIN
       IF NOT EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = '${t}'
       ) THEN
         ALTER PUBLICATION supabase_realtime ADD TABLE public."${t}";
       END IF;
     END $$;`
  );
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Thiếu DATABASE_URL/DIRECT_URL — xem .env.example");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  const rows = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
     ORDER BY tablename;`
  );
  console.log("Bảng trong publication supabase_realtime:", rows.map((r) => r.tablename).join(", ") || "(trống)");
  console.log("RLS + policy + publication: xong.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
