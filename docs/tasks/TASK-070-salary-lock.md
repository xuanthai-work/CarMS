# TASK-070: Chốt Phiếu Lương + Mở Chốt (GĐ 5, Bước 4/4)

## 1. Thông Tin Chung
- **Mã Task**: TASK-070
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: Lương / Schema
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Số lương tính động nên sửa lương, ngày vào/nghỉ, mức lương hiệu lực hoặc tạm ứng làm đổi số tháng đã trả. Chốt phiếu lưu snapshot (`baseSalary`, `workDays`, `earned`, `advances`); dòng đã chốt dùng snapshot ở trang Lương, Doanh thu và AI tool. Ai có quyền sửa cũng Mở chốt được.

## 3. Thay Đổi Theo File
- `prisma/schema.prisma`: `SalaryMonth` thêm `locked`, `lockedAt`, `workDays`, `earned`, `advances`; `supabase/scripts/10-add-salary-lock.sql` và bước 11 trong `scripts/README.md`.
- `types`, `services/salary.ts`: các trường mới.
- `utils/salary.ts`: `SalaryRow.locked`; `buildSalaryRows` dùng snapshot khi `locked && earned != null`.
- `api/salary.ts`: `lockSalaryMonth`, `unlockSalaryMonth`, `lockSalaryMonthAll` (chung `lockOneSalaryMonth`, server tự tính); `saveSalaryMonth` bỏ qua thưởng/khấu trừ khi đã chốt; `saveSalaryAdvance`/`deleteSalaryAdvance` bị chặn nếu tháng ngày cũ/mới đã chốt.
- `SalaryMonthTable.tsx`: nhãn "🔒 Đã chốt", form khóa ô thưởng/khấu trừ và ẩn thêm/xóa tạm ứng, nút "Chốt phiếu"/"Mở chốt". `SalaryScreen.tsx`: nút "Chốt tất cả" (confirm).
- `AGENTS.md`; test `salary.test.ts`, `api/salary.test.ts`, `finance-system.test.ts`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (187), `npm run build` đạt.
- QA: `prisma db push` local; Playwright 1440px (COO) với [QA test] NV B nghỉ 15/08 (7M): chốt → DB lưu workDays 15, earned 4.200.000; đổi ngày nghỉ 31/08 và lương 9M thì dòng vẫn 15/25 công · 4.200.000; Mở chốt → tính lại động; "Chốt tất cả" tháng 9 chốt hết dòng và ẩn nút. Dữ liệu thử đã khôi phục/xóa (kể cả dòng tháng 9 tạo tự động).
- Chưa kiểm: iPhone 430px (footer 2 nút trong drawer), chặn thêm/xóa tạm ứng trên UI (có unit test), tài khoản chỉ-xem.
- Nit còn lại: `api/salary.test.ts` có khối `describe("deleteSalaryAdvance")` lặp; schema `SalaryMonth` căn lề không đều.
- Production: chạy tay `10-add-salary-lock.sql` sau khi deploy.
