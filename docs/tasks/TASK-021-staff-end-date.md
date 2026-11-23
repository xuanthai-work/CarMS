# TASK-021: Ngày Nghỉ Việc Cho Nhân Sự Và Lái Xe

## 1. Thông Tin Chung
- **Mã Task**: TASK-021
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: HR / Salary / Operational Finance
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
`salariedPeople` lấy toàn bộ nhân viên văn phòng và lái xe `own` cho mọi tháng, nên người đã nghỉ vẫn bị tính lương. Dùng `endDate` (null = đang làm) thay cho cờ đúng/sai để các tháng trước khi nghỉ giữ nguyên chi phí lương lịch sử. Quy tắc: còn tính lương cho tháng chứa `endDate` và mọi tháng trước; không tính từ tháng sau.

## 3. Thay Đổi Theo File
- `web/prisma/schema.prisma`: thêm `endDate String?` vào `Driver` và `OfficeStaff` (cột nullable).
- `web/src/types/index.ts`, `services/staff.ts`, `services/drivers.ts`: kiểu và mapper (`endDate ?? null`).
- `web/src/api/staff.ts`, `api/drivers.ts`: ghi `endDate` chỉ khi form có gửi field (không ghi đè khi không gửi).
- `web/src/utils/salary.ts`: `salariedPeople(office, drivers, monthKey?)` lọc theo tháng; không truyền `monthKey` thì không lọc.
- `web/src/utils/salary.test.ts`: test hồi quy theo tháng, driver own/partner, không monthKey, tích hợp với `salaryCostBreakdownForMonth`.
- `luong/page.tsx`, `doanh-thu/page.tsx` (lọc theo từng tháng trong vòng lặp), `systemTools.ts` (2 tool): truyền `monthKey`.
- `OfficeStaffCard.tsx`, `DriverCard.tsx`: ô "Ngày nghỉ việc" (có nút "Xóa ngày nghỉ"), hiển thị ngày nghỉ, nhãn "Đã nghỉ việc" theo `todayStr()`.

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx tsc --noEmit`: 0 lỗi.
- `npm test`: 10/10 files, 88/88 tests pass.
- `npm run build`: thành công.
- QA: đọc diff, đối chiếu 8/8 Acceptance Criteria; không có file ngoài phạm vi. Không chạy lại gate vì không có code mới.

## 5. Việc User cần làm
- Chạy `npm run db:push` để thêm cột `endDate` lên DB **trước khi deploy code**. Không cần `db:realtime` (bảng đã có RLS).

## 6. Chưa làm (ngoài phạm vi)
- Ẩn người đã nghỉ khỏi các ô chọn lái xe ở form chuyến.
- Chặn đăng nhập của nhân viên văn phòng đã nghỉ.
