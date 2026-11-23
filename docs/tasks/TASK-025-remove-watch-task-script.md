# TASK-025: Xóa Script watch:task Mồ Côi

## 1. Thông Tin Chung
- **Mã Task**: TASK-025
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Tooling
- **Trạng thái**:  **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

---

## 2. Bối Cảnh & Yêu Cầu
User đã xóa thư mục `scripts/` (chứa `watch-and-inject.ps1`), trong khi script npm `watch:task` vẫn trỏ tới file đó. Xóa script mồ côi.

## 3. Thay Đổi Theo File
- `web/package.json`: xóa `watch:task`, bỏ dấu phẩy cuối của `supabase:status`.
- `scripts/watch-and-inject.ps1`: xóa (do User, được đưa vào cùng commit này).
- `CLAUDE.md`: ghi chú về `watch:task` đã được BA sửa (file điều phối, chưa nằm trong commit).

## 4. Kết Quả Verification Gates
- JSON của `package.json` parse hợp lệ (Dev chạy, QA kiểm lại bằng `node -e`).
- `npm test`: 10/10 files, 92/92 tests pass.
- `tsc`/`build` bỏ qua theo đặc tả (chỉ đổi `package.json` scripts).
- QA: diff chỉ có đúng 1 dòng bị xóa và 1 dấu phẩy.
