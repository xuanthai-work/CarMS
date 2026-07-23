import type { Metadata } from "next";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
