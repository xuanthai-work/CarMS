# TASK-075: Form Trong Drawer Bỏ Lớp Thẻ Bọc Ô Nhập

## 1. Thông Tin Chung
- **Mã Task**: TASK-075
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: UI / Drawer
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Drawer còn kiểu cũ: khung xám bọc các thẻ trắng quanh từng ô, nhiều lớp. User yêu cầu bỏ thẻ; ô nhập nằm thẳng trên nền trắng. Chỉ đổi giao diện.

## 3. Thay Đổi Theo File
- 11 file drawer (công nợ, lái xe, chi phí khác, tiền dầu, phiếu công ngày, lương, nhân sự, xe): khung bọc thành `grid gap-3`, bỏ `DetailCell`.
- `SalaryMonthTable`: danh sách và form tạm ứng bỏ khung; `DebtPayModal`: khối tóm tắt ngăn bằng vạch.
- `common/ui.tsx`: xóa `DetailCell`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (204), `npm run build` đạt.
- QA: so diff bỏ qua thẻ bọc, không đổi input, handler hay `fieldset`. Playwright 1440px và 430px, 11 drawer: không còn phần tử viền/nền/bóng quanh ô, cách đều 12px, thẳng lề tiêu đề, không tràn ngang, không lỗi console. Dữ liệu thử đã xóa.
- Chưa kiểm: trạng thái phiếu đã chốt và tài khoản chỉ-xem (mã `fieldset` không đổi).
