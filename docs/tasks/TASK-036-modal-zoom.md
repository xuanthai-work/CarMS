# TASK-036: Hiệu Ứng Zoom Từ Vị Trí Bấm Cho Modal

## 1. Thông Tin Chung
- **Mã Task**: TASK-036
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: UI / Design system (giai đoạn 1)
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User muốn modal mở/đóng kiểu cửa sổ macOS: phóng ra từ vị trí vừa bấm, thu về đúng chỗ khi đóng. Áp dụng cho mọi nơi dùng `Modal` mà không sửa nơi gọi.

## 3. Thay Đổi Theo File
- Mới `web/src/utils/modalOrigin.ts` (+ `.test.ts`, 11 test): `freshOrigin` (điểm bấm trong 1500ms), `originOffset` (độ lệch từ tâm màn hình, kẹp trong khung nhìn).
- `web/src/components/common/Modal.tsx`: ghi nhận `pointerdown` toàn trang (capture, passive); mở: scale 0.35 + dịch 85% về phía điểm bấm, 240ms; đóng chủ động (✕/Esc/bấm nền) thu ngược 180ms rồi mới gọi `onClose`; không có điểm bấm mới thì zoom 0.94 từ giữa; `prefers-reduced-motion` chỉ fade; `onClose` giữ qua ref nên listener Esc không đăng ký lại mỗi lần render.

## 4. Kết Quả Kiểm Chứng
- Dev: vitest modalOrigin 11/11, `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt.
- QA (Playwright lấy mẫu hình học bằng rAF): modal bắt đầu rộng ~202px tại (1127,176) gần nút "Thêm xe" (1213,137), tới 576px tại tâm màn hình sau ~200ms; Esc: sau 60ms panel còn rộng 237px (đang thu), sau 560ms đã gỡ; ✕, bấm nền đóng được, bấm trong panel không đóng; với reduced-motion panel luôn ở tâm, rộng 576, chỉ đổi opacity, Esc đóng ngay. 13 luồng CRUD vẫn đạt, không lỗi console.
- Giới hạn: khi cha tự gỡ modal (lưu xong) thì không có hoạt ảnh thu về.
