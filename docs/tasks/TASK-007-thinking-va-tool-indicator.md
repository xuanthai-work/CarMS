# TASK-007: Thêm Thinking & Tool Execution Indicator Cho Meow

- **Ngày khởi tạo:** 2026-10-07
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Frontend UX-Streaming

## 1. Mục tiêu & Vấn đề giải quyết
- **Hiện tượng lỗi trải nghiệm:** Khi người dùng gửi câu hỏi, AI bắt đầu stream nhưng phải mất 2 – 5 giây để gọi tool (tra cứu DB Prisma, tính doanh thu hoặc tìm kiếm web qua Tavily). Trong khoảng thời gian này:
  1. `showTypingIndicator` bị tắt sớm do nhầm lẫn chunk text rỗng (`""`) là đã có nội dung (`some(p => p.type === "text")`).
  2. Mọi sự kiện tool call (`tool-...`) đều bị trả về `null` trong `renderContentPart`.
  3. Kết quả là màn hình đứng im, trắng trơn, không có biểu tượng loading hay dòng thông báo nào, khiến người dùng lầm tưởng AI bị treo/đơ.
- **Giải pháp UX:**
  - Bổ sung component `ThinkingIndicator` chuyên nghiệp hiển thị ngay dưới avatar của Meow:
    - Có avatar mèo `/meow-avatar.jpg`.
    - 3 chấm xanh nhảy nhót động (`animate-bounce`).
    - Hiển thị nhãn ngữ cảnh thời gian thực theo từng tool đang thực thi:
      - Tra cứu tài chính (`get_monthly_finance`, `get_daily_summary`): *"Đang tổng hợp số liệu tài chính & doanh thu..."*
      - Tra cứu xe & tài xế (`get_daily_trips`, `get_available_vehicles`): *"Đang tra cứu lịch xe & điều phối..."*
      - Đăng kiểm (`get_vehicle_inspections`): *"Đang kiểm tra hạn đăng kiểm & bảo hiểm..."*
      - Tìm web (`tavily_search`, `search_web`, `google_search`): *"Đang tìm kiếm thông tin trên Web..."*
      - Tra cứu luật (`vietnam_law_search`, `search_vietnam_law`): *"Đang tra cứu quy định pháp luật Việt Nam..."*
      - Trạng thái chờ khởi tạo: *"Meow đang suy nghĩ..."*
  - Chỉ ẩn Indicator khi đã thực sự có văn bản hiển thị (`p.type === "text" && p.text.trim().length > 0`).

## 2. Các thay đổi mã nguồn thực tế
- File `web/src/components/assistant/Messages.tsx`:
  - Hàm `getThinkingStatus(parts)`: trích xuất tool part gần nhất, khớp chính xác tên tool nội bộ (`tavily_search`, `vietnam_law_search`, `google_search`, `get_monthly_finance`...).
  - Component `ThinkingIndicator`: khối thông báo bo góc `rounded-xl` viền `border-slate-200/80` nền `bg-slate-100/90` kèm avatar mèo meme và 3 chấm xanh động.
  - Sửa logic `showThinkingIndicator`: kiểm tra `p.text.trim().length > 0` giúp indicator luôn duy trì xuyên suốt chu kỳ gọi tool.

## 3. File tác động thực tế
- `web/src/components/assistant/Messages.tsx`

## 4. Kết quả Verification Gates (Audited)
- `npx tsc --noEmit`: **PASS** (0 lỗi TypeScript).
- `npm test`: **PASS** (10/10 test files, 66/66 unit tests passed).
- `npm run build`: **PASS** (18/18 routes biên dịch production thành công trong 15.7s).
