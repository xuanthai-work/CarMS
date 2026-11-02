# TASK-018: Sửa Cảnh Báo Supabase Auth getSession & Xử Lý Lỗi Form Thêm Chuyến

## 1. Thông Tin Chung
- **Mã Task**: TASK-018
- **Ngày hoàn thành**: 2026-11-02
- **Phân hệ**: Auth & Security / Dispatch Calendar Form
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**

---

## 2. Mục Tiêu & Vấn Đề Xử Lý
- **Vấn đề 1 (Supabase Auth Warning)**:
  - Trên Vercel logs xuất hiện liên tục cảnh báo:
    `Using the user object as returned from supabase.auth.getSession() ... could be insecure! ... Use supabase.auth.getUser() instead`
  - Do `getCurrentUser()` trong `web/src/services/auth.ts` dùng `supabase.auth.getSession()` chỉ giải mã token từ cookie local mà không kiểm tra tính xác thực với Auth server, đồng thời không hỗ trợ tự động refresh token trong server actions.
- **Vấn đề 2 (Không thể thêm chuyến & Nuốt lỗi)**:
  - Khi phiên đăng nhập hết hạn hoặc Server Action gặp sự cố (bị chặn quyền `requireEditor`, lỗi kết nối/database), hàm `handleSave` tại `web/src/components/schedule/TripForm.tsx` chỉ có `try ... finally` mà không có `catch`.
  - Hậu quả: Form nuốt lỗi âm thầm, modal không đóng và không có bất kỳ thông báo lỗi nào hiển thị cho người dùng.

---

## 3. Các File Thay Đổi
- `web/src/services/auth.ts`:
  - Thay thế `supabase.auth.getSession()` bằng `supabase.auth.getUser()`.
  - Xử lý trả về `error ? null : (user ?? null)`.
  - Giữ nguyên cơ chế `cache()` của React để tránh lặp lại request trong cùng một render cycle.
- `web/src/components/schedule/TripForm.tsx`:
  - Thêm state `error` (string | null).
  - Bổ sung khối `catch` trong `handleSave` và `handleDelete` để bắt ngoại lệ từ Server Action và set vào `error`.
  - Thêm banner thông báo lỗi màu đỏ (`role="alert"`) ở đầu modal form.
  - Tự động xoá lỗi (`setError(null)`) khi người dùng chỉnh sửa form (`onInput`) hoặc bấm submit lại.

---

## 4. Kết Quả Verification Gates
- **TypeScript Typecheck**: `npx tsc --noEmit` -> **0 lỗi (PASS)**.
- **Vitest Test Suite**: `npm test` -> **10/10 test files, 79/79 tests passed (PASS)**.
- **Next.js Production Build**: `npm run build` -> **Compiled & Generated static/dynamic routes successfully (PASS)**.
