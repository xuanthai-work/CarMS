import Link from "next/link";
import type { ReactNode } from "react";

// Class dùng chung cho input/select trong các form.
export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
export const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

/** Hiển thị một mục thông tin (nhãn + giá trị) ở chế độ xem. */
export function Info({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-slate-600">{label}</div>
      <div className="text-sm text-slate-800">{value}</div>
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const cls =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700"
      : "border border-slate-300 text-slate-700 hover:bg-slate-100";
  return (
    <Link href={href} className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${cls}`}>
      {children}
    </Link>
  );
}
