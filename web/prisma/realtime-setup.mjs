import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Thiết lập một lần cho Supabase Realtime + bảo mật (idempotent, chạy lại được).
 * Đích đến là đúng cấu hình đang chạy trên prod, nên chạy ở môi trường nào cũng ra
 * môi trường giống prod.
 *
 * Nền: Prisma tạo bảng thì KHÔNG tự bật RLS, mà Supabase lại cấp sẵn quyền
 * SELECT/INSERT/UPDATE/DELETE cho role `anon` + `authenticated` trên schema public.
 * Anon key nằm công khai trong bundle browser ⇒ RLS là lớp chặn duy nhất cho đường
 * PostgREST. Vì vậy bật RLS trên MỌI bảng, rồi mới nói tới policy.
 *
 * Hai nhóm bảng, khác nhau ở chỗ có policy đọc hay không:
 *
 *  1. REALTIME_TABLES — cần policy SELECT cho `authenticated`, vì Realtime chỉ đẩy
 *     Postgres Changes cho ai đọc được hàng đó. Danh sách này phải khớp với TABLES
 *     trong src/components/layout/RealtimeRefresh.tsx.
 *
 *  2. PRIVATE_TABLES — CỐ Ý bật RLS mà không có policy nào ⇒ PostgREST trả 0 dòng cho
 *     mọi role. Đây là dữ liệu nhạy cảm (CCCD, ngày sinh, lương) mà UI đã giới hạn
 *     theo chức vụ; nếu để policy "authenticated đọc hết" thì một nhân viên thường
 *     vẫn lấy được bằng anon key + token phiên của họ, vòng qua RBAC. App không bị
 *     ảnh hưởng: mọi truy vấn dữ liệu đi qua Prisma bằng role `postgres` (owner bảng,
 *     bỏ qua RLS), trong src không có lời gọi `.from()` nào.
 *
 * KHÔNG có policy ghi ở bất kỳ bảng nào ⇒ mọi INSERT/UPDATE/DELETE chỉ đi được qua
 * Prisma ở server, tức là phải qua guard requireEditor/requireManagerEditor.
 */

const REALTIME_TABLES = ["Vehicle", "Driver", "Trip", "FuelEntry"];
const PRIVATE_TABLES = ["OfficeStaff", "SalaryMonth", "PartnerPayout"];

const inPublication = (table) =>
  `SELECT 1 FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = '${table}'`;

const statements = [
  // (0) Đảm bảo publication tồn tại (Supabase tạo sẵn, nhưng phòng trường hợp thiếu).
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
       CREATE PUBLICATION supabase_realtime;
     END IF;
   END $$;`,
];

// (1) Bật RLS trên mọi bảng — cả hai nhóm.
for (const t of [...REALTIME_TABLES, ...PRIVATE_TABLES]) {
  statements.push(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY;`);
}

// (2) Bảng realtime: policy đọc cho `authenticated` + đưa vào publication.
for (const t of REALTIME_TABLES) {
  statements.push(
    `DROP POLICY IF EXISTS "authenticated_read" ON public."${t}";`,
    `CREATE POLICY "authenticated_read" ON public."${t}" FOR SELECT TO authenticated USING (true);`,
    `DO $$ BEGIN
       IF NOT EXISTS (${inPublication(t)}) THEN
         ALTER PUBLICATION supabase_realtime ADD TABLE public."${t}";
       END IF;
     END $$;`
  );
}

// (3) Bảng riêng tư: bỏ policy đọc (nếu từng tạo) và rút khỏi publication.
for (const t of PRIVATE_TABLES) {
  statements.push(
    `DROP POLICY IF EXISTS "authenticated_read" ON public."${t}";`,
    `DO $$ BEGIN
       IF EXISTS (${inPublication(t)}) THEN
         ALTER PUBLICATION supabase_realtime DROP TABLE public."${t}";
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

  // Đọc lại state thật để xác nhận, thay vì tin là các lệnh trên đã chạy đúng.
  const pub = await prisma.$queryRawUnsafe(
    `SELECT tablename::text AS t FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' ORDER BY 1;`
  );
  const rls = await prisma.$queryRawUnsafe(
    `SELECT c.relname::text AS t, c.relrowsecurity AS rls,
            (SELECT count(*)::int FROM pg_policies p
             WHERE p.schemaname = 'public' AND p.tablename = c.relname) AS policies
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 1;`
  );

  console.log("Publication supabase_realtime:", pub.map((r) => r.t).join(", ") || "(trống)");
  for (const r of rls) console.log(`  ${r.t}: rls=${r.rls} policies=${r.policies}`);

  const wrong = rls.filter(
    (r) =>
      !r.rls ||
      (REALTIME_TABLES.includes(r.t) && r.policies !== 1) ||
      (PRIVATE_TABLES.includes(r.t) && r.policies !== 0)
  );
  if (wrong.length) throw new Error("Sai cấu hình ở: " + wrong.map((r) => r.t).join(", "));

  console.log("RLS + policy + publication: xong, khớp cấu hình prod.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
