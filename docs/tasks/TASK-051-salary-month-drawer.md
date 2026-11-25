# TASK-051: Sửa Lương Tháng Bằng SideDrawer (Phase 6, Màn Lương → Lương Tháng)

## 1. Thông Tin Chung
- **Mã Task**: TASK-051
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Salary / UX (Phase 6)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Sửa lương tháng dùng Modal + form `action=`; `saveSalaryMonth` trả `void`, không báo lỗi và ghi `paid=true` với `paidDate=null` được. Chuyển sang Drawer + `ActionResult`. Không đổi cách tính tiền.

## 3. Thay Đổi Theo File
- `api/salary.ts`: `saveSalaryMonth` trả `ActionResult`; kiểm `personId`/`monthKey`/`personType` ("Không xác định được người hoặc tháng lương."), đã trả thiếu ngày ("Vui lòng chọn ngày trả lương."), upsert bọc try/catch ("Không lưu được. Vui lòng thử lại."). Quyền (`requireManagerEditor` cho office, `requireEditor` cho driver), `fields`, snapshot `baseSalary` giữ nguyên. `savePartnerPayout`/`deletePartnerPayout` không đổi.
- `components/salary/SalaryMonthTable.tsx`: `SalaryEditForm` tự dựng `SideDrawer` "Sửa lương — <tên>", `onSubmit` + `noValidate` + `FormError`, một cột, footer chỉ có Lưu; bỏ `Modal`.
- `api/salary.test.ts` (mới, Dev khai): 5 test cho `saveSalaryMonth` (thiếu id/tháng, personType sai, đã trả thiếu ngày, lưu hợp lệ kiểm `baseSalary` snapshot và fields, upsert lỗi).

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (142), `npm run build` đạt.
- QA (Playwright, `qa-claude`): Drawer mở đúng tiêu đề; chọn Đã thanh toán mà thiếu ngày → banner, Drawer còn mở, dữ liệu nhập giữ nguyên; đổi về Chưa thanh toán rồi lưu → bảng cập nhật, DB tạo bản ghi tháng (`additions` 500000, `baseSalary` snapshot 0 = lương hiện tại, `paid=false`); mở lại điền sẵn; Esc đóng.
- Chưa kiểm bằng trình duyệt: tài khoản chỉ-xem, quyền office vs driver ở UI.
- Ghi nhận ngoài phạm vi: trang `/luong` ở 390px rộng 397px (tràn 7px) kể cả khi Drawer đóng, do bảng `min-w-[880px]`/bố cục trang có sẵn, không do task này.
