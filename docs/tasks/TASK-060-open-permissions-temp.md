# TASK-060: Mở Phân Quyền Tạm Thời — Mọi Nhân Sự Có Quyền Như COO (CEO Vẫn Chỉ Xem)

## 1. Thông Tin Chung
- **Mã Task**: TASK-060
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Auth / Phân quyền
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt: "cho nhân viên thường có quyền như COO, sau làm phân quyền sau" và "mở phân quyền mọi nơi". Mọi guard server và UI đi qua `isManager`/`canEdit`, nên chỉ cần mở `isManager`.

## 3. Thay Đổi Theo File
- `utils/office.ts`: `isManager(position)` = `position != null` (mở tạm); giữ `MANAGER_POSITIONS`, `canEdit`, `READONLY_POSITIONS`; comment hướng dẫn khôi phục.
- `utils/office.test.ts`: cập nhật test (isManager true cho CEO/COO/Nhân viên/chức vụ cũ, false cho null; nhân viên xem + ghi như COO).
- `AGENTS.md`: ghi chú "Phân quyền đang mở tạm (2026-11-25)" ở Architecture decisions.
- Dev rà soát grep: không có chỗ nào so sánh trực tiếp chuỗi "CEO"/"COO" bỏ qua `isManager`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (159), `npm run build` đạt.
- QA (Playwright, tạm đổi chức vụ tài khoản QA rồi trả về COO): với "Nhân viên" và "CEO" đều thấy mục Doanh thu, vào được `/doanh-thu`, thấy nhóm Văn phòng ở Lương và tab Văn phòng ở Nhân sự; "Nhân viên" có nút thêm phiếu dầu, CEO không có (chỉ xem).

## 5. Khôi Phục Phân Quyền Thật
Đổi `isManager` ở `web/src/utils/office.ts` về `position != null && (MANAGER_POSITIONS as readonly string[]).includes(position)`, cập nhật test và xóa dòng ghi chú trong `AGENTS.md`.
