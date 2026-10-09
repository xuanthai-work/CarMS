# TASK-010: Xây Dựng Màn Hình "Công Nợ" (Theo Dõi Tiền Thuê Đối Tác) & Tự Động Sinh Phiếu

- **Ngày khởi tạo:** 2026-10-09
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** Operational Finance / Core System

---

## 1. Mục tiêu & Nghiệp vụ
1. **Màn hình Công nợ (`/cong-no`)**:
   - Vị trí: Hiển thị ngay dưới menu **Chi phí khác** trên Sidebar.
   - Trọng tâm nghiệp vụ: Chuyên biệt theo dõi công nợ **tiền thuê đối tác** (đã trả tiền thuê cho đối tác hay chưa).
   - Tính năng chính:
     - Thẻ KPI: Tổng tiền thuê đối tác, Đã thanh toán (`emerald`), Còn nợ đối tác (`amber`), Cuốc chưa thanh toán.
     - Bộ lọc: Lọc theo tháng (`MonthNav`) kết hợp nút chuyển đổi nhanh **"Tất cả nợ tồn đọng"** để theo dõi công nợ lũy kế qua các tháng.
     - Tab lọc trạng thái: `Tất cả` | `Chưa trả` | `Đã trả`.
     - Tìm kiếm: Tìm kiếm theo biển số xe đối tác, tên khách hàng, lộ trình chuyến.
     - Thao tác 1 chạm: Nút **"Thanh toán"** trực tiếp trên từng dòng mở popup xác nhận ngày trả + người trả ➔ Cập nhật trạng thái `paid`.
2. **Cơ chế tự động sinh phiếu công nợ đối tác**:
   - Tự động hóa trong [api/trips.ts](file:///D:/work/Linh/CarMS/web/src/api/trips.ts): Khi thêm mới hoặc chỉnh sửa chuyến có chọn xe đối tác (`type === "partner"`) và có tiền thuê (`partnerCost > 0`), hệ thống tự động tạo/cập nhật bản ghi `PartnerDebt` gắn với chuyến đó (mặc định trạng thái `unpaid`).
   - Nếu sửa chuyến bỏ xe đối tác hoặc xóa `partnerCost`: Tự động hủy/xóa phiếu nợ tương ứng.
   - Khi xóa chuyến: Phiếu nợ tự động được xóa theo nhờ thiết lập `onDelete: Cascade`.
3. **An toàn tài chính**:
   - Tuyệt đối không làm thay đổi các công thức tính lương tại [salary.ts](file:///D:/work/Linh/CarMS/web/src/utils/salary.ts) và doanh thu tại [revenue.ts](file:///D:/work/Linh/CarMS/web/src/utils/revenue.ts).

---

## 2. Danh sách file thay đổi & tạo mới

### Các file tạo mới:
- `web/src/services/debts.ts`: Cung cấp hàm `getPartnerDebts` truy vấn công nợ kèm thông tin cuốc xe (lấy theo tháng hoặc tất cả các khoản tồn đọng).
- `web/src/api/debts.ts`: Server Actions `setPartnerDebtStatus` và `updatePartnerDebt` (bảo vệ bởi `requireEditor()`).
- `web/src/components/debts/DebtScreen.tsx`: Giao diện chính theo dõi công nợ đối tác, thẻ thống kê, bộ lọc và bảng dữ liệu.
- `web/src/components/debts/DebtPayModal.tsx`: Modal thanh toán nhanh hoặc chỉnh sửa thông tin thanh toán.
- `web/src/app/(main)/cong-no/page.tsx`: Server Component trang Công nợ.

### Các file sửa đổi:
- `web/prisma/schema.prisma`: Khai báo model `PartnerDebt` với quan hệ 1-1 với `Trip` (`onDelete: Cascade`), index `[workDate]` và `[paymentStatus]`.
- `web/src/types/index.ts`: Thêm kiểu dữ liệu `PartnerDebtPaymentStatus` và `PartnerDebt`.
- `web/src/api/trips.ts`: Bổ sung hàm `syncPartnerDebt` tự động tạo/cập nhật/xóa phiếu công nợ đối tác trong vòng đời chuyến xe.
- `web/src/components/layout/Sidebar.tsx`: Thêm icon `DebtIcon` và menu liên kết `/cong-no` bên dưới `Chi phí khác`.
- `web/src/api/revalidate.ts`: Bổ sung `revalidatePath("/cong-no")` vào `revalidateAll()`.

---

## 3. Kết quả Verification Gates (Audited)

- **TypeScript Typecheck (`npx tsc --noEmit`)**: **PASS** (0 lỗi).
- **Unit Test Suite (`npm test` / Vitest)**: **PASS** (10/10 test files, 77/77 tests passed).
- **HTTP Smoke Test (`/cong-no`, `/chi-phi-khac`, `/lich`)**: **PASS** (Toàn bộ các routes trả về Status 200 OK).
