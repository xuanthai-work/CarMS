# TASK-064: Vùng Bấm ≥44px Trên Điện Thoại + Sửa Lỗi Giao Diện Lặt Vặt

## 1. Thông Tin Chung
- **Mã Task**: TASK-064
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: UI / Mobile
- **Trạng thái**: **Đã xong (QA AUDIT PASS, sau 1 lần sửa)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
QA quét iPhone Pro Max còn vài vùng bấm bé và lỗi hiển thị nhỏ. Chỉ sửa CSS/JSX, desktop (≥768px) giữ nguyên.

## 3. Thay Đổi Theo File
- `components/common/MonthNav.tsx`: nút ←/→ `min-h-11 min-w-11` trên mobile, `md:` về như cũ.
- `components/common/DatePicker.tsx`: nút ‹ › `h-10 w-10 md:h-7 md:w-7`; popup `w-[292px] max-w-[calc(100vw-2rem)] md:w-[268px]`; nhãn tháng `whitespace-nowrap` (lần sửa sau QA lần 1: nhãn từng xuống 2 dòng).
- `components/schedule/StatusSelect.tsx`: chip `min-h-11 md:min-h-0`; mục menu `py-2.5 md:py-1.5`.
- `components/dashboard/Overview.tsx`: cột giờ `w-14 whitespace-nowrap`; hai link "+ N …" `inline-flex min-h-11 md:min-h-0`.
- `components/debts/DebtScreen.tsx`: cột "Ngày trả" chỉ hiện dòng người trả khi có tên.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright): 430px MonthNav 44×44, link "+ N" cao 44, chip 44, mục menu 44, nút DatePicker 40×40; desktop giữ 39×32 / 16 / 34 / 28. Lịch chọn ngày ở 390/430/1440px với "Tháng 12, 2026" (trường hợp dài nhất): nhãn 1 dòng, popup nằm trong màn hình, không cuộn ngang.
- Chưa kiểm trực tiếp: "Chưa giờ" ở Tổng quan (hôm nay không có lượt thiếu giờ; chỉ xác nhận qua diff), ô "Ngày trả" Công nợ khi đã trả mà thiếu người trả (dữ liệu mock không có dòng này).
