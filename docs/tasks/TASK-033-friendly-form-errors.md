# TASK-033: Lỗi Form Thân Thiện (Trùng Biển Số, Trùng Email)

## 1. Thông Tin Chung
- **Mã Task**: TASK-033
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Vehicles / Staff / UX
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Quét lỗi giai đoạn 0 phát hiện: thêm xe trùng biển số và thêm/sửa nhân sự văn phòng trùng email làm sập trang (lỗi Prisma thô, HTTP 500). Trên production Next che nội dung lỗi ném từ Server Action nên người dùng chỉ thấy trang lỗi chung. Yêu cầu: lỗi nghiệp vụ dự kiến trả về như kết quả, form hiện banner đỏ trong modal, modal vẫn mở, dữ liệu đã nhập còn nguyên.

## 3. Thay Đổi Theo File
- `web/src/utils/actionResult.ts` (+ `.test.ts`, 11 test): `ActionResult`, `OK`, `fail`, `uniqueViolationFields` (nhận diện P2002 qua `meta.target`, `driverAdapterError`, hoặc phân tích message).
- `web/src/components/common/ui.tsx`: thêm `FormError` (banner `role="alert"`).
- `web/src/api/vehicles.ts`: `saveVehicle` trả `ActionResult` (biển số rỗng, P2002 → thông điệp tiếng Việt); `quickCreateVehicle` dùng lại xe đã có.
- `web/src/api/staff.ts`: `saveOfficeStaff` trả `fail(...)` khi trùng email.
- `AddVehicleButton`, `VehicleCard`, `AddOfficeStaffButton`, `OfficeStaffCard`: dùng `onSubmit` + `preventDefault` + `startTransition` thay cho `action={...}` (tránh React 19 reset form khi lỗi), hiện `FormError`, xóa lỗi khi gõ/đóng/mở lại, khóa nút khi đang gửi.

## 4. Kết Quả Kiểm Chứng
- Dev: vitest actionResult 11/11, `tsc --noEmit --noUnusedLocals`, `npm test` 122 test, `npm run build` đều đạt.
- QA (Playwright trên dev server + đối chiếu DB local, 21 kiểm tra đều đạt): thêm xe trùng biển số → modal mở, banner, giá trị còn nguyên, DB không thêm; banner mất khi gõ và khi đóng/mở lại; thêm xe hợp lệ đóng modal và lưu; sửa xe sang biển số trùng → banner, DB không đổi; sửa hợp lệ lưu được; thêm nhân sự trùng email (không phân biệt hoa thường) và sửa sang email trùng → banner, dữ liệu còn; thêm hợp lệ lưu được; không lỗi console, không HTTP 500.
- Chưa kiểm bằng giao diện: `quickCreateVehicle` (đã đọc code: tìm theo `plate` trước khi tạo).

## 5. Việc Tiếp Theo
Banner lỗi của `TripForm` (TASK-018) vẫn dùng `err.message`, trên production sẽ bị che; xử lý ở task sau theo mẫu `ActionResult`.
