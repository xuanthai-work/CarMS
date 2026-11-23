# TASK-038: Modal Chuyến Thống Nhất (Thêm / Xem / Sửa)

## 1. Thông Tin Chung
- **Mã Task**: TASK-038
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX (giai đoạn 2)
- **Trạng thái**:  **Đã xong (QA AUDIT PASS, sau 1 lần trả sửa)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User chốt: thêm, xem, sửa chuyến dùng đúng một modal, mở ra là sửa luôn (không chế độ xem, không nút chuyển). Bỏ ô SĐT khách; giờ đón là chữ tự do; điểm đón + điểm đến gộp thành một ô "Lộ trình" chữ tự do mỗi lượt; ghi chú là ô lớn nhiều dòng; ngày đi/về giữ bộ chọn ngày và logic cũ. Không đổi schema, không đổi logic tiền.

## 3. Thay Đổi Theo File
- `components/schedule/TripModal.tsx`: viết lại thành vỏ mỏng quanh `Modal` + `TripForm`; bỏ chế độ xem, `LegView`, `FinanceMetric`.
- `components/schedule/TripForm.tsx`: bố cục mới (khách + trạng thái, dải Tiền, loại tour tự tính, hai lượt đi/về, ghi chú 8 dòng); giờ đón và Lộ trình là ô chữ; dòng chỉ-đọc "Chi phí cũ ghi trên chuyến" khi chuyến có `tollCost`/`otherCost`; `fieldset disabled` + ẩn Lưu/Xóa cho tài khoản chỉ-xem; gửi bằng `onSubmit` + `FormData(e.currentTarget)` trong `startTransition` để lỗi không xóa dữ liệu đã nhập.
- `api/trips.ts`: `legFields` đọc `from` từ `{prefix}_route`, `to` rỗng; `customerPhone` chỉ ghi khi có trong FormData (sửa chuyến cũ không mất SĐT).
- `components/common/TimePicker.tsx`: xóa (không còn nơi dùng).

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt (cả sau lần sửa).
- QA lần 1 FAIL: `action={handleSave}` làm React 19 reset form khi lưu lỗi, mất tên khách và ghi chú (đặc tả của BA đã dặn giữ `action`, sai). Dev chuyển sang `onSubmit`.
- QA lần 2 (Playwright, 17 kiểm tra đạt): mở chuyến từ lưới và từ màn Doanh thu vào thẳng cùng form sửa; không có ô SĐT, không nút "Chỉnh sửa"; chuyến cũ hiện "Hà Nội → Sapa" trong ô Lộ trình và dòng chi phí cũ; sửa giờ "6h30 sáng sớm", lộ trình, ghi chú nhiều dòng → DB `outboundFrom` = chữ nhập, `outboundTo` rỗng, giữ nguyên SĐT, `tollCost`, `otherCost`; mở lại hiện đúng; Esc đóng; thêm chuyến thiếu ngày đi hiện banner, tên khách và ghi chú còn nguyên; sửa ngày rồi thêm thành công; 390px không tràn ngang.
- Chưa kiểm bằng trình duyệt: tài khoản chỉ-xem (`canEdit=false`), đã đọc code thấy đúng.
- Ghi nhận: ghi chú xuống dòng được lưu dạng CRLF (trình duyệt chuẩn hóa khi gửi form), hiển thị bình thường.
- Theo dõi: giờ đón chữ tự do nên các chỗ sắp xếp theo giờ (`dashboard/Overview.tsx`, `revenue/RevenueScreen.tsx`, `services/trips.ts`) sắp theo chuỗi ("10h" đứng trước "6h"). Chưa sửa.
