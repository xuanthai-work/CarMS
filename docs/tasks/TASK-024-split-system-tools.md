# TASK-024: Tách systemTools.ts Theo Nhóm Tool (Clean Code Đợt 2)

## 1. Thông Tin Chung
- **Mã Task**: TASK-024
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Code Quality / AI Assistant
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
`web/src/services/systemTools.ts` dài 847 dòng với 9 tool và các hàm dùng chung. Tách theo nhóm, chuyển code nguyên văn, không đổi hành vi.

## 3. Thay Đổi Theo File
- `web/src/services/tools/shared.ts` (29 dòng): `UserRoleContext`, `NO_PERMISSION`, `vnd`, `resolveRange`, `dateRange`.
- `tools/trips.ts` (275): `getDailyTripsTool`, `searchTripsTool`, `getDriverScheduleTool`.
- `tools/vehicles.ts` (161): `getAvailableVehiclesTool`, `getVehicleInspectionsTool`.
- `tools/finance.ts` (190): `getDailySummaryTool`, `getMonthlyFinanceTool`.
- `tools/fuel.ts` (80): `getFuelHistoryTool`.
- `tools/salary.ts` (120): `getSalaryBreakdownTool`.
- `web/src/services/systemTools.ts` (40): barrel re-export + `systemReadTools` (giữ nguyên thứ tự key).
- `systemTools.test.ts`, `app/api/chat/route.ts`: không sửa.

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx vitest run src/services/systemTools.test.ts`: 21/21 pass.
- `npx tsc --noEmit --noUnusedLocals`: 0 lỗi.
- `npm test`: 10/10 files, 92/92 tests pass.
- `npm run build`: thành công.
- QA: so khớp từng dòng file cũ với tổng các file mới (đếm dòng theo nội dung): chỉ khác phần import/export và khai báo `export` thêm vào 4 helper; không dòng logic nào bị mất hay đổi. Không chạy lại gate vì không có code mới.

## 5. Ghi Chú
- Test giữ một file vì tách sẽ phải lặp cấu hình mock Prisma.
- `ctx` chưa dùng ở `searchTripsTool` và `getFuelHistoryTool`, `as unknown as Trip` ở tool báo cáo ngày: giữ nguyên, thuộc task sau.
