import { logout } from "@/app/login/actions";
import { AuthShell, AuthHeader } from "@/components/AuthUI";

// Ngoài nhóm (main): tài khoản đã đăng nhập nhưng chưa gán nhân sự sẽ bị đá về đây.
export default function NoAccessPage() {
  return (
    <AuthShell>
      <AuthHeader
        title="Tài khoản chưa được gán nhân sự"
        subtitle="Tài khoản này chưa liên kết với hồ sơ nhân sự văn phòng nào. Vui lòng liên hệ quản trị để được cấp quyền."
      />
      <form action={logout}>
        <button
          type="submit"
          className="flex w-full items-center justify-center rounded-xl bg-rose-50 px-4 py-3.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100"
        >
          Đăng xuất
        </button>
      </form>
    </AuthShell>
  );
}
