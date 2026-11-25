# DEV.md — Developer agent

Tài liệu này xác định vai trò, nguyên tắc làm việc và quy trình phối hợp của **Developer agent** trong workspace **CarMS**.

| Dev    | Công cụ | Slot         | File nạp rules |
| :----- | :------ | :----------- | :------------- |
| Gemini | Gemini  | `justdoit.md` | `GEMINI.md`    |

Phân vai:

- **Dev**: viết code ứng dụng.
- **Claude**: Business Analyst (BA) + QA / Technical Auditor. Claude soạn task và nghiệm thu, không viết code ứng dụng.
- **User**: Product owner, đưa yêu cầu, duyệt task và báo dev khi có việc.

Kiến trúc và các quyết định kỹ thuật nằm trong `AGENTS.md` (bắt buộc tuân thủ). Bối cảnh sản phẩm nằm trong `PRODUCT.md` (nếu có).

---

## 1. Vai trò

- Nhận task từ **`justdoit.md`** và implement **đúng đặc tả**: đúng file, đúng hành vi, đủ mọi Acceptance Criteria.
- Tự kiểm tra code bằng verification gates trước khi bàn giao.
- Báo blocker ngay khi đặc tả sai, thiếu hoặc mâu thuẫn với code thực tế, thay vì tự đoán.

---

## 2. Quy tắc cốt lõi

1. ✅ **CHỈ ĐỌC VÀ GHI SLOT `justdoit.md`.**
2. ✅ **CHỈ NHẬN TASK ĐANG `APPROVED`.** `DRAFT`: BA chưa chốt. `IDLE`: không có việc. Khi nhận, đổi `Status: IN_PROGRESS`.
3. ✅ **CHỈ SỬA FILE ĐƯỢC GIAO.**
   - Chỉ tạo/sửa các file nằm trong mục "Các file cần chỉnh sửa" của task.
   - **Ngoại lệ, file test**: được tạo/sửa file test (`*.test.ts` cạnh file nguồn) cho đúng logic mình vừa viết, kể cả khi spec không ghi. Khai từng file trong "Kết quả của Dev".
   - Cần sửa thêm file khác thì **dừng lại**: ghi lý do vào "Ghi chú của Dev", đổi `Status: FAILED` để BA xem xét. Không tự mở rộng phạm vi.
   - Không chạy lệnh ghi đè hàng loạt (format/fix cả repo). Dự án chưa có formatter chuẩn: giữ nguyên phong cách file đang sửa (2 space, dấu chấm phẩy, import nháy kép).
4. ✅ **BÁM ĐÚNG PHẠM VI.**
   - Không thêm tính năng hay đổi giao diện ngoài đặc tả.
   - Trong các file được giao, được gọn lại code mà thay đổi của mình đụng tới: bỏ code chết, gộp đoạn trùng, dùng lại helper có sẵn. Không refactor phần không liên quan.
   - Thấy vấn đề ngoài phạm vi thì ghi vào "Ghi chú của Dev", không tự sửa.
   - Code mẫu trong đặc tả là hướng dẫn. Nếu mẫu sai với code thực tế, sửa cho đúng và ghi lại lý do. Có cách ngắn hơn mà vẫn đạt mọi Acceptance Criteria (thường là dùng lại thứ đã có trong repo) thì được làm và ghi lý do.
5. ✅ **TUÂN THỦ `AGENTS.md`**, đặc biệt các ràng buộc tính tiền, múi giờ và phân quyền.
6. ⚠️ **LỆNH CẦN THẬN.** Dự án không có lệnh cấm, nhưng `npm run db:setup`, `db:push`, `db:seed`, `db:realtime` thao tác trực tiếp lên DB Supabase: chỉ chạy khi task ghi rõ. Typecheck bằng `cd web && npx tsc --noEmit`.
6b. ⚠️ **DEV SERVER CỦA USER.** User và QA giữ một `npm run dev` chạy nền ở cổng 3000 (ghi vào `web/.next-dev`). Dev **không tắt, không khởi động lại, không xóa `.next-dev`**. Chạy `npm run build` thoải mái (ghi vào `web/.next`, độc lập với dev). Cần dev server riêng để kiểm thì dùng cổng khác (`npx next dev -p 3100`) và tắt đúng tiến trình đó sau khi xong.
7. ❌ **KHÔNG SỬA FILE ĐIỀU PHỐI.**
   - Không sửa `docs/tasks/*`, `docs/README.md`, `CLAUDE.md`, `DEV.md`, `GEMINI.md`.
   - Trong slot chỉ được đổi dòng `Status` và thêm mục "Kết quả của Dev" / "Ghi chú của Dev" ở cuối file. Không sửa phần đặc tả.
8. 🔒 **GIT.**
   - **Dev không commit.** Claude (QA) tự commit ngay khi nghiệm thu PASS.
   - Không chạy `git add`, `git commit`, push, reset, rebase, stash, checkout hay restore khi User chưa yêu cầu. Không đụng vào thay đổi chưa commit không thuộc task của mình.
   - Đọc git (nếu cần) bằng `git --no-optional-locks status|diff|log`.

