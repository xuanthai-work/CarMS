# TASK-073: Ô "Thuê Đối Tác" Nằm Cạnh Ô Xe

## 1. Thông Tin Chung
- **Mã Task**: TASK-073
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: Lịch / Form chuyến
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User muốn ô tiền thuê đối tác nằm cạnh ô xe khi chọn xe đối tác. Giữ nguyên cách xử lý tiền. Mỗi chuyến một ô: lượt đi ưu tiên; chỉ lượt về là đối tác thì nằm ở dòng "Xe về".

## 3. Thay Đổi Theo File
- `TripForm.tsx`: bỏ dòng riêng; đặt ô tiền ở cột phải của dòng xe; giữ giá trị trong state.
- `MoneyInput.tsx`: prop tùy chọn `onValueChange`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (187), `npm run build` đạt.
- QA: Playwright 1440px và 430px với xe [QA test]: đủ 4 trường hợp, luôn đúng một ô `partnerCost`, số đang gõ không mất khi ô đổi chỗ, không tràn ngang, không lỗi console. DB local: lưu không đổi giữ 1.200.000 và công nợ; đổi vị trí rồi lưu ra 1.800.000, công nợ theo xe đối tác lượt về. Dữ liệu thử đã xóa.
- Chưa kiểm: tài khoản chỉ-xem (ô nằm trong `fieldset` đã khóa).
