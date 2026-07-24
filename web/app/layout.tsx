import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Một font duy nhất cho toàn app (có glyph tiếng Việt). Số dùng tabular-nums để canh cột.
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CarMS — Quản lý xe cho thuê",
  description: "Hệ thống điều xe & quản lý cho thuê xe (prototype)",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CarMS" },
  icons: { apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  viewportFit: "cover",
  // KHÔNG đặt maximumScale/ userScalable=false — giữ accessibility (cho phép zoom).
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
