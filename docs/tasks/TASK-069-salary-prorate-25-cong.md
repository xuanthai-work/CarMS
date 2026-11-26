# TASK-069: Tính Lương Theo Ngày Vào/Nghỉ Làm, 25 Ngày Công (GĐ 5, Bước 3/4)

## 1. Thông Tin Chung
- **Mã Task**: TASK-069
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: Lương / Nhân sự / Schema
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
1 tháng = 25 công. Công = min(25, số ngày lịch làm trong tháng, tính cả ngày vào và ngày nghỉ). Lương theo công = lương × công ÷ 25. Tháng có đổi mức lương (SalaryRate): trung bình có trọng số theo ngày của từng mức. Tạm ứng, thưởng, khấu trừ khác không tính theo tỷ lệ. Người chưa vào làm trong tháng thì không có dòng lương. Lái xe nhà chưa có "Ngày vào làm" nên task thêm trường này.

## 3. Thay Đổi Theo File
- `prisma/schema.prisma`: `Driver.startDate`; `supabase/scripts/09-add-driver-startdate.sql` và bước 10 trong `scripts/README.md`.
- `types`, `services/drivers.ts`, `api/drivers.ts`, `AddDriverButton`, `DriverCard`: trường "Ngày vào làm".
- `utils/salary.ts`: `workedDays`, `computeEarned`; `SalariedPerson` thêm `startDate/endDate/monthKey/rates`; `SalaryRow` thêm `workDays`, `earned`; `salaryNet` dùng `earned`; `salariedPeople` lọc người chưa vào làm.
- `SalaryMonthTable.tsx`: "X/25 công · lương theo công" dưới cột Cơ bản; dòng "Công tháng" chỉ đọc trong form.
- `AGENTS.md`; test `salary.test.ts`, `finance-system.test.ts`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (180), `npm run build` đạt.
- QA: `prisma db push` local; Playwright trên dữ liệu [QA test]: NV B nghỉ 15/08 (7M) → 15/25 công, 4.200.000; NV C vào làm 01/09 (5M) → đủ 5.000.000; LX vào làm 10/10 (8M) → 22/25 công, 7.040.000; NV A đổi mức 10M→12M từ 15/11 → tháng 11 là 11.066.667 (khớp ví dụ 10M×14 + 12M×16). Dữ liệu thử đã khôi phục.
- Chưa kiểm: iPhone 430px, form thêm/sửa lái xe với ô "Ngày vào làm" trên trình duyệt.
- Lưu ý: số các tháng cũ của người có ngày vào/nghỉ giữa tháng sẽ đổi (kể cả dòng đã trả) cho tới khi có chốt phiếu lương (TASK-070).
- Production: chạy tay `09-add-driver-startdate.sql` sau khi deploy.
