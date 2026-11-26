# TASK-071: Control Tự Thiết Kế Hiển Thị Xám Khi Bị Khóa

## 1. Thông Tin Chung
- **Mã Task**: TASK-071
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: UI / Phân quyền (chỉ giao diện)
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Tài khoản chỉ-xem (CEO): form nằm trong `<fieldset disabled>` nên đã khóa, nhưng `DatePicker`, `SelectMenu`, `TimePicker`, `Combobox` vẫn nền trắng, trông như bấm được. Chỉ thêm class Tailwind, không đổi logic khóa hay quyền.

## 3. Thay Đổi Theo File
`components/common/DatePicker.tsx`, `TimePicker.tsx`, `SelectMenu.tsx`, `Combobox.tsx`: biến thể `disabled:` / `has-[:disabled]:` / `group-disabled:` / `peer-disabled:` (nền slate-50, viền slate-200, chữ slate-500, icon mờ). `ui.tsx`: `inputCls` thêm cùng bộ class.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (187), `npm run build` đạt.
- QA: Playwright 1440px và 430px, đo computed style ở form lái xe và form chuyến. CEO: ô nhập, ô chọn, ngày/giờ, combobox đều disabled, nền xám, con trỏ not-allowed, icon opacity 0.4. COO: không ô nào disabled, viền/nền như cũ. Tài khoản thử đã trả về COO.
- Chưa kiểm: variant `pill` (chọn model trợ lý AI) trên trình duyệt (chỉ thêm biến thể `disabled:`).
