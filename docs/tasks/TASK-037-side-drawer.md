# TASK-037: Khung SideDrawer Dùng Chung

## 1. Thông Tin Chung
- **Mã Task**: TASK-037
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: UI / Design system (giai đoạn 1)
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User chốt: mọi màn ngoài chuyến dùng Drawer (panel trượt từ phải) cho cả thêm lẫn sửa; chuyến giữ Modal. Task tạo khung `SideDrawer` và dùng thử ở form "Thêm xe".

## 3. Thay Đổi Theo File
- Mới `web/src/hooks/common/useOverlayClose.ts`: đóng có hoạt ảnh, Esc, khóa cuộn nền, dọn timer (dùng chung Modal và SideDrawer).
- Mới `web/src/components/common/SideDrawer.tsx`: `aside[role=dialog]` cố định mép phải, `max-w-md` (full rộng trên màn hẹp), header + thân cuộn + footer dính đáy, trượt vào 260ms / ra 200ms, reduced-motion chỉ fade.
- `common/Modal.tsx`: dùng hook, hành vi không đổi.
- `vehicles/AddVehicleButton.tsx`: dùng `SideDrawer`; nút Hủy/Thêm xe ở footer, `form="add-vehicle-form"`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt.
- QA (Playwright): drawer trượt từ x=1280 về 832, rộng 448; Esc sau 80ms đang trượt ra (x=1256), sau 580ms gỡ và trả `overflow`; ✕ và bấm nền đóng, bấm trong không đóng; nền khóa cuộn; 390px rộng full; thêm xe trùng biển số hiện banner, giữ dữ liệu; nút footer ngoài `<form>` gửi được; chạy lại 20 kiểm tra TASK-033 và kiểm tra hiệu ứng Modal (TASK-036) đều đạt; chụp ảnh xác nhận giao diện.
- Lưu ý: nơi có `aside` khác (sidebar) nên selector kiểm thử dùng `aside[role=dialog]`.
