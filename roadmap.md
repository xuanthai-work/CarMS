# Lộ trình CarMS — bản mới lấy v1 làm gốc

Cập nhật: 2026-11-25. Người quyết định: User (Product owner). Tài liệu này do BA/QA (Claude) giữ; mỗi giai đoạn sẽ tách thành các task nhỏ trong `justdoit.md`.

## 1. Quyết định đã chốt với User

1. **v1 (CarMS) là gốc.** `CarMS-v2` (thư mục anh em) chỉ là nguồn ý tưởng giao diện và một số cải tiến dữ liệu, không phải nền để xây tiếp.
2. **Lưới lịch của v1 là cốt lõi, không sửa cách hoạt động** (xem theo xe/theo chuyến, kéo cuộn kiểu Excel). v2 làm mất phần này.
3. **Sidebar nổi 3D của v1 giữ nguyên.** Từ v2 lấy **Drawer cho các màn không phải chuyến** và **sự đồng bộ giao diện** (nút, bảng, form dùng chung).
4. **Thêm, xem, sửa chuyến dùng cùng một modal** (User chốt 2026-11-23: cùng một kiểu cho dễ dùng). Chuyến không dùng drawer; Mọi màn khác (xe, lái xe, nhân sự, chi phí, dầu, công nợ, phiếu lương...) dùng Drawer cho cả thêm lẫn xem/sửa (User chốt 2026-11-23); modal chỉ còn cho chuyến và hộp xác nhận nhỏ. Modal mở/đóng bằng hiệu ứng zoom từ vị trí vừa bấm (kiểu cửa sổ macOS). Bỏ bảng chi tiết cũ; thay bằng một ô ghi chú tự do lớn, kèm dải tiền gọn (giá, các lần khách trả, chi phí đối tác, trạng thái) và dải thông tin xếp lịch (ngày giờ, xe, lái xe, số chỗ). Chỉ những thứ máy cần tính hoặc cần để xếp lịch mới là ô riêng.
5. **Được phép làm lại và hướng dẫn người dùng lại.** Dữ liệu production rất ít nên di chuyển dữ liệu rẻ.
6. **Trợ lý AI đang tắt** (`web/src/configs/features.ts`). Làm lại sau.
7. **Mọi SQL đặt trong `web/supabase/scripts/`**, chạy tay, không dùng `migrations/`.
8. Dữ liệu và tài khoản QA trên DB local (id bắt đầu `qa-`) **giữ lại** làm dữ liệu mock.

## 2. Cải tiến dữ liệu lấy từ v2 (đã duyệt)

| Mục | Quyết định |
|---|---|
| Thu tiền nhiều đợt (cọc, thanh toán, hoàn tiền) | **Bỏ** (User chốt 2026-11-25: giữ 1 ô cọc + trạng thái thủ công) |
| Hủy chuyến có phí hủy | **Xong** (TASK-054, 055) |
| Tiền kiểu số nguyên (thay số thực) | **Bỏ** (User chốt 2026-11-25: dữ liệu không có số lẻ, rủi ro đổi cột lớn hơn lợi ích) |
| Gom chi phí một sổ có phân loại | **Làm** (giai đoạn 4) |
| Lương có ngày hiệu lực, phiếu lương chốt được, tạm ứng riêng | **Làm** (giai đoạn 5, sau khi User giải thích cách trả lương thực tế) |
| Xóa mềm, nhật ký thay đổi | Để sau |
| Thực thể Khách hàng, Đối tác, 5 vai trò, chuyến nhiều chặng tùy ý | Không làm (chưa cần) |

## 3. Các giai đoạn

| GĐ | Nội dung | Ghi chú |
|---|---|---|
| 0 | Quét lỗi v1 (Playwright + dữ liệu QA), sửa lỗi nền | Có một lỗi User báo mà BA chưa tái hiện được, xem mục 4 |
| 1 | Bộ giao diện chung: nút chung, hiệu ứng zoom cho Modal, khung SideDrawer; giữ sidebar 3D và lưới lịch | **Xong** (TASK-035..037). Drawer chỉ làm khung ở đây; chuyển các màn sang drawer ở giai đoạn 6 |
| 2 | Modal chuyến thống nhất cho thêm/xem/sửa, có ô ghi chú tự do | **Xong** (TASK-038..044). Không đổi dữ liệu |
| 3 | Nâng dữ liệu tiền: chỉ làm hủy chuyến + phí hủy | **Xong** (TASK-054, 055). Thu nhiều đợt và số nguyên đã bỏ |
| 4 | Gom chi phí (dầu, cầu đường, đối tác, khác) | Giữ kết quả `buildMonthFinance` không đổi nếu dữ liệu giống nhau |
| 5 | Làm lại lương | Cần phiên làm rõ nghiệp vụ lương với User trước khi viết đặc tả |
| 6 | Đổi các màn còn lại (xe, lái xe, nhân sự, chi phí, dầu, công nợ) sang drawer và bộ giao diện chung | **Xong** (TASK-045..052: xe, lái xe, nhân sự, dầu, chi phí khác, công nợ, lương tháng, phiếu công ngày). Tất cả màn ngoài chuyến: thêm và sửa đều qua Drawer |

## 4. Lỗi đang theo dõi

- **Phiếu công ngày (Lương → Lương ngày):** User báo thêm một phiếu rồi bấm "Thêm" tiếp thì modal không hiện, phải chuyển sang tab trình duyệt khác rồi quay lại mới hiện. **BA chưa tái hiện được** trên local (dev và bản build production, có giả lập mạng chậm 1,2 giây, thêm hai phiếu liên tiếp đều bình thường). Cần User cho biết: chỉ xảy ra trên production hay cả local, trình duyệt nào, có bấm "Thêm" ngay lúc bảng đang làm mới không, và có xảy ra ở các modal khác (Tiền dầu, Chi phí khác, Công nợ) không.
- Lỗi lương F9 đã sửa (TASK-031). Còn tồn: lương chưa xét ngày vào làm; tháng chưa có dòng lương dùng lương cơ bản hiện tại (xử lý ở giai đoạn 5).
- Dữ liệu: chuyến cọc lớn hơn giá bị ẩn phần dư (xử lý ở giai đoạn 3).
- Đường dẫn `/cai-dat` trả 404 (thư mục rỗng `web/src/app/(main)/cai-dat/`).

## 5. Đã xong (2026-11-23 đến 2026-11-25)

TASK-019 đến TASK-031 (tài chính AI, công nợ theo ngày về, ngày nghỉ việc, chặn đăng nhập, clean code, tắt AI, bộ script SQL production, màn Doanh thu tính lương mọi tháng). Giai đoạn 1, 2, 6 xong (TASK-032..052); TASK-053 bỏ ngày trả của phiếu công ngày (đã có script production `05`). Chi tiết ở `docs/README.md` và `docs/tasks/`.

## 6. Việc production chưa làm

- Chạy `web/supabase/scripts/01-audit-readonly.sql` trên production, gửi kết quả cho BA.
- Sao lưu production, rồi chạy `02-sync-schema.sql` (thêm cột `endDate`, bật RLS cho 9 bảng) và `03-backfill-partner-debt-workdate.sql`.
- Sau khi deploy code mới của TASK-053, chạy tay `05-drop-partnerpayout-paymentdate.sql` (bỏ cột `PartnerPayout.paymentDate`).
- Tại thời điểm viết, **chưa chạy gì trên production** và các commit chưa push.
