# TASK-004: Tích hợp System Read Tools (Prisma Read-Only)

- **Ngày thực hiện:** 2026-10-06
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Core System Integration

## 1. Mục tiêu & Vấn đề giải quyết
- **Khắc phục độ trễ (Latency):** Thay vì phải search web mất vài giây, các câu hỏi về hoạt động nội bộ hôm nay được truy vấn trực tiếp qua Prisma Database nội bộ trong 15ms - 40ms.
- **Bộ 4 công cụ đọc chuyên dụng:**
  1. `get_daily_trips`: Tra cứu chuyến xe trong ngày, lọc theo tài xế, xe, điểm đón/trả.
  2. `get_available_vehicles`: Tra cứu xe rảnh/bận trong ngày theo số chỗ (4, 7, 16...).
  3. `get_daily_summary`: Báo cáo nhanh số chuyến, doanh thu ghi nhận, cọc đã thu, còn phải thu và tiền dầu hôm nay.
  4. `get_vehicle_inspections`: Cảnh báo xe sắp hết hạn đăng kiểm hoặc bảo hiểm.
- **Ràng buộc an toàn & tài chính:** Tuyệt đối READ-ONLY, không có mutation nào làm ảnh hưởng đến dữ liệu thực tế đang vận hành của công ty.

## 2. Các cải tiến và sửa lỗi kỹ thuật trong quá trình thực thi
- **Sửa casing Prisma model:** Dùng `prisma.fuelEntry` thay vì `prisma.FuelEntry` để khớp đúng runtime accessor của Prisma Client.
- **Sửa lỗi logic Prisma `where`:** Trong JavaScript/TypeScript, việc đặt nhiều key `OR` trong cùng một object literal sẽ khiến key sau ghi đè key trước. Dev Agent đã gom vào mảng `AND: [...]` để giữ nguyên cả lọc ngày lẫn lọc tài xế/biển số.
- **Đồng bộ công thức tài chính:** Tính toán tiền chuyến đi thông qua `tripMoney()` tại `src/utils/revenue.ts` thay vì tự cộng tay, bổ sung thêm các trường quan trọng: "Doanh thu ghi nhận", "Đã thu (cọc/thu trước)", "Còn phải thu" và "Chi phí chuyến".
- **Chuẩn hóa ngày giờ:** Tính toán ngày tới hạn đăng kiểm theo ngày local Việt Nam (`YYYY-MM-DD`) thay vì dùng `toISOString()` (vốn theo múi giờ UTC).

## 3. File tác động
- `web/src/services/systemTools.ts` *(Mới)*: Chứa 4 AI SDK tools kết nối Prisma.
- `web/src/services/systemTools.test.ts` *(Mới)*: Unit test với mock Prisma bao phủ cả 4 tools.
- `web/vitest.config.ts` *(Mới)*: Cấu hình alias `@/*` cho Vitest.
- `web/src/app/api/chat/route.ts`: Luôn cấp sẵn `systemReadTools()` cho AI ở mọi chế độ.
- `web/src/configs/systemPrompt.ts`: Cập nhật prompt khẳng định Meow có quyền đọc dữ liệu thật và yêu cầu gọi tool trước khi trả lời.

## 4. Kết quả Verification Gates
- `npx tsc --noEmit`: PASS (0 lỗi kiểu dữ liệu)
- `npm test`: PASS (10/10 test files, 63/63 tests passed)
- `npm run build`: PASS (18/18 routes biên dịch thành công trong 11.5s)
