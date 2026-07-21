"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/**
 * Lắng nghe thay đổi ở DB (Supabase Realtime · Postgres Changes) và gọi
 * router.refresh() để Next fetch lại dữ liệu qua Prisma (server) — nhờ đó
 * mọi client đang mở đều thấy cập nhật gần như tức thì mà không cần F5.
 * Không mang dữ liệu qua client; realtime chỉ là tín hiệu "có thay đổi".
 * router.refresh() giữ nguyên state client (view, cuộn, modal đang mở).
 */
const TABLES = ["Vehicle", "Driver", "Trip"] as const;

export default function RealtimeRefresh() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // Gộp nhiều event dồn dập (vd sửa nhiều dòng) thành 1 lần refresh.
    const scheduleRefresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 250);
    };

    const channel = supabase.channel("carms-db-changes");
    for (const table of TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, scheduleRefresh);
    }

    // Dùng access token của phiên đăng nhập cho kênh realtime (RLS lọc theo authenticated).
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const token = data.session?.access_token;
      if (token) supabase.realtime.setAuth(token);
      channel.subscribe();
    });

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
