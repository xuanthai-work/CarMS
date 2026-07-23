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
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Hồ sơ nhân sự */}
      <div className="relative overflow-hidden rounded-3xl bg-sidebar px-6 py-7 text-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.8)] sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-dispatch-500/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-dispatch-600 text-xl font-bold shadow-sm">
            {(p.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{p.name || 'Hồ sơ cá nhân'}</h1>
              {p.position && (
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200">
                  {p.position}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-300">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.8)]">
          <h2 className="mb-5 text-base font-bold tracking-tight text-ink">Thông tin cá nhân</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Info label="SĐT" value={p.phone || '—'} size="md" />
            <Info
              label="Email"
              size="md"
              className="min-w-0"
              value={
                p.email ? (
                  <span className="block truncate" title={p.email}>{p.email}</span>
                ) : (
                  '—'
                )
              }
            />
            <Info label="Giới tính" value={p.gender || '—'} size="md" />
            <Info label="Ngày sinh" value={fmtDate(p.dob)} size="md" />
            <Info label="CCCD" value={p.idNumber || '—'} size="md" />
            <Info label="Số BHXH" value={p.socialInsurance || '—'} size="md" />
            <Info label="Ngày vào làm" value={fmtDate(p.startDate)} size="md" />
          </div>
          <div className="mt-6 border-t border-hairline pt-5">
            <h3 className="mb-4 text-base font-bold tracking-tight text-ink">Lương</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-canvas p-4">
                <Info label="Lương cơ bản" value={fmtMoney(p.baseSalary)} size="md" />
              </div>
              <div className="rounded-xl bg-canvas p-4">
                <Info label="Ngày nhận lương" value={p.payday ? `Ngày ${p.payday}` : '—'} size="md" />
              </div>
            </div>
          </div>
        </div>

      {/* Tài khoản & bảo mật */}
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.8)]">
          <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-base font-bold tracking-tight text-ink">Tài khoản đăng nhập</h2>
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Email đăng nhập</p>
                <p className="truncate font-semibold text-ink" title={user.email}>{user.email}</p>
              </div>
              <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Đã xác thực
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-base font-bold tracking-tight text-ink">Bảo mật</h2>
            <div className="rounded-xl border border-hairline bg-canvas p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">Mật khẩu</p>
                  <p className="mt-1 text-xs text-muted">
                    Đăng nhập lần cuối: {new Date(user.last_sign_in_at || '').toLocaleString('vi-VN')}
                  </p>
                </div>
                <a href="/forgot-password" className="text-sm font-semibold text-brand-600 hover:text-brand-500">
                  Đổi mật khẩu
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-hairline pt-5">
            <form action={logout}>
              <button
                type="submit"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100"
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
    </div>
  );
}
