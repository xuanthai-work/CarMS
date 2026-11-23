# TASK-039: Form Chuyến Bố Cục Phẳng (Kiểu Ghi Chú)

## 1. Thông Tin Chung
- **Mã Task**: TASK-039
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX (giai đoạn 2)
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Sau TASK-038 form chuyến vẫn là các thẻ màu, nhiều chữ gợi ý, ô "Lượt về" trống lớn. User muốn kiểu ghi chú: mỗi dòng "nhãn — ô nhập", một cột, ít chữ, không thẻ.

## 3. Thay Đổi Theo File
- `components/schedule/TripForm.tsx`: helper `Row` (nhãn 7,5rem + ô), bỏ thẻ/viền/nền màu, bỏ dòng loại tour, dòng thứ ngày, placeholder dài, nhãn "(tự do)"; xe đối tác chỉ ẩn ô lái xe; dòng lượt về chỉ hiện khi tick; giữ nguyên tên ô, `onSubmit`, quyền chỉ-xem.
- `components/schedule/TripModal.tsx`: `max-w-2xl`, tiêu đề "Thêm chuyến" / "Sửa chuyến".

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt.
- QA (Playwright, chạy lại bộ kiểm TASK-038): mở/sửa/lưu, giữ SĐT và chi phí cũ, lỗi giữ dữ liệu, thêm hợp lệ, 390px, màn Doanh thu đều đạt; chỉ kiểm tra tiêu đề cũ ("Chuyến: tên") không còn đúng do đổi tiêu đề theo thiết kế.
- User xem ảnh thực tế và đưa thêm yêu cầu chỉnh bố cục (gộp dòng, modal cố định kích thước, footer dính đáy) → TASK-040.
