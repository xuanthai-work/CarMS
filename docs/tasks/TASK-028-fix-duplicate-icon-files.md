# TASK-028: Sửa Xung Đột File Icon Trùng

## 1. Thông Tin Chung
- **Mã Task**: TASK-028
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Tooling / Frontend
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
`npm run dev` báo `A conflicting public file and page file was found for path /icon.png` (và `/favicon.ico`), trả 500. Nguyên nhân: `favicon.ico` và `icon.png` có ở cả `web/public/` và `web/src/app/` (cùng hash). Next.js coi file trong `src/app/` là route icon tự động, trùng với file tĩnh trong `public/`. Commit `72b6daa` đã thêm bản sao vào `public/`.

## 3. Thay Đổi Theo File
- `web/src/app/favicon.ico`: xóa.
- `web/src/app/icon.png`: xóa.
- Giữ `web/public/favicon.ico` và `web/public/icon.png` (đã khớp khai báo `icons` trong `layout.tsx`).

## 4. Kết Quả Verification Gates (Dev chạy)
- Hash hai cặp file khớp nhau trước khi xóa (`d57811bd…` và `1ff0f1e1…`).
- Runtime: `/favicon.ico` 200, `/icon.png` 200, `/manifest.webmanifest` 200; log không còn `conflicting public file`.
- `npm test`: 93/93 pass. `npx tsc --noEmit`: 0 lỗi. `npm run build`: thành công.
- QA: diff chỉ có đúng hai file bị xóa; `public/` còn đủ icon. Số trang tĩnh khi build giảm 22 → 20 là hai route icon tự động đã biến mất, đúng kỳ vọng. Không chạy lại gate.

## 5. Ghi Chú
- Lỗi này cũng có thể xảy ra trên production (Vercel); sau khi deploy nên kiểm icon tab.
