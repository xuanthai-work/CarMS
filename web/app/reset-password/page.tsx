import { resetPassword } from './actions';
import { AuthShell, AuthHeader, AuthButton, Alert, authInputCls, authLabelCls } from '@/components/AuthUI';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams;

  return (
    <AuthShell>
      <AuthHeader title="Thiết lập mật khẩu mới" subtitle="Vui lòng nhập mật khẩu mới cho tài khoản của bạn." />

      <form action={resetPassword} className="space-y-5">
        <div className="space-y-1.5">
          <label className={authLabelCls}>Mật khẩu mới</label>
          <input type="password" name="password" required placeholder="Mật khẩu mới (ít nhất 6 ký tự)" className={authInputCls} />
        </div>

        <Alert error={error} />

        <AuthButton>Cập nhật mật khẩu</AuthButton>
      </form>
    </AuthShell>
  );
}
