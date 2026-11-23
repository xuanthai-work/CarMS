# TASK-022: Ẩn Người Nghỉ Việc Khỏi Ô Chọn Lái Xe Và Chặn Đăng Nhập

## 1. Thông Tin Chung
- **Mã Task**: TASK-022
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: HR / Auth / Dispatch Calendar
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
TASK-021 thêm `endDate` nhưng mới áp dụng cho tính lương. Cần: (1) người đã nghỉ không còn trong ô chọn lái xe; (2) nhân viên văn phòng đã nghỉ không đăng nhập/dùng được hệ thống. Định nghĩa chung: đã nghỉ tại ngày D ⇔ `endDate < D` (ngày `endDate` vẫn là ngày làm cuối cùng).

## 3. Thay Đổi Theo File
- `web/src/utils/office.ts`, `office.test.ts`: helper `hasLeft(endDate, onDate)` + 4 ca test.
- `web/src/services/auth.ts`: `getCurrentStaff` trả `null` nếu đã nghỉ tại `todayStr()` → layout chuyển `/no-access`, `requireStaff/requireEditor` chặn ghi.
- `web/src/api/auth.ts`: `login` đăng xuất ngay và báo "Tài khoản này đã nghỉ việc, không thể đăng nhập.".
- `web/src/app/api/chat/route.ts`: trả 403 khi không có hồ sơ nhân sự (trước đó vẫn cho chat cấp nhân viên).
- `web/src/components/schedule/TripForm.tsx`: ô chọn lái xe lọc theo ngày của lượt, giữ lại lái xe đang được gán.
- `web/src/components/salary/PartnerPayoutTable.tsx`: lọc tương tự theo ngày làm, giữ người đang sửa.
- `OfficeStaffCard.tsx`, `DriverCard.tsx`: nhãn "Đã nghỉ việc" dùng `hasLeft`.

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx tsc --noEmit`: 0 lỗi.
- `npm test`: 10/10 files, 92/92 tests pass.
- `npm run build`: thành công.
- QA: đọc diff, đối chiếu 9/9 Acceptance Criteria; không có file ngoài phạm vi. Không chạy lại gate vì không có code mới.

## 5. Ghi Chú
- Không đổi schema. Tài khoản Supabase Auth của người nghỉ vẫn tồn tại, chỉ không vào được ứng dụng.
- Chưa chặn ở server khi gửi thẳng lái xe đã nghỉ vào form chuyến (lọc ô chọn chỉ ở giao diện).
