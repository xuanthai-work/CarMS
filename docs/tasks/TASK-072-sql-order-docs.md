# TASK-072: Sửa Thứ Tự Chạy SQL Production Trong README Và Ghi Chú Script

## 1. Thông Tin Chung
- **Mã Task**: TASK-072
- **Ngày hoàn thành**: 2026-11-26
- **Phân hệ**: Deploy / Tài liệu
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
README và đầu file `06`–`10` ghi "chạy sau khi deploy" là sai: code mới đọc các cột/bảng đó. Thứ tự đúng: `01` → backup → kiểm policy realtime → `02`, `06`–`10` → rà lương tháng cũ → deploy → `03`, `04` nếu cần → `05` khi ổn định.

## 3. Thay Đổi Theo File
- `web/supabase/scripts/README.md`: sơ đồ và các bước theo thứ tự trên, thêm kiểm policy realtime, trỏ `roadmap.md` mục 6, sửa mục sao lưu.
- `05`–`10` `.sql`: chỉ đổi dòng comment.

## 4. Kết Quả Kiểm Chứng
- Dev: không chạy gate (không đổi code).
- QA: đọc diff; lọc diff `.sql` không còn dòng thay đổi nào ngoài comment; README khớp `roadmap.md` mục 6.
