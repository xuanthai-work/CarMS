import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CarMS — Quản lý xe cho thuê",
  description: "Hệ thống điều xe & quản lý cho thuê xe (prototype)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
