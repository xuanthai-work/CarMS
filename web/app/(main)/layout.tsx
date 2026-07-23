import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentStaff } from "@/lib/auth";
import { isManager } from "@/lib/office";
import Sidebar from "@/components/Sidebar";
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
    <div className="flex min-h-screen bg-canvas text-ink">
      <RealtimeRefresh />
      <Sidebar isManager={isManager(staff.position)} name={staff.name} position={staff.position} />
      <main className="min-w-0 flex-1 px-4 py-5">
        <div className="mx-auto w-full max-w-[1680px]">{children}</div>
      </main>
    </div>
  );
}
