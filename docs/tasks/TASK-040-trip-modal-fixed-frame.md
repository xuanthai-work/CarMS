# TASK-040: Modal Chuyến Khung Cố Định, Footer Dính Đáy

## 1. Thông Tin Chung
- **Mã Task**: TASK-040
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX (giai đoạn 2)
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User xem TASK-039 và chốt thêm: modal cố định kích thước, thân cuộn trong, footer nhỏ dính đáy (Lưu + Xóa), bỏ nút Hủy (đã có ✕), thanh cuộn mảnh; gom dòng (Khách·Trạng thái, Tiền chuyến·Đã cọc, Xe·Lái xe, Giờ đón đi·về, Ngày đi rồi Ngày về có checkbox "Về"); một ô Lộ trình tổng; giờ đón quay lại ô chọn giờ (`TimePicker`); tiêu đề chuyến có sẵn là "Chuyến".

## 3. Thay Đổi Theo File
- `common/Modal.tsx`: prop tùy chọn `fixedHeight` (cao `min(46rem, 100dvh-2rem)`, thân `overflow-y-auto scroll-thin`, header/footer `shrink-0`) và `footer`; mặc định giữ nguyên cho các modal khác.
- `app/globals.css`: lớp `.scroll-thin` (thanh cuộn 8px, bo tròn, màu nhạt).
- `common/TimePicker.tsx`: khôi phục nguyên vẹn (TASK-038 đã xóa).
- `schedule/TripModal.tsx`: bật `fixedHeight`, nhận footer từ form; tiêu đề "Chuyến"/"Thêm chuyến".
- `schedule/TripForm.tsx`: `Row`/`Row2` (nhãn riêng từng ô, nhãn đầu `6rem` thẳng hàng), một ô Lộ trình, footer (xóa nhỏ bên trái, Lưu bên phải) đẩy lên Modal qua `renderFooter`.
- `api/trips.ts`: lượt về lưu cùng lộ trình với lượt đi (`returnFrom = outboundFrom`, `returnTo = ""`).

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt.
- QA (Playwright, 15 kiểm tra đạt + ảnh chụp): tiêu đề "Chuyến"; không có Hủy/Đóng chữ; đủ nhãn; một ô Lộ trình (chuyến cũ hiện "đi · Về: về"); giờ 07:00/15:30; Lưu nằm trong viewport; footer đứng yên khi cuộn thân; bỏ tick Về khung giữ nguyên 672×736; lưu có lượt về → `outboundFrom = returnFrom`, `to` rỗng, giờ về và SĐT giữ nguyên; thêm mới hiện banner khi thiếu ngày đi và giữ dữ liệu; xóa từ footer; 390px không tràn ngang.
- Lưu ý: ở 1440×900 chuyến có lượt về vừa khung, không cần cuộn; thanh cuộn chỉ hiện ở màn thấp hơn. Ô ghi chú chưa co giãn lấp khoảng trống dưới cùng (nhỏ). Bộ kiểm tra hiệu ứng zoom cũ (acc036) đang trỏ vào màn Thêm xe nay là SideDrawer nên không còn đo được; phần Modal không đổi hành vi cho chỗ khác theo diff.
