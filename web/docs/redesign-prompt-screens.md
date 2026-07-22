# CarMS Redesign Prompt — Screens

> Dùng kèm `redesign-prompt-master.md`: mỗi lần dán **MASTER BRIEF + một khối screen**
> dưới đây vào Stitch. Chỉnh màn nào thì sửa đúng khối đó.

---

````text
# SCREEN 1 — "Tổng quan" (Overview dashboard)
The landing dashboard for managers. Top: a row of 4–6 KPI stat tiles using the large Space Grotesk tabular numbers with a small label and a subtle trend caption — "Doanh thu tháng", "Lợi nhuận tháng", "Chuyến trong tháng", "Xe đang hoạt động", "Công nợ phải thu", "Tiền dầu chưa trả". Below: a large area/line chart titled "Doanh thu & lợi nhuận theo tháng"; beside it a compact card "Trạng thái đội xe" (donut: đang chạy / trống / bảo dưỡng). Bottom row: "Chuyến sắp tới hôm nay" (a tight list with time, khách, tuyến, xe, tài xế) and "Cảnh báo" (đăng kiểm/bảo hiểm sắp hết hạn). Data-dense but breathable.

# SCREEN 2 — "Lịch" (Dispatch schedule) — THE HERO SCREEN
A month-based dispatch board with a view toggle: "Theo chuyến" (by trip) and "Theo xe" (by vehicle).
- "Theo xe" view = the signature dispatch board: vehicles listed as sticky rows on the left (biển số + số chỗ), a horizontal time/day axis across the top with a frozen header, and trip blocks laid across the grid as rounded color-coded cards (colored by status; left border tinted by owner own/partner). A thin vertical amber line marks "now". Blocks show khách, giờ đi–đến, tuyến. Blocks are draggable/resizable.
- "Theo chuyến" view = a grouped list/timeline of trips by day.
- Top bar: month selector (‹ Tháng 7, 2026 ›), view toggle, and a primary "＋ Tạo chuyến" button.
Include the "Tạo/sửa chuyến" modal: fields Khách hàng, SĐT, lượt Đi (Ngày, Giờ, Điểm đón, Điểm trả, Xe, Tài xế) and optional lượt Về, Giá, Cọc, Trạng thái, Ghi chú. Vehicle field allows a seat-class placeholder ("7 chỗ", "16 chỗ") when no specific vehicle is assigned.

# SCREEN 3 — "Doanh thu" (Revenue) — managers only
Month selector at top. A row of KPI tiles: "Doanh thu ghi nhận", "Chi phí khác", "Tiền dầu tháng", "Tổng chi phí", "Lợi nhuận", "Đã thanh toán", "Còn phải thu", "Số chuyến" (large tabular numbers, money in ₫). Below: a table of trips — columns Khách · Ngày đi · Loại · Giá · Chi phí · Còn phải thu · Trạng thái. The Giá column is bold; Trạng thái is an inline colored dropdown ("Mới/Chưa xử lý", "Đã nhắn khách", "Đã thanh toán") that opens a confirm popup on change. Right-align all money columns with tabular figures.

# SCREEN 4 — "Tiền dầu" (Fuel costs)
Month selector + summary tiles ("Tổng tiền dầu tháng", "Đã trả", "Chưa trả", "Số phiếu"). A table of fuel entries — columns Xe · Ngày đổ · Số tiền · Trạng thái thanh toán · Người trả · Ghi chú — with inline add/edit rows and a payment-status chip (paid/unpaid). Money right-aligned, tabular.

# SCREEN 5 — "Quản lý xe" (Vehicles)
A searchable grid of vehicle cards. Each card: biển số (mono, prominent), số chỗ, loại (own/partner tinted), hạn đăng kiểm, hạn bảo hiểm, trạng thái (đang hoạt động / bảo dưỡng), ghi chú. Cards with an expiring registration/insurance show an amber warning. A "＋ Thêm xe" button opens an add/edit modal.

# SCREEN 6 — "Nhân sự" (Staff)
A tab toggle: "Lái xe" and "Văn phòng" (staff role sees only "Lái xe").
- Lái xe: searchable list of driver cards — Tên, SĐT, hạng bằng lái, loại (own/partner), ghi chú.
- Văn phòng: office-staff cards — Tên + chức vụ badge; fields SĐT, Email, Giới tính, Ngày sinh, CCCD, Số BHXH, Lương cơ bản, Ngày nhận lương, Ngày vào làm. Add/edit modal with a custom dropdown for Chức vụ (CEO/COO/Nhân viên) and Giới tính, a date picker, and a money input with thousand-separators.

# SCREEN 7 — "Hồ sơ" (Profile)
The logged-in person's own record. Card 1 "Thông tin cá nhân": avatar (initial) + Tên + chức vụ badge, then a grid — SĐT, Email, Giới tính, Ngày sinh, CCCD, Số BHXH, Ngày vào làm — plus a "Lương" sub-section (Lương cơ bản, Ngày nhận lương). Card 2 "Tài khoản & bảo mật": email đăng nhập + "Đã xác thực" badge, last sign-in, "Đổi mật khẩu" link, and a red "Đăng xuất" button.

# SCREEN 8 — "Đăng nhập" (Login)
A centered auth card on a soft gradient canvas with two decorative blur orbs. CarMS logo/mark (a van/bus glyph) + "CarMS" wordmark, title, email + password fields, a primary "Đăng nhập" button, and a "Quên mật khẩu?" link. Reuse this shell for forgot/reset password.

# COMPONENT NOTES (apply across screens)
Status chips: rounded pill, colored dot + Vietnamese label. Custom dropdowns (not native selects) styled to match. Date picker: typeable dd/mm/yyyy + calendar popover with month and year jump. Time picker: 2-column scroll wheels (giờ | phút). Money input: dots as thousand separators, ₫ suffix. Empty states: a short Vietnamese invitation to act (e.g. "Chưa có chuyến nào — tạo chuyến đầu tiên").
````
