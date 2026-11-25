# TASK-067: Tạm Ứng Lương Riêng (GĐ 5, Bước 1/4)

## 1. Thông Tin Chung
- **Mã Task**: TASK-067
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Lương / Schema
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt tách tạm ứng khỏi ô `deductions`: ghi nhiều lần (ngày, số tiền, ghi chú), tính vào tháng của ngày ứng, trừ vào lương tháng đó, không chuyển nợ. Thực nhận = cơ bản + thưởng − khấu trừ khác − tạm ứng.

## 3. Thay Đổi Theo File
- `prisma/schema.prisma`: model `SalaryAdvance` (+2 index). Script production `supabase/scripts/07-add-salary-advance.sql` (tạo bảng, index, bật RLS) + bước trong `scripts/README.md`.
- `types/index.ts`, `services/salary.ts`: type và `getSalaryAdvances(monthKey?)`.
- `utils/salary.ts`: `SalaryRow.advances`; `salaryNet`, `buildSalaryRows`, `salaryCostByMonth` nhận `advances` (tham số mặc định, tương thích cũ).
- `api/salary.ts`: `saveSalaryAdvance`, `deleteSalaryAdvance` (ActionResult, guard theo `personType`).
- `luong/page.tsx`, `doanh-thu/page.tsx`, `services/tools/salary.ts`, `services/tools/finance.ts`: truyền tạm ứng để Lương, Doanh thu và công cụ AI ra cùng một số.
- `SalaryScreen.tsx`, `SalaryMonthTable.tsx`: mục "Tạm ứng trong tháng" trong drawer (liệt kê, xóa, thêm nhanh không đóng drawer), nhãn "Khấu trừ khác", cột Điều chỉnh gộp `−(khấu trừ + tạm ứng)` kèm tooltip.
- `AGENTS.md`: ghi quyết định kiến trúc.
- Test: `salary.test.ts` (22), `api/salary.test.ts` (19), cập nhật `finance-system.test.ts`, `systemTools.test.ts`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (170), `npm run build` đạt.
- QA: `prisma db push` local; Playwright (1440px, tài khoản COO): thêm 2 lần ứng (1.000.000 + 500.000) cho một nhân viên → drawer không đóng, danh sách 2 dòng; thực nhận giảm đúng 1.500.000; cột Điều chỉnh `+500.000 −1.500.000`, tooltip "Tạm ứng 1.500.000 · Khấu trừ khác 0"; tháng 10 không bị ảnh hưởng; xóa 1 lần còn 1; bỏ trống số tiền hiện lỗi "Vui lòng nhập số tiền."; không lỗi console. Dữ liệu `[QA test]` còn lại: 1 lần ứng 1.000.000 (25/11/2026).
- Chưa kiểm trên trình duyệt: iPhone 430px cho mục tạm ứng, tài khoản chỉ-xem (CEO), đối chiếu số Doanh thu với trang Lương (đã có unit test).
- Production: cần chạy tay `07-add-salary-advance.sql` sau khi deploy.
