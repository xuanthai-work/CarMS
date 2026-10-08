# TASK-008: Bổ Sung 4 System Tools Mới & Phân Quyền Role Guard Cho Meow

- **Ngày khởi tạo:** 2026-10-08
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Core System & Security

---

## 1. Mục tiêu & Vấn đề giải quyết

1. **Mở rộng năng lực dữ liệu nghiệp vụ cho Trợ lý Meow**:
   - Bổ sung 4 công cụ đọc dữ liệu chuyên sâu cho CarMS:
     - `get_driver_schedule`: Tra cứu thông tin tài xế, bằng lái, SĐT, loại tài xế và lịch chạy cuốc trong khoảng ngày.
     - `search_trips`: Tìm kiếm danh sách cuốc xe linh hoạt theo tên khách hàng, số điện thoại, mã cuốc, hoặc khoảng ngày.
     - `get_fuel_history`: Xem chi tiết nhật ký đổ dầu theo xe, tháng, trạng thái thanh toán và tổng tiền dầu.
     - `get_salary_breakdown`: Tra cứu chi tiết bảng lương từng nhân sự (văn phòng / lái xe) và công nợ tài xế đối tác (`PartnerPayout`).
2. **Thiết lập cơ chế phân quyền bảo mật (Role Guard)**:
   - Hệ thống CarMS phân chia hai nhóm vai trò rõ rệt:
     - **Quản lý (`isManager = true`)** gồm chức vụ `CEO`, `COO`: Có toàn quyền truy cập tất cả các công cụ tài chính, doanh thu, lợi nhuận và bảng lương nhân sự văn phòng.
     - **Nhân viên thường (`isManager = false`)**:
       - Bị chặn truy cập các báo cáo tài chính/doanh thu nhạy cảm: `get_monthly_finance` và `get_daily_summary` $\rightarrow$ Trả về chuỗi: `"Bạn không có quyền truy cập thông tin này"`.
       - Bị cấm xem bảng lương của nhân sự văn phòng trong `get_salary_breakdown` $\rightarrow$ Trả về chuỗi: `"Bạn không có quyền truy cập thông tin này"`.
       - Được phép tra cứu công nợ tài xế đối tác (`PartnerPayout`), lịch chạy của tài xế, thông tin cuốc xe, nhật ký tiền dầu và xe rảnh phục vụ điều xe.
       - Tự động ẩn thông tin `baseSalary` của tài xế khi người dùng không phải Quản lý.

---

## 2. Các thay đổi mã nguồn thực tế

1. **`web/src/app/api/chat/route.ts`**:
   - Lấy thông tin nhân sự của phiên đăng nhập qua `getCurrentStaff()`.
   - Tính toán `isManagerUser` qua `isManager(staff?.position ?? null)`.
   - Tạo `roleContext = { isManager, position, staffName }` và truyền vào `systemReadTools(roleContext)` và `buildSystemPrompt(...)`.
2. **`web/src/configs/systemPrompt.ts`**:
   - Định nghĩa `RoleContext`.
   - Bổ sung thông tin vai trò, họ tên, chức vụ và nhóm quyền của người dùng vào system prompt để LLM phản hồi tự nhiên và chính xác.
3. **`web/src/services/systemTools.ts`**:
   - Thêm hằng số `NO_PERMISSION = "Bạn không có quyền truy cập thông tin này"`.
   - Thêm Role Guard cho 2 tool cũ: `getDailySummaryTool` và `getMonthlyFinanceTool`.
   - Viết 4 công cụ mới: `getDriverScheduleTool`, `searchTripsTool`, `getFuelHistoryTool`, `getSalaryBreakdownTool`.
   - Cập nhật `systemReadTools(ctx)` gom đủ 9 System Tools an toàn (Read-Only).
4. **`web/src/components/assistant/Messages.tsx`**:
   - Mở rộng hàm `getThinkingStatus(parts)` bổ sung nhãn trạng thái sinh động cho 4 tool mới trong khối `ThinkingIndicator`.
5. **`web/src/services/systemTools.test.ts`**:
   - Bổ sung toàn diện test suite kiểm thử cả ca Quản lý và ca Nhân viên thường (77 unit tests toàn dự án passed).

---

## 3. Các file tác động thực tế

- `web/src/app/api/chat/route.ts`
- `web/src/configs/systemPrompt.ts`
- `web/src/services/systemTools.ts`
- `web/src/components/assistant/Messages.tsx`
- `web/src/services/systemTools.test.ts`

---

## 4. Kết quả Verification Gates (Audited)

- **`npx tsc --noEmit`**:  **PASS** (0 lỗi kiểu dữ liệu TypeScript).
- **`npm test`**:  **PASS** (10/10 test files, 77/77 tests passed trong 1.17s).
- **`npm run build`**:  **PASS** (Biên dịch thành công 18/18 routes Next.js production trong 11.1s).
