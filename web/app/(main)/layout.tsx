import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentStaff } from "@/lib/auth";
import { isManager } from "@/lib/office";
import Nav from "@/components/Nav";
import RealtimeRefresh from "@/components/RealtimeRefresh";

// Chốt bảo vệ DUY NHẤT cho toàn bộ khu nội bộ: mọi trang trong (main) đều đi qua layout này.
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // getUser + tra staff (đều cache theo request) — guard từng trang gọi lại không tốn thêm query.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Nối tài khoản với nhân sự văn phòng; chưa gán → chặn hẳn.
  const staff = await getCurrentStaff();
  if (!staff) redirect("/no-access");

  return (
    <>
      <RealtimeRefresh />
      <Nav isManager={isManager(staff.position)} name={staff.name} />
      <main className="mx-auto max-w-[1720px] px-3 py-6">{children}</main>
    </>
  );
}
