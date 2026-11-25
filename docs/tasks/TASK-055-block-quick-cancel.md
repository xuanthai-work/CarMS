# TASK-055: Chặn Đổi Sang "Đã Hủy" Không Có Phí Hủy Ở Dropdown Trạng Thái Màn Doanh Thu

## 1. Thông Tin Chung
- **Mã Task**: TASK-055
- **Ngày hoàn thành**: 2026-11-25
- **Phân hệ**: Revenue / Trips
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
Sau TASK-054, dropdown trạng thái ở màn Doanh thu cho chọn "Đã hủy" mà không có ô phí hủy (mất giá chuyến âm thầm), và đổi khỏi trạng thái hủy không xóa `cancelFee` cũ. Quy tắc: hủy chuyến chỉ làm trong modal chuyến.

## 3. Thay Đổi Theo File
- `components/schedule/StatusSelect.tsx`: popup bỏ mục `cancelled` (nút vẫn hiện nhãn "Đã hủy" cho chuyến đang hủy).
- `api/trips.ts`: `setTripStatus` từ chối `"cancelled"` (sau `requireManagerEditor`), ghi `cancelFee: null` khi đổi trạng thái.
- `api/trips.test.ts` (mới, Dev khai): 2 test cho `setTripStatus`.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (157), `npm run build` đạt.
- QA (Playwright): dropdown chuyến đang hủy hiện nhãn "Đã hủy", popup chỉ 3 mục; đổi sang "Đã nhắn khách" → DB `status=info_sent`, `cancelFee=null`, doanh thu tháng quay về tính theo giá chuyến (5.000.000).
- Chưa kiểm: tài khoản chỉ-xem.
