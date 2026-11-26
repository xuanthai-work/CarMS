# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Nhân sự văn phòng của một công ty cho thuê xe có lái ở Việt Nam (chức vụ trong hệ thống: CEO, COO, Nhân viên). Họ dùng CarMS hằng ngày để xếp và xem lịch chuyến, ghi các khoản tiền và đối soát. Điện thoại và máy tính quan trọng ngang nhau: mỗi màn phải làm việc đầy đủ trên cả hai. Lái xe không phải người dùng đăng nhập.

## Product Purpose

Web nội bộ thay Google Sheet điều xe: quản lý lịch chuyến, xe, lái xe, doanh thu, tiền dầu, chi phí khác, công nợ đối tác và lương.

Thành công trước hết là **nhìn là biết lịch**: mở ra thấy ngay xe nào, ai lái, ngày nào, không trùng lịch. Khi các yêu cầu mâu thuẫn nhau, ưu tiên điều này.

## Positioning

Lịch điều xe và sổ tiền của đúng công ty này nằm trên cùng một dữ liệu: chuyến ghi một lần, dùng cho lịch, doanh thu và công nợ đối tác. Cách tính tiền theo nghiệp vụ riêng của công ty (xe nhà và xe đối tác, lái xe nhà và lái ngoài, lương 25 công).

## Operating Context

- Chuyến có lượt đi và có thể có lượt về, mỗi lượt có xe riêng; có tiền chuyến, tiền cọc, trạng thái, phí hủy.
- Xe nhà với lái nhà: lái xe ăn lương tháng. Xe nhà với lái ngoài: trả bằng phiếu công ngày. Xe đối tác: tiền thuê ghi trên chuyến và tự tạo phiếu công nợ.
- Lương trả một lần mỗi tháng; có tạm ứng, mức lương theo ngày hiệu lực, tính theo ngày vào và ngày làm cuối, chốt phiếu lương.
- Trước CarMS, việc này làm trên bảng tính (ví dụ ở gốc repo: `Lịch làm việc Tháng 7.xlsx`, `Bảng tiền dầu theo tháng.xlsx`).
- Nhiều người dùng cùng lúc; lịch tự cập nhật giữa các máy.

## Capabilities and Constraints

- Các màn: Tổng quan, Lịch, Doanh thu, Tiền dầu, Chi phí khác, Công nợ, Quản lý xe, Nhân sự, Lương, Hồ sơ.
- Trợ lý AI (Meow) đang tắt (`web/src/configs/features.ts`).
- Giao diện và nội dung bằng tiếng Việt; ngày giờ theo múi giờ Việt Nam.
- Thêm, xem, sửa chuyến dùng một modal; các đối tượng khác dùng drawer; modal ngoài chuyến chỉ cho hộp xác nhận nhỏ.
- Xóa xe, lái xe, nhân sự là ẩn khỏi web, dữ liệu cũ giữ nguyên. Chưa có màn khôi phục.
- CEO chỉ xem. Phân quyền xem đang mở tạm cho mọi chức vụ (từ 2026-11-25).
- Đang chạy production với dữ liệu thật; logic tính tiền không được lệch (xem `AGENTS.md`).
- Chưa quyết: thời điểm làm phân quyền thật, bật lại trợ lý AI.

## Brand Commitments

- Giọng chữ thân mật, gần gũi, ví dụ hộp xác nhận xóa hiện có: "Đã nghĩ kĩ chưa mà chọn em? 🥺".
- Sidebar nổi và lưới lịch (xem theo xe, theo chuyến, kéo cuộn như bảng tính) giữ cách hoạt động hiện tại.
- Tên CarMS, logo và hình mèo đang dùng nhưng User chưa đánh dấu là bắt buộc giữ.

## Evidence on Hand

- Dữ liệu vận hành thật trên production; dữ liệu `[QA test]` trên DB local để thử.
- Hình: `web/public/logo.png`, `web/public/meow-avatar.jpg`, `assets/chubby_cat_van_mascot_logo.png`.
- Không có lời chứng thực, số liệu so sánh hay tài liệu tiếp thị; không được bịa.

## Product Principles

1. Lịch đọc được ngay: thông tin xe, lái xe, ngày không bị che, cắt hay phải bấm thêm mới thấy.
2. Điện thoại và máy tính ngang hàng: không màn nào coi một bên là bản rút gọn.
3. Số tiền không được sai hay mất âm thầm; dữ liệu cũ được giữ khi đổi hoặc xóa đối tượng.
4. Ít lớp, ít thủ tục: thao tác trực tiếp, không bọc thêm khung hay bước chỉ cho đủ.
5. Nói như người trong công ty: tiếng Việt, từ ngữ nghiệp vụ đang dùng, giọng thân mật.
