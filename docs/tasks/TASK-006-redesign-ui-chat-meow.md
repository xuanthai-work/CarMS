# TASK-006: Redesign Giao Diện Chat Meow (Tasteful UI & Cat Avatar)

- **Ngày khởi tạo:** 2026-10-07
- **Trạng thái:**  **Hoàn thành**
- **Phân hệ:** AI Assistant / Frontend UX-UI

## 1. Mục tiêu & Vấn đề giải quyết
- **Khắc phục điểm yếu thẩm mỹ và trải nghiệm của UI cũ:**
  - Khung nhập liệu (Composer) quá chật chội: Tab `Thường | Web` kích thước lớn cướp không gian, ép dropdown model bị cắt cụt tên (`Space B... ⌄`).
  - Thiếu nhận diện thương hiệu AI: Chỉ có chữ "Meow" trơn, thiếu avatar biểu tượng đặc trưng.
  - Bảng dữ liệu tài chính sơ sài: Cột ngày, tiền dính liền, chưa có căn lề phải (`text-right`) và kiểu chữ mono (`tabular-nums`) chuẩn kế toán.
  - Cảnh báo công nợ và dầu mỏ dạng text trơn xám xịt, khó quét nhanh.
- **Tiêu chuẩn thiết kế mới (Tasteful Modern UI):**
  - Đổi avatar bot sang hình chú mèo meme hài hước tại `/meow-avatar.jpg` (kèm trạng thái trực ban online).
  - Floating Composer: Web search đổi thành Pill Toggle tinh tế (`Tìm kiếm Web`), Model selector hiển thị trọn vẹn tên model, nút gửi hiện đại.
  - Cải tiến Markdown Components: Hỗ trợ bảng tài chính chuyên nghiệp căn lề chuẩn, font mono `tabular-nums` cho số tiền, và nút sao chép câu trả lời.

## 2. Các thay đổi mã nguồn thực tế
1. **Header & Avatars (`Drawer.tsx`, `RightRail.tsx`):**
   - Header hiển thị avatar tròn bo góc 12px `/meow-avatar.jpg` kèm chấm xanh trực ban `bg-emerald-500` và badge `CarMS Copilot`.
   - Nút mở Meow trên thanh `RightRail.tsx` hiển thị avatar mèo meme bo góc.
2. **Redesign Composer (`Composer.tsx`):**
   - Loại bỏ hoàn toàn `FilterTabs` cồng kềnh.
   - Thêm nút Pill Toggle `Tìm kiếm Web` nhỏ gọn với icon `GlobeIcon` (`h-7 px-2.5`).
   - Mở rộng vùng hiển thị cho `ModelPicker` (`min-w-[130px] max-w-[160px]`), không còn bị cắt chữ `Space B...`.
   - Chuẩn hóa nút gửi vuông bo góc `rounded-xl` đồng bộ.
3. **Cải tiến hiển thị nội dung (`Messages.tsx`):**
   - Thêm mini avatar `/meow-avatar.jpg` cạnh tin nhắn của assistant.
   - Hàm `isNumericCell()` tự động căn phải `text-right font-mono tabular-nums` cho các ô số tiền, phần trăm trong bảng Markdown.
   - Thêm zebra striping `even:bg-canvas/40` và bo góc `rounded-xl` cho bảng.
   - Bổ sung nút `CopyButton` ("Sao chép" / "Đã sao chép") tiện lợi.

## 3. File tác động thực tế
- `web/src/components/assistant/Drawer.tsx`
- `web/src/components/assistant/Composer.tsx`
- `web/src/components/assistant/Messages.tsx`
- `web/src/components/assistant/RightRail.tsx`
- `web/src/components/assistant/icons.tsx`
- `web/public/meow-avatar.jpg`

## 4. Kết quả Verification Gates (Audited)
- `npx tsc --noEmit`: **PASS** (0 lỗi TypeScript).
- `npm test`: **PASS** (10/10 test files, 66/66 unit tests passed).
- UI Render: Avatar, Pill Toggle, Model Picker, Bảng số liệu và Nút sao chép hoạt động trơn tru.
