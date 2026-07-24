"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { logout } from "@/app/login/actions";

/* ---- Icon set (outline, kế thừa màu chữ qua currentColor) ---- */
type IconProps = { className?: string };
const svg = (className?: string) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
});

const GridIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
  </svg>
);
const CalendarIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M3 9.5h18M8 3v3.5M16 3v3.5" />
  </svg>
);
const RevenueIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <path d="M3 21h18" />
    <rect x="4.5" y="11" width="3.4" height="7" rx="1" />
    <rect x="10.3" y="6" width="3.4" height="12" rx="1" />
    <rect x="16.1" y="9" width="3.4" height="9" rx="1" />
  </svg>
);
const FuelIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <path d="M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3z" />
  </svg>
);
const TruckIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <path d="M3 6.5h11v9.5H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="17.8" r="1.7" />
    <circle cx="17.5" cy="17.8" r="1.7" />
  </svg>
);
const UsersIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.2a3.2 3.2 0 0 1 0 6M18.5 19a5.6 5.6 0 0 0-2.6-4.5" />
  </svg>
);
const WalletIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <rect x="3" y="6" width="18" height="13" rx="2.5" />
    <path d="M3 10.5h18" />
    <circle cx="16.5" cy="14.5" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);
const LogoutIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <path d="M15 12H4.5M4.5 12l3.4-3.4M4.5 12l3.4 3.4" />
    <path d="M10 4.5h6.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10" />
  </svg>
);
const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg {...svg(className)}>
    <path d="M14.5 6.5 9 12l5.5 5.5" />
  </svg>
);

type NavLink = { href: string; label: string; icon: ComponentType<IconProps>; managerOnly?: boolean };

const LINKS: NavLink[] = [
  { href: "/", label: "Tổng quan", icon: GridIcon },
  { href: "/lich", label: "Lịch", icon: CalendarIcon },
  { href: "/doanh-thu", label: "Doanh thu", icon: RevenueIcon, managerOnly: true },
  { href: "/tien-dau", label: "Tiền dầu", icon: FuelIcon },
  { href: "/xe", label: "Quản lý xe", icon: TruckIcon },
  { href: "/nhan-su", label: "Nhân sự", icon: UsersIcon },
  { href: "/luong", label: "Lương", icon: WalletIcon },
];

export default function Sidebar({
  isManager,
  name,
  position,
  defaultCollapsed = false,
}: {
  isManager: boolean;
  name: string;
  position: string;
  /** Trạng thái thu gọn ban đầu — layout đọc từ cookie để render đúng ngay từ server (không giật). */
  defaultCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const links = LINKS.filter((l) => !l.managerOnly || isManager);
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      // Nhớ lựa chọn qua cookie để layout (server) đọc lại lần tải sau → không nhấp nháy width.
      document.cookie = `sidebar_collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

  return (
    <aside
      className={`sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-hidden rounded-2xl bg-sidebar text-slate-300 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)] transition-[width] duration-200 ease-out ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header: logo (khi mở rộng) + nút thu gọn/mở rộng */}
      <div className={`flex h-16 items-center ${collapsed ? "justify-center px-2" : "gap-2.5 px-4"}`}>
        {!collapsed && (
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-dispatch-600 text-lg">🚐</span>
            <span className="truncate text-lg font-bold tracking-tight text-white">CarMS</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          aria-expanded={!collapsed}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white ${
            collapsed ? "" : "ml-auto"
          }`}
        >
          <ChevronLeftIcon className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Nav */}
      <LayoutGroup id="sidebar-navigation">
        <nav className={`flex-1 space-y-1 overflow-y-auto py-3 ${collapsed ? "px-2" : "px-3"}`}>
          {links.map((l) => {
            const active = isActive(l.href);
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                title={collapsed ? l.label : undefined}
                className={`relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.99] ${
                  collapsed ? "justify-center px-0" : "gap-3 px-3"
                } ${active ? "text-white" : "text-slate-400 hover:bg-white/[0.06] hover:text-white"}`}
              >
                {active && (
                  <motion.span
                    layoutId="active-sidebar-link"
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                    className="absolute inset-0 rounded-xl bg-dispatch-600 shadow-sm"
                  />
                )}
                <Icon className="relative z-10 h-5 w-5 shrink-0" />
                {!collapsed && <span className="relative z-10 truncate">{l.label}</span>}
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* Hồ sơ + đăng xuất */}
      <div className={`space-y-1 border-t border-white/10 ${collapsed ? "p-2" : "p-3"}`}>
        <Link
          href="/profile"
          title={collapsed ? name || "Tài khoản" : undefined}
          className={`flex items-center rounded-xl transition-all duration-150 hover:bg-white/[0.06] active:scale-[0.99] ${
            collapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-2"
          }`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-semibold text-white">
            {initial}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{name || "Tài khoản"}</span>
              <span className="block truncate text-xs text-slate-400">{position || "—"}</span>
            </span>
          )}
        </Link>
        <form action={logout}>
          <button
            type="submit"
            title={collapsed ? "Đăng xuất" : undefined}
            className={`flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-white/[0.06] hover:text-rose-300 active:scale-[0.99] ${
              collapsed ? "justify-center px-0" : "gap-3 px-3"
            }`}
          >
            <LogoutIcon className="h-5 w-5 shrink-0" />
            {!collapsed && "Đăng xuất"}
          </button>
        </form>
      </div>
    </aside>
  );
}
