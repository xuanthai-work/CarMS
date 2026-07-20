import Link from 'next/link';
import { forgotPassword } from './actions';
import { AuthShell, AuthHeader, AuthButton, Alert, authInputCls, authLabelCls } from '@/components/AuthUI';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const { message, error } = await searchParams;

  return (
    <AuthShell>
      <AuthHeader title="Khôi phục mật khẩu" subtitle="Nhập email của bạn để nhận liên kết đặt lại mật khẩu." />

      <form action={forgotPassword} className="space-y-5">
        <div className="space-y-1.5">
          <label className={authLabelCls}>Email truy cập</label>
          <input type="email" name="email" required placeholder="admin@example.com" className={authInputCls} />
        </div>

        <Alert error={error} message={message} />

        <AuthButton>Gửi liên kết khôi phục</AuthButton>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700">
            &larr; Quay lại Đăng nhập
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
