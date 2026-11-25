# TASK-068: Mức Lương Cơ Bản Có Ngày Hiệu Lực + Lịch Sử (GĐ 5, Bước 2/4)

## 1. Thông Tin Chung
- **Mã Task**: TASK-068
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Lương / Nhân sự / Schema
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Đổi `baseSalary` trước đây làm lệch mọi tháng chưa có dòng lương. Quy tắc: lương của một tháng = mức có `effectiveFrom` lớn nhất ≤ ngày đầu tháng; không có mức nào thì dùng `baseSalary` hiện lưu. Hiệu lực giữa tháng thì tháng đó vẫn mức cũ (tỷ lệ hai mức: TASK-069). Dòng `SalaryMonth` đã có giữ snapshot.

## 3. Thay Đổi Theo File
- `prisma/schema.prisma`: model `SalaryRate`; `supabase/scripts/08-add-salary-rate.sql` (+RLS) và bước trong `scripts/README.md`.
- `types/index.ts`, `services/salary.ts`: `getSalaryRates()`, `recordSalaryRate()` (tự tạo mốc gốc `1970-01-01` ở lần đổi đầu; trùng ngày thì cập nhật).
- `utils/salary.ts`: `resolveBaseSalary`; `salariedPeople(..., rates)`, `salaryCostByMonth(..., advances, rates)`.
- `api/salary.ts`: `lookupBaseSalary` theo tháng. `api/staff.ts`, `api/drivers.ts`: đổi lương → ghi rate trong `$transaction`, thiếu ngày hiệu lực thì báo lỗi.
- `luong/page.tsx`, `doanh-thu/page.tsx`, `nhan-su/page.tsx`, `services/tools/salary.ts`, `finance.ts`: truyền `rates`.
- `DriverCard`, `OfficeStaffCard`, `DriverList`, `OfficeStaffList`, `StaffTabs`: ô "Có hiệu lực từ" (chỉ hiện khi đổi số lương) và khối "Lịch sử lương".
- `AGENTS.md`; test: `salary.test.ts`, `api/salary.test.ts`, mới `api/staff.test.ts`, `api/drivers.test.ts`, `systemTools.test.ts`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (179), `npm run build` đạt.
- QA: `prisma db push` local; Playwright 1440px (COO), nhân viên [QA test] NV A (10M): ô "Có hiệu lực từ" ẩn lúc đầu, hiện khi đổi lương; đổi lên 12M hiệu lực 25/11 → tháng 10 và 11 vẫn 10M, tháng 12 là 12M; lịch sử "Từ trước tới nay 10.000.000 / Từ 25/11/2026 12.000.000"; đổi tiếp 13M hiệu lực 15/01/2027 → tháng 12/2026 và 01/2027 là 12M, 02/2027 là 13M; Doanh thu tải bình thường, không lỗi console. Dữ liệu thử đã khôi phục (xóa rate, lương về 10M).
- Chưa kiểm: iPhone 430px cho form có ô hiệu lực, form lái xe nhà trên trình duyệt (cùng mã), tài khoản chỉ-xem, thiếu ngày hiệu lực (có unit test).
- Production: chạy tay `08-add-salary-rate.sql` sau khi deploy.
