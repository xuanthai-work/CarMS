import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}", // statusBg/toneBorderClass… trả về class Tailwind từ đây
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Thang độ nổi "control-room" — 1 nguồn thay cho các shadow-[...] copy tay.
        card: "0 10px 26px -24px rgba(15,23,42,0.8)", // thẻ, tile, toolbar
        panel: "0 14px 34px -28px rgba(15,23,42,0.8)", // bảng / danh sách
        hero: "0 18px 45px -24px rgba(15,23,42,0.8)", // header hồ sơ
      },
      colors: {
        // Bảng màu "control-room" (theo redesign brief).
        canvas: "#F5F7FA", // nền trang
        surface: "#FFFFFF", // thẻ / mặt phẳng
        ink: "#16233B", // chữ chính (slate-navy đậm)
        muted: "#64748B", // chữ phụ
        hairline: "#E6EAF1", // viền mảnh
        signal: "#F59E0B", // nhấn "chú ý" (mốc now, cảnh báo)
        sidebar: "#0f1729", // nền thanh điều hướng tối (deep navy)
        // Xanh điều phối — dùng cho nav/nút/link (giữ 'brand' cũ để không vỡ trang khác).
        dispatch: {
          50: "#eef2fe",
          100: "#dbe4fd",
          500: "#2F5BEA",
          600: "#2F5BEA",
          700: "#2447c4",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
