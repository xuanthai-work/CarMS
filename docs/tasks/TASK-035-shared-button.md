# TASK-035: Component Nút Dùng Chung (Button)

## 1. Thông Tin Chung
- **Mã Task**: TASK-035
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: UI / Design system (giai đoạn 1)
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Nút chính xanh đang chép tay ở ~14 nơi với kiểu dáng lệch nhau. Gom về một component `Button` (biến thể primary/secondary/danger, cỡ md/toolbar), không đổi hành vi.

## 3. Thay Đổi Theo File
- Mới: `web/src/components/common/Button.tsx` (`Button`, `buttonClass`; `type` mặc định `button`).
- `common/ui.tsx`: `SaveButton`, `CancelButton` dùng `Button` (không thêm "use client").
- Chuyển sang `Button`: `DebtPayModal`, `ExpenseModal`, `ExpenseScreen`, `FuelEntryEditorRow`, `FuelScreen`, `RevenueScreen`, `SalaryScreen`, `AddDriverButton`, `TripForm`, `AddOfficeStaffButton`, `AddVehicleButton`.
- Không đụng: lưới lịch, auth, assistant, picker/menu/tab.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (122), `npm run build` đạt; grep `bg-brand-600` chỉ còn nút chọn/lọc, lưới lịch, auth, assistant và `Button.tsx`.
- QA: đọc diff (mọi nút gửi form có `type="submit"`, nút Hủy `secondary`), chạy lại 13 luồng Playwright (thêm/sửa/xóa chuyến, dầu, chi phí, xe, lái xe, đổi trạng thái, lương, công nợ) đều đạt; chụp modal Thêm xe thấy nút Hủy/Thêm xe đúng kiểu.
- Còn tồn: nút "Thêm chuyến" trên lưới (`ScheduleGrid`, `VehicleSchedule`) và `InstructionsDialog` chưa chuyển (cố ý).
