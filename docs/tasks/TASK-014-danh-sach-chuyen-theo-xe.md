# TASK-014: Đổi chế độ xem "Theo xe" từ dạng Lịch sang Danh sách chuyến trên trang Lịch điều xe (`/lich`)

## 1. Mục tiêu & Yêu cầu nghiệp vụ
- **Mục tiêu**: Chuyển chế độ xem "Theo xe" trên trang Lịch điều xe (`/lich`) từ dạng lịch lưới 24 giờ x các ngày trong tháng sang dạng danh sách (List/Table) rõ ràng, tiện tra cứu các chuyến xe chạy trong tháng.
- **Yêu cầu chi tiết**:
  - Khi xem "Theo xe", hiển thị danh sách các chuyến mà xe đang chọn tham gia (chạy lượt đi, lượt về hoặc cả 2 lượt) trong tháng được chọn.
  - Vẫn giữ nguyên tab "Theo chuyến" (view Gantt timeline theo ngày).
  - Giữ nguyên bộ chọn xe (`SelectMenu`) và bộ chọn tháng (`MonthNav`).
  - Hỗ trợ click vào chuyến để mở `TripModal` xem/sửa thông tin chi tiết.

## 2. Các thay đổi kỹ thuật
1. **`web/src/components/schedule/VehicleSchedule.tsx`**:
   - Thay thế toàn bộ layout lưới 24 giờ (bề rộng ngày, kéo thả giờ đến `setLegEndTime`) bằng giao diện Danh sách chuyến xe hiện đại:
     - **Thanh tóm tắt thông tin xe**: Biển số, loại xe (số chỗ), lái xe chạy nhiều chuyến nhất, cùng 3 chip thống kê nhanh trong tháng (Tổng chuyến, Hoàn thành, Sắp tới).
     - **Bảng danh sách chuyến**: Gồm 7 cột rõ ràng (`Thời gian`, `Lượt chạy`, `Khách hàng`, `Lộ trình`, `Lái xe`, `Trạng thái`, `Giá trị / Cọc`).
     - Badge phân loại lượt chạy rõ ràng: `Cả 2 lượt` (tím), `Lượt đi` (xanh dương), `Lượt về` (vàng hổ phách).
     - Hỗ trợ click vào hàng để mở modal chuyến đi (`TripModal`), click vào số điện thoại khách hàng không bị kích hoạt modal mà cho phép gọi điện nhanh.
     - Empty state thân thiện khi xe chưa có chuyến trong tháng kèm nút `+ Thêm chuyến`.
2. **`web/src/components/schedule/ScheduleGrid.tsx`**:
   - Ẩn thanh chú thích viền (chỉ áp dụng cho chế độ Gantt "Theo chuyến") khi người dùng chuyển sang tab "Theo xe".
   - Bổ sung prop `onAdd` truyền cho `VehicleSchedule` để nút thêm chuyến tự động prefill `vehicleId` của xe đang chọn.

## 3. Kết quả QA Verification
- **TypeScript**: `npx tsc --noEmit` đạt 0 lỗi (PASS).
- **Test Suite**: `npm test` (`vitest run`) đạt 10/10 test files, 77/77 tests passed (PASS).
- **Trải nghiệm UI/UX**:
  - Không có thanh cuộn ngang thừa.
  - Chuyển đổi giữa 2 tab "Theo xe" và "Theo chuyến" mượt mà, đúng trạng thái và dữ liệu.
