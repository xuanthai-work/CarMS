# TASK-026: Báo Cáo Ngày Dùng Hàm Tính Tiền Chuẩn (Clean Code Đợt 3)

## 1. Thông Tin Chung
- **Mã Task**: TASK-026
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Code Quality / AI Assistant
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
`getDailySummaryTool` cộng tiền bằng 4 vòng `reduce` riêng và ép kiểu `as unknown as Trip` trên hàng Prisma thô. Dùng đúng `toTrip` + `tripMoney` + `summarize`, bỏ ép kiểu, giữ nguyên kết quả báo cáo.

## 3. Thay Đổi Theo File
- `web/src/services/trips.ts`: export `toTrip` (thân hàm không đổi).
- `web/src/services/tools/finance.ts`: bỏ khối `select` ở truy vấn chuyến; thay `moneys` + 4 `reduce` bằng `summarize(finished.map((t) => tripMoney(toTrip(t))))`; bỏ `as unknown as Trip` và import `Trip` thừa. Phần đếm vận hành (status `"completed"`/`"cancelled"` là dữ liệu cũ) và điều kiện `finished` giữ nguyên trên hàng thô.
- `web/src/services/systemTools.test.ts`: thêm 1 test khóa hành vi `hasReturn=true` nhưng `returnDate=null` (không ghi nhận doanh thu).

## 4. Kết Quả Verification Gates (Dev chạy)
- `npx vitest run src/services/systemTools.test.ts`: 22/22 pass.
- `npx tsc --noEmit --noUnusedLocals`: 0 lỗi.
- `npm test`: 10/10 files, 93/93 tests pass.
- `npm run build`: thành công (Dev xác nhận không có dev server chạy ngầm).
- QA: đọc diff, đối chiếu 6/6 Acceptance Criteria; chuỗi báo cáo giữ nguyên, chỉ đổi biến nguồn. Không chạy lại gate vì không có code mới.
