# Sổ Theo Dõi Yêu Cầu & Nhiệm Vụ Đã Thực Hiện (CarMS Task Tracker)

Tài liệu này được tạo và duy trì bởi **BA Agent** nhằm theo dõi lịch sử các yêu cầu, tính năng đã phân tích, triển khai và kiểm định chất lượng, tránh trùng lặp công việc trong tương lai.

---

## 📌 Bảng Tổng Hợp Nhiệm Vụ (Task Index)

| Mã Task | Ngày | Tên Nhiệm Vụ | Phân Hệ | Trạng Thái | Chi Tiết |
| :--- | :---: | :--- | :--- | :---: | :--- |
| **TASK-001** | 2026-10-06 | Cải thiện Base System Prompt cho Trợ lý Meow | AI Assistant |  **Đã xong** (Commit `c5ea06c`) | [TASK-001](tasks/TASK-001-cai-thien-system-prompt.md) |
| **TASK-002** | 2026-10-06 | Tích hợp Tavily Web Search Tool | AI Assistant / Web Search |  **Đã xong** | [TASK-002](tasks/TASK-002-tich-hop-tavily-search.md) |
| **TASK-003** | 2026-10-06 | Tích hợp Tool tra cứu Luật pháp Việt Nam | AI Assistant / Legal Search |  **Đã xong** | [TASK-003](tasks/TASK-003-tich-hop-vietnam-law-search.md) |
| **TASK-004** | 2026-10-06 | Tích hợp System Read Tools (Prisma Read-Only) | AI Assistant / Core System |  **Đã xong** | [TASK-004](tasks/TASK-004-tich-hop-system-read-tools.md) |
| **TASK-005** | 2026-10-07 | Sửa Lệch Doanh Thu & Bổ Sung Tool Tổng Hợp Tháng | AI Assistant / Financial Analytics |  **Đã xong** | [TASK-005](tasks/TASK-005-sua-lech-doanh-thu-va-tool-thang.md) |
| **TASK-006** | 2026-10-07 | Redesign Giao Diện Chat Meow (Tasteful UI & Cat Avatar) | AI Assistant / Frontend UX-UI |  **Đã xong** | [TASK-006](tasks/TASK-006-redesign-ui-chat-meow.md) |
| **TASK-007** | 2026-10-07 | Thêm Thinking & Tool Execution Indicator Cho Meow | AI Assistant / Frontend UX-Streaming |  **Đã xong** | [TASK-007](tasks/TASK-007-thinking-va-tool-indicator.md) |
| **TASK-008** | 2026-10-08 | Bổ sung 4 System Tools mới & Phân quyền Role Guard | AI Assistant / Core System & Security |  **Đã xong** | [TASK-008](tasks/TASK-008-bo-sung-4-tools-va-role-guard.md) |
| **TASK-009** | 2026-10-09 | Màn hình Chi Phí Khác (Độc lập) & Cập nhật Form Chuyến | Operational Finance / Core System |  **Đã xong** | [TASK-009](tasks/TASK-009-man-hinh-chi-phi-khac.md) |
| **TASK-010** | 2026-10-09 | Màn hình Công Nợ Đối Tác & Tự Động Sinh Phiếu | Operational Finance / Core System |  **Đã xong** | [TASK-010](tasks/TASK-010-man-hinh-cong-no-doi-tac.md) |
| **TASK-011** | 2026-10-15 | Loại Bỏ Cột Thao Tác Thừa Trên Màn Hình Công Nợ | Operational Finance / Frontend UI Refinement |  **Đã xong** | [TASK-011](tasks/TASK-011-loai-bo-cot-thao-tac-cong-no.md) |
| **TASK-012** | 2026-10-15 | Đồng Bộ Dropdown Trạng Thái Giống Màn Tiền Dầu | Operational Finance / Frontend UI Refinement |  **Đã xong** | [TASK-012](tasks/TASK-012-dong-bo-dropdown-trang-thai-thanh-toan.md) |
| **TASK-013** | 2026-10-15 | Sửa Lỗi Modal Công Nợ & Loại Bỏ Scroll Ngang Thừa | Operational Finance / Bug Fix & Layout |  **Đã xong** | [TASK-013](tasks/TASK-013-sua-loi-modal-cong-no-va-bo-scroll-ngang.md) |
| ****TASK-014** | 2026-10-15 | Đổi Chế Độ Xem "Theo Xe" Thành Danh Sách Chuyến | Schedule / Frontend UI Refinement |  **Đã xong** (Commit `8b9cc42`) | [TASK-014](tasks/TASK-014-danh-sach-chuyen-theo-xe.md) |
| **TASK-015** | 2026-10-15 | Tích Hợp Chi Phí Khác Vào Doanh Thu & Lợi Nhuận | Operational Finance / Integration |  **Đã xong** (Commit `62abd09`) | [TASK-015](tasks/TASK-015-tich-hop-chi-phi-khac-vao-doanh-thu.md) |
| **TASK-016** | 2026-10-15 | Đưa Nội Dung Đầu Bảng & Đồng Bộ Cột Ngày Chi | Operational Finance / Frontend UI Refinement |  **Đã xong** | [TASK-016](tasks/TASK-016-noi-dung-dau-bang-va-dong-bo-ngay-chi.md) |
| **TASK-017** | 2026-10-23 | Chống Double-Submit / Multi-Click Khi Thêm & Sửa Chuyến | Dispatch Calendar / Core UI & Data Integrity |  **Đã xong** | [TASK-017](tasks/TASK-017-chong-duplicate-trip-submit.md) |
| **TASK-018** | 2026-11-02 | Sửa Cảnh Báo Supabase Auth getSession & Xử Lý Lỗi Form Thêm Chuyến | Auth & Security / Dispatch Calendar Form |  **Đã xong** | [TASK-018](tasks/TASK-018-sua-supabase-auth-va-loi-trip-form.md) |
| **TASK-019** | 2026-11-23 | Đồng Bộ Số Liệu Tài Chính Của Trợ Lý AI Với Màn Doanh Thu | AI Assistant / Operational Finance |  **Đã xong** | [TASK-019](tasks/TASK-019-ai-finance-tools-align.md) |
| **TASK-020** | 2026-11-23 | Công Nợ Đối Tác Tính Theo Ngày Về | Partner Debt / Operational Finance |  **Đã xong** | [TASK-020](tasks/TASK-020-partner-debt-workdate-return.md) |
| **TASK-021** | 2026-11-23 | Ngày Nghỉ Việc Cho Nhân Sự Và Lái Xe | HR / Salary / Operational Finance |  **Đã xong** | [TASK-021](tasks/TASK-021-staff-end-date.md) |
| **TASK-022** | 2026-11-23 | Ẩn Người Nghỉ Việc Khỏi Ô Chọn Lái Xe Và Chặn Đăng Nhập | HR / Auth / Dispatch Calendar |  **Đã xong** | [TASK-022](tasks/TASK-022-hide-left-people-and-block-login.md) |
| **TASK-023** | 2026-11-23 | Xóa Code Chết (Clean Code Đợt 1) | Code Quality |  **Đã xong** | [TASK-023](tasks/TASK-023-remove-dead-code.md) |
| **TASK-024** | 2026-11-23 | Tách systemTools.ts Theo Nhóm Tool (Clean Code Đợt 2) | Code Quality / AI Assistant |  **Đã xong** | [TASK-024](tasks/TASK-024-split-system-tools.md) |
| **TASK-025** | 2026-11-23 | Xóa Script watch:task Mồ Côi | Tooling |  **Đã xong** | [TASK-025](tasks/TASK-025-remove-watch-task-script.md) |
| **TASK-026** | 2026-11-23 | Báo Cáo Ngày Dùng Hàm Tính Tiền Chuẩn (Clean Code Đợt 3) | Code Quality / AI Assistant |  **Đã xong** | [TASK-026](tasks/TASK-026-daily-summary-use-shared-money.md) |
| **TASK-027** | 2026-11-23 | Gom Truy Vấn Và Phép Tổng Theo Tháng Bị Lặp (Clean Code Đợt 4) | Code Quality / Operational Finance |  **Đã xong** | [TASK-027](tasks/TASK-027-dedupe-month-queries.md) |
| **TASK-028** | 2026-11-23 | Sửa Xung Đột File Icon Trùng | Tooling / Frontend |  **Đã xong** | [TASK-028](tasks/TASK-028-fix-duplicate-icon-files.md) |
| **TASK-029** | 2026-11-23 | Tạm Tắt Trợ Lý AI | AI Assistant / Layout |  **Đã xong** | [TASK-029](tasks/TASK-029-disable-ai-assistant.md) |
| **TASK-030** | 2026-11-23 | Bộ Script SQL Kiểm Tra Và Đồng Bộ Production | Database / Security / Tooling |  **Đã xong** | [TASK-030](tasks/TASK-030-prod-sql-scripts.md) |
| **TASK-031** | 2026-11-23 | Màn Doanh Thu Tính Lương Cho Mọi Tháng | Operational Finance / Salary |  **Đã xong** | [TASK-031](tasks/TASK-031-revenue-page-salary-all-months.md) |
| **TASK-032** | 2026-11-23 | Tách Thư Mục Đầu Ra Của Dev Và Build | Tooling |  **Đã xong** | [TASK-032](tasks/TASK-032-separate-dev-and-build-dist.md) |
| **TASK-033** | 2026-11-23 | Lỗi Form Thân Thiện (Trùng Biển Số, Trùng Email) | Vehicles / Staff / UX |  **Đã xong** | [TASK-033](tasks/TASK-033-friendly-form-errors.md) |
| **TASK-034** | 2026-11-23 | Form Chuyến Dùng ActionResult (Lỗi Tiếng Việt Trên Production) | Schedule / UX |  **Đã xong** | [TASK-034](tasks/TASK-034-trip-form-action-result.md) |
| **TASK-035** | 2026-11-23 | Component Nút Dùng Chung (Button) | UI / Design system |  **Đã xong** | [TASK-035](tasks/TASK-035-shared-button.md) |

---

## 📂 Cấu Trúc Thư Mục `docs/`

```text
docs/
├── README.md                                    # Mục lục & bảng trạng thái chung
└── tasks/                                       # Chi tiết từng task (mục tiêu, file tác động, verification)
    ├── TASK-001-cai-thien-system-prompt.md
    ├── TASK-002-tich-hop-tavily-search.md
    ├── TASK-003-tich-hop-vietnam-law-search.md
    └── TASK-004-tich-hop-system-read-tools.md
```

---

##  Quy Trình Ghi Nhận
* Khi có yêu cầu mới được duyệt: Khởi tạo task trong `justdoit.md` và ghi nhận vào `docs/tasks/TASK-xxx.md`.
* Khi Dev Agent làm xong và Auditor hoàn tất verification gates: Cập nhật trạng thái sang `Đã xong` kèm commit hash tương ứng.
