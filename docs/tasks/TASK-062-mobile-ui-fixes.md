# TASK-062: Sửa Lỗi Giao Diện Điện Thoại (iPhone Pro Max 430px)

## 1. Thông Tin Chung
- **Mã Task**: TASK-062
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: UI / Mobile
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
QA quét mọi màn ở desktop 1440px và iPhone Pro Max 430px. Desktop sạch; điện thoại có: bảng Chi phí khác/Công nợ chồng chữ (thiếu `min-w`), ô thống kê bị cắt số (Lương, do `truncate`) hoặc xuống dòng ký hiệu ₫ (Công nợ), tab lọc xuống dòng chữ (Tiền dầu).

## 3. Thay Đổi Theo File
- `ExpenseScreen.tsx` (`min-w-[880px]`), `DebtScreen.tsx` (`min-w-[900px]`): bảng cuộn ngang trong khung.
- `ExpenseScreen/DebtScreen/FuelScreen` `Stat`, `SalaryScreen` `Tile`: `min-w-0`, `p-4 sm:p-5`, số `whitespace-nowrap text-lg sm:text-2xl` (bỏ `truncate`).
- `FilterTabs.tsx`: `max-w-full overflow-x-auto`, nút `shrink-0 whitespace-nowrap`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright, quét lại toàn bộ): 430px số ở ô thống kê của Lương, Công nợ, Tiền dầu, Chi phí khác hiển thị đủ, một dòng, trong thẻ; tab lọc một dòng; bảng Chi phí khác và Công nợ không còn ô đè nhau và cuộn ngang trong khung; không màn nào tràn ngang; 1440px cỡ số vẫn 24px.
- Còn lại (chưa làm): thanh menu trái chiếm ~18% bề ngang trên điện thoại (TASK-063), vùng bấm bé (mũi tên đổi tháng 39×32, chip trạng thái 34px).