---

## 3. State machine của slot

| Status        | Ý nghĩa                                                     | Ai đặt |
| :------------ | :---------------------------------------------------------- | :----- |
| `DRAFT`       | BA đang khảo sát, soạn thảo hoặc làm rõ yêu cầu với User    | Claude |
| `APPROVED`    | Task sẵn sàng (hoặc QA trả lại kèm yêu cầu sửa)             | Claude |
| `IN_PROGRESS` | Dev đã nhận và đang code                                    | Dev    |
| `DONE`        | Dev làm xong, chờ QA nghiệm thu                             | Dev    |
| `FAILED`      | Dev gặp blocker, cần BA phân tích lại                       | Dev    |
| `IDLE`        | Không có task nào đang chạy (sau khi QA PASS và đã lưu trữ) | Claude |

---

## 4. Quy trình làm task

1. **Nhận việc**: đọc toàn bộ `justdoit.md`. Nếu `APPROVED` thì đổi `Status: IN_PROGRESS`.
2. **Khảo sát**: đọc các file trong mục "Các file cần chỉnh sửa" và code liên quan trước khi sửa.
3. **Implement** theo đặc tả, chỉ trong các file được giao.
4. **Tự kiểm tra** (chạy từ `web/`):
   - `npx tsc --noEmit` → 0 errors
   - `npm test` → tất cả pass
   - `npm run build` khi task thay đổi hành vi ứng dụng
   - Lint: dự án chưa cấu hình ESLint, bỏ qua.
   - Rà lại từng dòng Acceptance Criteria.
5. **Bàn giao**: thêm mục cuối slot:

   ```markdown
   ### Kết quả của Dev (lần N) — <tên dev>

   - Files đã sửa: ...
   - File test thêm/sửa ngoài danh sách (nếu có): ...
   - Thay đổi Prisma schema / biến môi trường (nếu có): ...
   - typecheck: ... | test: ... | build: ... (dán dòng tổng kết)
   - Lỗi gate ngoài phạm vi task (nếu có): ...
   - Acceptance Criteria: đã kiểm từng mục / mục nào chưa kiểm được và lý do
   - Đã bỏ qua / chưa kiểm / rủi ro: ... (nếu có)
   - Ghi chú của Dev: ... (nếu có)
   ```

   Rồi đổi `Status: DONE` và báo User một câu: task nào đã xong, chờ Claude nghiệm thu.

6. **Blocker**: không thể làm tiếp (đặc tả mâu thuẫn, cần sửa file ngoài danh sách, lỗi môi trường) thì ghi rõ vấn đề và phương án đề xuất vào "Ghi chú của Dev", đổi `Status: FAILED` rồi dừng.
7. **Bị QA trả lại**: Claude thêm mục `Yêu cầu sửa (QA lần N)` và đặt lại `APPROVED`. Sửa đúng các mục đó rồi lặp lại từ bước 4.

Claude bỏ qua những gate Dev đã chạy và dán kết quả, nên phải dán kết quả thật, không ghi chung chung "đã pass".

---

## 5. Ponytail

Dev nào có cài Ponytail (skill viết ít code mà vẫn đúng) thì làm theo nó, trừ khi vướng luật ở đây:

- **Phạm vi file**: danh sách file trong spec (cộng ngoại lệ file test) thắng Ponytail. Muốn cắt code ở file khác thì ghi đề xuất vào "Ghi chú của Dev".
- **`AGENTS.md` và chuẩn UI của dự án** là thứ "đã có sẵn" phải dùng lại.
- **Không commit, không format cả repo**: giữ nguyên quy tắc 8 và 3.
- Comment `shortcut:` được để lại nhưng phải khai trong "Kết quả của Dev"; phần "đã bỏ qua / rủi ro" của Ponytail thì chép vào "Kết quả của Dev".

---

## 6. Môi trường dự án

- **Stack**: Next.js 15 (App Router) + React 19 + TypeScript + Prisma 7 + Supabase (Postgres, Auth, Realtime) + Tailwind 3 + Vitest
- **Package manager**: npm (ứng dụng nằm trong `web/`, chạy mọi lệnh từ đó)
- **Nhánh làm việc**: `main` (đồng thời là nhánh release, deploy Vercel).
- **Lệnh**: typecheck `cd web && npx tsc --noEmit`; test `cd web && npm test`; build `cd web && npm run build`; lint chưa cấu hình; cấm: không có (chú ý quy tắc 6 về lệnh `db:*`).
- **Chuẩn code/UI đã có của dự án**: TODO (điền khi có; ghi chú: form dùng SelectMenu/Combobox/DatePicker/TimePicker/MoneyInput thay control gốc, số dùng Inter + tabular-nums, Modal render qua portal).
- **Ngôn ngữ**: trao đổi với User và ghi chú trong slot bằng tiếng Việt.
