import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentStaff } from "@/lib/auth";
import { isManager } from "@/lib/office";
import Sidebar from "@/components/Sidebar";
import RealtimeRefresh from "@/components/RealtimeRefresh";
import AssistantProvider from "@/components/assistant/AssistantProvider";
import RightRail from "@/components/assistant/RightRail";
import Drawer from "@/components/assistant/Drawer";

// Chốt bảo vệ DUY NHẤT cho toàn bộ khu nội bộ: mọi trang trong (main) đều đi qua layout này.
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  // getUser + tra staff (đều cache theo request) — guard từng trang gọi lại không tốn thêm query.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Nối tài khoản với nhân sự văn phòng; chưa gán → chặn hẳn.
  const staff = await getCurrentStaff();
  if (!staff) redirect("/no-access");

  // Chỉ đọc key ở server; chỉ boolean này băng qua client — key không bao giờ lọt vào bundle.
  const assistantEnabled = Boolean(process.env.GEMINI_API_KEY);

  // Trạng thái thu gọn Sidebar đọc từ cookie → render đúng ngay ở server, không giật khi tải lại.
  // null = chưa chọn (để client quyết theo bề rộng); "1"/"0" = lựa chọn tường minh của người dùng.
  const rawCollapsed = (await cookies()).get("sidebar_collapsed")?.value;
  const collapsedCookie: "1" | "0" | null = rawCollapsed === "1" ? "1" : rawCollapsed === "0" ? "0" : null;

  return (
    <AssistantProvider>
      <div className="flex min-h-[100dvh] bg-canvas text-ink">
        <RealtimeRefresh />
        <Sidebar
          isManager={isManager(staff.position)}
          name={staff.name}
          position={staff.position}
          collapsedCookie={collapsedCookie}
        />
        <main className="min-w-0 flex-1 px-1 py-6">
          <div className="mx-auto w-full max-w-[1680px]">{children}</div>
        </main>
        {assistantEnabled && (
          <>
            <Drawer />
            <RightRail />
          </>
        )}
      </div>
    </AssistantProvider>
  );
}
