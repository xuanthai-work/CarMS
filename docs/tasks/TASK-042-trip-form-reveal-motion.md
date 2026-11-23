# TASK-042: Hiệu Ứng Mở/Thu Phần Lượt Về Trong Modal Chuyến

## 1. Thông Tin Chung
- **Mã Task**: TASK-042
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Tick/bỏ tick "Về" làm các phần lượt về hiện/mất ngay lập tức. User muốn hiệu ứng mượt, chuyên nghiệp. Chỉ thêm chuyển động, không đổi bố cục hay logic.

## 3. Thay Đổi Theo File
- `components/common/Collapse.tsx` (mới): mở/thu chiều cao + mờ 0,2s bằng `framer-motion`, `initial={false}`, tôn trọng giảm chuyển động, `overflow: visible` khi đã mở xong để không cắt popup.
- `components/schedule/TripForm.tsx`: ô ngày về và ô giờ đón về mờ dần vào/ra; dòng Giờ đón luôn là một `Row2`; các dòng Xe về/Lái xe về/Giữ xe cả tour bọc trong `Collapse`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt.
- QA (Playwright, 20 kiểm tra đạt): khung 576px đứng yên cả giữa lúc chạy hiệu ứng, footer đứng yên, lưu một chiều/khứ hồi đúng, lỗi giữ dữ liệu, xóa, 390px không tràn.
- Phát hiện (có từ trước, không do task này): lịch chọn ngày của ô ngày về bị cắt cột Chủ nhật ở mép phải thân modal (thân modal `overflow-y-auto` cũng cắt chiều ngang). Chuyển thành task riêng.
