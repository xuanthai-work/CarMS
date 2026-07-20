import { createClient } from '@/utils/supabase/server';
import { logout } from '@/app/login/actions';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guard đã nằm ở app/(main)/layout.tsx; ở đây chỉ lấy dữ liệu user để hiển thị.
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl border-4 border-white shadow-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
              <p className="text-sm text-slate-500 font-medium">Quản lý thông tin tài khoản và bảo mật</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Thông tin liên hệ</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Email đăng nhập</p>
                <p className="font-medium text-slate-900">{user.email}</p>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Đã xác thực
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Bảo mật</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Mật khẩu</p>
                  <p className="text-xs text-slate-500">Đăng nhập lần cuối: {new Date(user.last_sign_in_at || '').toLocaleString('vi-VN')}</p>
                </div>
                <a href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                  Đổi mật khẩu
                </a>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Đăng xuất khỏi hệ thống
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
