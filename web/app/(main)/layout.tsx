import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Nav from "@/components/Nav";

// Chốt bảo vệ DUY NHẤT cho toàn bộ khu nội bộ: mọi trang trong (main)
// (/, /lich, /xe, /nhan-su, /profile) đều đi qua layout này.
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </>
  );
}
