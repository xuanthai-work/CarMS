import LoginForm from '@/components/LoginForm'
import { AuthShell, AuthHeader } from '@/components/AuthUI'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <AuthShell
      footer={
        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          &copy; {new Date().getFullYear()} CarMS. Bảo mật nội bộ.
        </p>
      }
    >
      <AuthHeader logo title="CarMS" subtitle="Hệ thống điều hành xe dịch vụ" />
      <LoginForm error={error} message={message} />
    </AuthShell>
  )
}
