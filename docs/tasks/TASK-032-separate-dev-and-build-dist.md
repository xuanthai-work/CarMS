# TASK-032: Tách Thư Mục Đầu Ra Của Dev Và Build

## 1. Thông Tin Chung
- **Mã Task**: TASK-032
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Tooling
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
`npm run dev` và `npm run build` dùng chung `web/.next`; chạy build lúc dev server đang mở làm dev server hỏng (`Cannot find module './611.js'`, trả 500). Tách hẳn: dev dùng `.next-dev`, build/start dùng `.next`.

## 3. Thay Đổi Theo File
- `web/next.config.mjs`: export hàm theo pha, `distDir` = `.next-dev` khi `PHASE_DEVELOPMENT_SERVER`, ngược lại `.next`.
- `web/tsconfig.json`: thêm `.next-dev/types/**/*.ts` vào `include`.
- `web/.gitignore`: thêm `/.next-dev`.

## 4. Kết Quả Verification
- Dev: `tsc` sạch, `npm test` 111/111 pass; bài kiểm đồng thời (dev + build) đạt.
- QA tự chạy lại bài kiểm chính: bật `npm run dev` (tạo `.next-dev`), `/login` 200; chạy `npm run build` trong lúc dev chạy (exit 0, tạo `.next`); `/login` vẫn 200, log dev không có `Cannot find module`.
- Diff chỉ đúng 3 file.

## 5. Ghi Chú
- Dev server nền do Claude duy trì cho User (xem `CLAUDE.md` mục 3b, `DEV.md` mục 6b; hai file điều phối chưa commit).
