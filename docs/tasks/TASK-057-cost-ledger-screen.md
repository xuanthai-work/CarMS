# TASK-057: Màn "Tổng Chi Phí" (Giai Đoạn 4, Phần 2: Giao Diện)

## 1. Thông Tin Chung
- **Mã Task**: TASK-057
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Finance / Chi phí
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Thêm màn chỉ-xem `/tong-chi-phi` gom mọi khoản chi của một tháng (dùng `buildCostLedger` của TASK-056), chỉ quản lý thấy. Không đổi dữ liệu/schema/tính tiền.

## 3. Thay Đổi Theo File
- `app/(main)/tong-chi-phi/page.tsx` (mới): `requireManager()`, `searchParams.m` (kiểm định dạng), gom dữ liệu tháng, lương qua `salaryCostByMonth` (cùng đường tính Doanh thu), `buildCostLedger`.
- `components/costs/CostLedgerScreen.tsx` (mới): `MonthNav`, 6 ô thống kê (tổng + 5 nhóm, `min-w-0` + `truncate`), `FilterTabs` theo nhóm, tìm kiếm, bảng 7 cột + link "Mở" về màn nguồn, dòng tổng cuối bảng, trạng thái rỗng.
- `components/layout/Sidebar.tsx`: mục "Tổng chi phí" (`managerOnly`) sau "Doanh thu".
- Quyền: không có danh sách route manager-only ở layout/middleware; `requireManager()` từng trang là cơ chế duy nhất (Dev đã kiểm).

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (163), `npm run build` đạt.
- QA (Playwright, `qa-claude`): tổng chi phí của `/tong-chi-phi` **khớp đúng** "Tổng chi phí tháng" ở màn Doanh thu cho cả 5 tháng 2026-07…2026-11 (36.000.000 / 38.050.000 / 24.450.000 / 24.000.000 / 24.883.000); lọc nhóm giảm số dòng nhưng ô thống kê không đổi; tìm không ra → trạng thái rỗng; 390px không tràn ngang.
- Ghi nhận: tháng chưa có dữ liệu (VD 2026-01, 2026-12) vẫn hiện lương cơ bản hiện tại — đúng hành vi màn Doanh thu (vấn đề lương tồn đọng của giai đoạn 5), không phải lỗi của task này.
- Chưa kiểm: chặn nhân viên thường (chỉ đọc code: `requireManager()` như `/doanh-thu`), mục sidebar ẩn với nhân viên thường. Mục sidebar dùng chung icon với "Chi phí khác" (cosmetic).
