# TASK-059: Gộp Tiền Dầu + Chi Phí Khác Vào Trang Tổng Chi Phí (Thêm/Sửa/Xóa Tại Chỗ)

## 1. Thông Tin Chung
- **Mã Task**: TASK-059
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Finance / Chi phí / UX
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt: gộp màn Tiền dầu và Chi phí khác vào Tổng chi phí; thêm/sửa/xóa tại chỗ; giữ Công nợ và Lương riêng; thống kê theo xe thay bằng lọc theo xe; bỏ lọc phân loại; phân quyền tạm mở (trang không còn `requireManager`, quyền ghi vẫn theo `canEdit`).

## 3. Thay Đổi Theo File
- `app/(main)/tong-chi-phi/page.tsx`: bỏ `requireManager`, nhận `?g=` làm nhóm lọc khởi tạo, truyền `fuel`, `expenses`, `vehicles`, `initialGroup`.
- `components/costs/CostLedgerScreen.tsx`: ô "Chưa chi" (7 ô, lưới `sm:grid-cols-4 xl:grid-cols-7`), lọc trạng thái, lọc xe, nút "+ Phiếu dầu"/"+ Chi phí khác" (theo `canEdit`), bấm dòng dầu/chi phí khác mở `FuelEntryForm`/`ExpenseModal`; dòng chuyến/lương có link "Mở".
- `components/fuel/VehicleFilterSelect.tsx` (mới): tách từ `FuelScreen`.
- `app/(main)/tien-dau/page.tsx`, `app/(main)/chi-phi-khac/page.tsx`: chuyển hướng server về `/tong-chi-phi?g=fuel|other` (giữ `m`).
- `components/layout/Sidebar.tsx`: bỏ "Tiền dầu"/"Chi phí khác" và `FuelIcon`; "Tổng chi phí" hiện với mọi tài khoản.
- `api/revalidate.ts`: revalidate `/tong-chi-phi` thay hai đường cũ.
- Đã xóa: `components/fuel/FuelScreen.tsx`, `components/expenses/ExpenseScreen.tsx`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (165), `npm run build` đạt.
- QA (Playwright, `qa-claude`; dev server phải khởi động lại vì giữ cache của hai file đã xóa): `/tien-dau?m=2026-08` → `/tong-chi-phi?g=fuel&m=2026-08` chỉ hiện dòng xăng dầu; `/chi-phi-khac` chuyển đúng; sidebar không còn hai mục cũ; thêm phiếu dầu 333.000 → tổng tháng tăng đúng, sửa lên 400.000 → tổng đúng, thêm khoản chi khác 120.000 → tổng đúng, lọc "Chưa chi" chỉ còn dòng chưa chi và ô thống kê không đổi, xóa cả hai → tổng về như ban đầu; dòng lương không mở form và có link "Mở"; tổng chi phí tháng 11 khớp Doanh thu; 390px không tràn ngang (7 ô thống kê).
- Chưa kiểm: bộ lọc xe (mã tách nguyên văn từ màn cũ), CEO chỉ-xem (đọc code: `canEdit` ẩn nút và không mở form).
- Dữ liệu `[QA test]` đã xóa sau khi thử.
- Còn dòng `href: "/tien-dau"`, `"/chi-phi-khac"` trong `costLedger.ts` (UI không dùng, đã chuyển hướng) và một comment nhắc `FuelScreen` trong `FuelEntryEditorRow.tsx`.
