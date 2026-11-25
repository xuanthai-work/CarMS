# TASK-056 đến TASK-059: Màn "Tổng Chi Phí" Và Việc Gộp Tiền Dầu + Chi Phí Khác — ĐÃ RÚT LẠI

## 1. Thông Tin Chung
- **Mã Task**: TASK-056, TASK-057, TASK-058, TASK-059
- **Ngày làm**: 2026-11-25; **ngày rút lại**: 2026-11-25
- **Trạng thái**: **Đã rút lại (git revert theo yêu cầu User)**

## 2. Diễn Biến
- TASK-056: hàm thuần `buildCostLedger` gom chi phí theo tháng (tổng khớp `buildMonthFinance`).
- TASK-057: màn chỉ-xem `/tong-chi-phi`.
- TASK-058: thêm `kind/refId/vehicleId/unpaid` cho sổ chi phí.
- TASK-059: gộp màn Tiền dầu + Chi phí khác vào `/tong-chi-phi` (thêm/sửa/xóa tại chỗ, chuyển hướng đường cũ).
- Sau khi dùng thử, User kết luận gộp màn không hợp lý và không cần màn Tổng chi phí.

## 3. Cách Rút Lại
`git revert --no-commit` bốn commit `10b063a` (059), `91ac7eb` (058), `bdeacd1` (057), `281ae09` (056), gộp thành một commit revert. Kết quả: màn `/tien-dau` và `/chi-phi-khac` trở lại đúng nguyên trạng (kể cả `FuelScreen`/`ExpenseScreen`, sidebar, `revalidate`); `/tong-chi-phi`, `utils/costLedger.ts`, `components/costs/`, `VehicleFilterSelect` bị gỡ. Giai đoạn 4 của roadmap chuyển sang "Bỏ".

## 4. Ghi Chú
- Không có thay đổi schema hay script SQL trong chuỗi này nên không cần xử lý DB.
- Muốn khôi phục: `git revert` commit revert này (hoặc xem lại các commit trên trong `git log`).
- Phân quyền mở tạm (TASK-060) là việc độc lập, vẫn tiến hành.
