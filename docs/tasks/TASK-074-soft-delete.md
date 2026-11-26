# TASK-074: Xóa Mềm Xe, Lái Xe, Nhân Viên; Bỏ Ô "Ngày Nghỉ Việc"

## 1. Thông Tin Chung
- **Mã Task**: TASK-074
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: Xe / Nhân sự / Lương / Schema
- **Trạng thái**: **Đã xong (QA AUDIT PASS, lần 2)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Xóa thật làm mất phiếu dầu, phiếu công ngày (cascade), mất liên kết trên chuyến và lương cũ. User chốt: xóa là ẩn khỏi web, giữ nguyên dữ liệu cũ, không chặn. Xóa người ăn lương tháng thì chọn "Ngày làm cuối" (người chưa vào làm: tự ghi hôm nay). Không tự xóa tài khoản đang đăng nhập; từ chối nếu tháng sau ngày làm cuối đã trả lương hoặc có tạm ứng. Thêm trùng biển số xe đã xóa thì khôi phục.

## 3. Thay Đổi Theo File
- `schema.prisma`: `deletedAt` cho `Vehicle`, `Driver`, `OfficeStaff`; `supabase/scripts/11-add-soft-delete.sql` (chạy TRƯỚC deploy) và README.
- `utils/softDelete.ts`; services/types trả `deletedAt`; `getOfficeStaffByEmail` bỏ người đã xóa.
- `api/vehicles|drivers|staff.ts`: xóa mềm, trả `ActionResult`; `services/salary.ts` `validateSoftDeleteEndDate`.
- `ConfirmDeleteButton` nhận thêm trường và hiện lỗi; Card bỏ ô "Ngày nghỉ việc"; danh sách/ô chọn lọc mục đã xóa; `ScheduleGrid` "Theo xe" giữ xe đã xóa có chuyến, không điền sẵn xe đã xóa.
- AI tool xe/lịch lái xe lọc `deletedAt`; `AGENTS.md`; test mới và cập nhật.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (204), `npm run build` đạt.
- QA lần 1 FAIL: chuyến mới điền sẵn xe đã xóa sau khi đổi tháng; không xóa được người có ngày vào làm tương lai (lỗi spec).
- QA lần 2: `prisma db push` local; Playwright 1440px dữ liệu [QA test]: xóa xe đối tác giữ chuyến, tiền thuê 1.200.000 và công nợ đã trả (lưu lại vẫn giữ); phiếu dầu và phiếu công ngày còn tên/biển số; xóa lái xe nhà ngày làm cuối 10/11 → T10 đủ, T11 10/25 công 4.000.000, T12 không có; người vào làm tương lai xóa được; chặn tự xóa; khôi phục biển số; đổi tháng ở "Theo xe" chuyển sang xe đang dùng. Hộp xác nhận và lịch trên 430px (lần 1). Dữ liệu thử đã xóa.
- Chưa kiểm: đăng nhập bằng tài khoản nhân viên đã xóa (có unit test).
- Giới hạn: tài khoản Supabase Auth của người đã xóa vẫn còn (xóa thêm ở Authentication → Users); hồ sơ nhập nhầm không có ngày vào làm vẫn tính lương các tháng trước.
- Production: chạy `11-add-soft-delete.sql` TRƯỚC khi push.
