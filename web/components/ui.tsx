import Link from "next/link";
import type { ReactNode } from "react";

// Class dùng chung cho input/select trong các form.
export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
export const labelCls = "block text-xs font-medium text-slate-600 mb-1";

// Hiệu ứng hover thẻ lịch (nhấc nhẹ + đổ bóng + viền be nét đứt). Dùng chung 2 view.
// LƯU Ý: đặt SẴN màu be + offset (outline vô hình khi style=none), chỉ bật style+width lúc hover
// → tránh loé màu outline mặc định (đen) khi viền vừa xuất hiện.
export const CARD_HOVER =
  "outline-offset-2 outline-[#cbb48f] hover:z-20 hover:-translate-y-0.5 hover:shadow-lg hover:outline-1 hover:outline-dashed";
export const CARD_HOVER_GROUP =
  "outline-offset-2 outline-[#cbb48f] group-hover:z-20 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:outline-1 group-hover:outline-dashed";

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
  size = "sm",
}: {
  label: string;
  value: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={className}>
      <div className={`font-medium text-slate-600 ${size === "md" ? "text-sm" : "text-xs"}`}>{label}</div>
      <div className={`text-slate-800 ${size === "md" ? "text-base" : "text-sm"}`}>{value}</div>
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
