# TASK-061: Sửa Lỗi Giao Diện Bảng Màn Doanh Thu

## 1. Thông Tin Chung
- **Mã Task**: TASK-061
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Revenue / UI
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
QA quét `/doanh-thu` bằng Playwright (1440px, 390px), User báo bảng có lỗi UI. Phát hiện: cột Trạng thái hẹp cắt chữ; dropdown trạng thái bị khung bảng che; ô thống kê tràn ở điện thoại; chuyến hủy hiện phí hủy trong cột "Giá" không rõ nghĩa; hàng tiêu đề lệch màu.

## 3. Thay Đổi Theo File
- `components/revenue/RevenueScreen.tsx`: `colgroup` 17/11/10/11/11/10/12/18, `min-w-[960px]`; `Stat` có `min-w-0`, `p-4 sm:p-5`, số `text-lg sm:text-2xl whitespace-nowrap`; ô Giá của chuyến hủy hiện "phí hủy" (+ "hoàn lại …"); `thead` `bg-canvas`.
- `components/schedule/StatusSelect.tsx`: popup render qua portal (`position: fixed`), lật lên khi sát đáy, đóng khi bấm ngoài/Esc/cuộn/resize.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright): 1440px nhãn trạng thái ("Đã hủy", "Đã thanh toán") hiển thị đủ; dropdown ở bảng 2 dòng thấy đủ 3 mục, nằm trong viewport, chọn mục mở hộp xác nhận, bấm ngoài và Esc đều đóng, viewport thấp (330px) thì lật lên; chuyến hủy hiện "phí hủy" và "hoàn lại 300.000"; hàng tiêu đề đồng màu; 390px 6 ô thống kê đọc đủ, trang không tràn ngang.
- Lưu ý: ở 390px số dài nhất ("-34.850.000 ₫") đứng sát mép thẻ (ăn vào padding) nhưng không bị cắt; iPhone Pro Max (430px) rộng hơn. Sẽ xem lại ở lượt quét giao diện toàn hệ thống.
