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
