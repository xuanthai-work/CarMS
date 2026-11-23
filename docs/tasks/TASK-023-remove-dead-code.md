# TASK-023: Xóa Code Chết (Clean Code Đợt 1)

## 1. Thông Tin Chung
- **Mã Task**: TASK-023
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Code Quality
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
Đợt clean code thứ nhất, chỉ xóa code không nơi nào gọi (BA dò mọi export trong `web/src`, đếm tham chiếu ở file khác kể cả test). Không đổi hành vi.

## 3. Thay Đổi Theo File
- `web/src/api/debts.ts`: xóa `setPartnerDebtStatus`.
- `web/src/api/trips.ts`: xóa `setLegEndTime` (Dev đã grep xác nhận tính năng kéo giờ đến không còn).
- `web/src/services/fuel.ts`: xóa `getAvailableFuelMonths`.
- `web/src/components/common/ui.tsx`: xóa `LinkButton` và import `Link` thừa.
- `web/src/utils/trips.ts`: xóa `legMeta`, `toneBorderClass`, `assignLanes`.
- `web/src/utils/revenue.ts`: xóa `profitTextClass`.
- `web/src/services/systemTools.ts`: bỏ biến thừa `otherCostTotal` trong destructure.

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx tsc --noEmit --noUnusedLocals`: 0 lỗi. `npx tsc --noEmit`: 0 lỗi.
- `npm test`: 10/10 files, 92/92 tests pass.
- `npm run build`: thành công.
- QA: đọc diff, đối chiếu 5/5 Acceptance Criteria; đúng 7 file trong danh sách. Không chạy lại gate vì không có code mới.

## 5. Ghi Chú
- Giữ nguyên `sameVehicleBothLegs`, `packVariableHeight`, `labelCls`, `ctx` trong chữ ký tool.
- Cột `endTime` ở Prisma vẫn còn (ngoài phạm vi).
