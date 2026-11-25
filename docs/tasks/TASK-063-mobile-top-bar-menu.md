# TASK-063: Thanh Menu Trên Điện Thoại — Thanh Trên Cùng + Ngăn Menu Trượt (Dưới 768px)

## 1. Thông Tin Chung
- **Mã Task**: TASK-063
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: UI / Mobile / Layout
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Trên điện thoại thanh menu dọc luôn chiếm ~76px (~18% bề ngang), nội dung chật. User đồng ý đổi sang thanh trên cùng + ngăn menu trượt, chỉ dưới 768px; từ 768px trở lên giữ nguyên.

## 3. Thay Đổi Theo File
- `components/layout/Sidebar.tsx`: `<aside>` thêm `hidden md:flex` (giữ nguyên thu gọn/cookie); thêm thanh trên `md:hidden` (cao 56px, ☰ 44×44, logo, avatar → `/profile`), ngăn menu trượt (`role="dialog"`, `aria-modal`), lớp nền mờ, animation tôn trọng giảm chuyển động, khóa cuộn nền, đóng khi chọn mục/đổi trang/bấm nền/✕/Esc/≥768px, quản lý focus.
- `app/(main)/layout.tsx`: khung `flex-col md:flex-row`; `<main>` `px-3 md:px-1`.
- `app/(main)/lich/page.tsx`: chiều cao `h-[calc(100dvh-6.5rem)] md:h-[calc(100dvh-3rem)]` (trừ thanh trên).

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright): 430px aside ẩn, thanh trên 56px, ☰ ≥ 44px, `main` chiếm trọn bề ngang; mở ngăn thấy đủ 9 mục (đúng quyền), mục đang chọn tô, khóa cuộn nền, `aria-expanded` đúng; chọn "Lịch" điều hướng và đóng, focus về ☰; Esc, bấm nền, ✕ đều đóng; Lịch không có hai thanh cuộn (trang cao đúng bằng viewport); drawer form phủ lên thanh trên; không tràn ngang ở cả 10 màn; 768px/1024px sidebar 64px, 1440px 240px (không đổi), thanh trên ẩn.
- Chưa kiểm: iPad xoay ngang giữa 768–1279px với cookie thu gọn khác (logic cũ không đổi), tài khoản chỉ-xem.
- Còn lại (chưa làm): vùng bấm bé khác (mũi tên đổi tháng 39×32, chip trạng thái 34px).
