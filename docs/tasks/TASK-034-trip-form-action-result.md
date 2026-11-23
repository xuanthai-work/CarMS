# TASK-034: Form Chuyến Dùng ActionResult (Lỗi Tiếng Việt Trên Production)

## 1. Thông Tin Chung
- **Mã Task**: TASK-034
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
`TripForm` hiện `err.message` từ `saveTrip`/`deleteTrip`; trên production Next che nội dung lỗi ném từ Server Action nên banner chỉ hiện câu chung. Áp dụng mẫu `ActionResult` của TASK-033.

## 3. Thay Đổi Theo File
- `web/src/api/trips.ts`: `saveTrip`/`deleteTrip` trả `ActionResult`. Kiểm tra tên khách, ngày đi, ngày về (khi có lượt về); lỗi quyền, lỗi DB trả thông điệp tiếng Việt (`console.error` ghi log); xóa chuyến đã bị xóa (P2025) coi là thành công.
- `web/src/components/schedule/TripForm.tsx`: đọc `r.ok`/`r.error`; `catch` chỉ còn lỗi mạng với câu cố định, không còn `err.message`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (122 test), `npm run build` đều đạt.
- QA (Playwright + DB local): bỏ trống ngày đi → banner "Vui lòng chọn ngày đi.", modal mở, DB không có dòng; thêm hợp lệ lưu đúng; xóa chuyến đã bị xóa từ nơi khác không lỗi, modal đóng; xóa thường xóa đúng. Không lỗi console/HTTP 500.
- Chưa kiểm: nhánh lỗi quyền/DB bất ngờ (chỉ đọc code).
