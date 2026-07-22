import { getCurrentUser, requireStaff } from '@/lib/auth';
import { logout } from '@/app/login/actions';
import { Info } from '@/components/ui';
import { fmtMoney } from '@/lib/trips';
import { fmtDate } from '@/lib/format';

export default async function ProfilePage() {
  // Cache theo request → tái dùng getUser + staff mà layout đã lấy.
  const user = await getCurrentUser();
  const p = await requireStaff(); // hồ sơ nhân sự của CHÍNH người đăng nhập

  // Guard đã nằm ở app/(main)/layout.tsx; giữ để thu hẹp kiểu user.
  if (!user) return null;

  return (
    <div className="mx-auto mt-10 max-w-3xl space-y-6">
      {/* Hồ sơ nhân sự */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 p-8">
          <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-brand-100 text-xl font-bold text-brand-600 shadow-sm">
            {(p.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{p.name || 'Hồ sơ cá nhân'}</h1>
              {p.position && (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {p.position}
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-500">Thông tin cá nhân của bạn</p>
          </div>
        </div>

        <div className="p-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Thông tin cá nhân</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Info label="SĐT" value={p.phone || '—'} size="md" />
            <Info label="Email" value={p.email || '—'} size="md" />
            <Info label="Giới tính" value={p.gender || '—'} size="md" />
            <Info label="Ngày sinh" value={fmtDate(p.dob)} size="md" />
            <Info label="CCCD" value={p.idNumber || '—'} size="md" />
            <Info label="Số BHXH" value={p.socialInsurance || '—'} size="md" />
            <Info label="Ngày vào làm" value={fmtDate(p.startDate)} size="md" />
          </div>
        </div>

        <div className="border-t border-slate-100 p-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Lương</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Info label="Lương cơ bản" value={fmtMoney(p.baseSalary)} size="md" />
            <Info label="Ngày nhận lương" value={p.payday ? `Ngày ${p.payday}` : '—'} size="md" />
          </div>
        </div>
      </div>

      {/* Tài khoản & bảo mật */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-6 p-8">
          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">Tài khoản đăng nhập</h3>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <p className="mb-1 text-xs text-slate-500">Email đăng nhập</p>
                <p className="font-medium text-slate-900">{user.email}</p>
              </div>
              <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Đã xác thực
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">Bảo mật</h3>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Mật khẩu</p>
                  <p className="text-xs text-slate-500">
                    Đăng nhập lần cuối: {new Date(user.last_sign_in_at || '').toLocaleString('vi-VN')}
                  </p>
                </div>
                <a href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                  Đổi mật khẩu
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
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
