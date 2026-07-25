import type { ReactNode } from "react";

// Dùng chung cho 3 trang xác thực (login / forgot / reset).
// Không có hook nên dùng được cả ở server page lẫn client component.

export const authInputCls =
  "w-full rounded-xl border border-slate-200 bg-white py-3.5 px-4 text-[15px] text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500";
export const authLabelCls = "text-xs font-semibold uppercase tracking-wider text-slate-500";

/** Khung nền + orb trang trí + thẻ trắng bo góc. `footer` hiện dưới thẻ. */
export function AuthShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 font-sans">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white" />
      <div className="absolute -top-[15%] -left-[5%] h-[50vh] w-[50vw] rounded-full bg-brand-200/40 blur-[100px]" />
      <div className="absolute -bottom-[15%] -right-[5%] h-[50vh] w-[50vw] rounded-full bg-blue-200/40 blur-[100px]" />
      <div className="relative z-10 w-full max-w-[420px] p-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

/** Tiêu đề trang xác thực; `logo` bật khối biểu tượng CarMS (dùng ở trang login). */
export function AuthHeader({ logo, title, subtitle }: { logo?: boolean; title: string; subtitle: string }) {
  return (
    <div className={`${logo ? "mb-10" : "mb-8"} text-center`}>
      {logo && (
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-500 font-bold text-white shadow-lg shadow-brand-500/30">
          <span className="text-2xl">🚐</span>
        </div>
      )}
      <h1 className={`${logo ? "text-3xl" : "text-2xl"} font-extrabold tracking-tight text-slate-900`}>{title}</h1>
      <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
    </div>
  );
}

/** Nút submit chuẩn của form xác thực. */
export function AuthButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="mt-8 flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-500 hover:shadow-lg active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

/** Banner lỗi (đỏ) hoặc thành công (xanh). Ưu tiên hiện lỗi. */
export function Alert({ error, message }: { error?: string; message?: string }) {
  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
        {error}
      </div>
    );
  if (message)
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-600">
        {message}
      </div>
    );
  return null;
}
