# Lộ trình CarMS — bản mới lấy v1 làm gốc

Cập nhật: 2026-11-25. Người quyết định: User (Product owner). Tài liệu này do BA/QA (Claude) giữ; mỗi giai đoạn sẽ tách thành các task nhỏ trong `justdoit.md`.

## 1. Quyết định đã chốt với User

1. **v1 (CarMS) là gốc.** `CarMS-v2` (thư mục anh em) chỉ là nguồn ý tưởng giao diện và một số cải tiến dữ liệu, không phải nền để xây tiếp.
2. **Lưới lịch của v1 là cốt lõi, không sửa cách hoạt động** (xem theo xe/theo chuyến, kéo cuộn kiểu Excel). v2 làm mất phần này.
3. **Sidebar nổi 3D của v1 giữ nguyên.** Từ v2 lấy **Drawer cho các màn không phải chuyến** và **sự đồng bộ giao diện** (nút, bảng, form dùng chung).
4. **Thêm, xem, sửa chuyến dùng cùng một modal** (User chốt 2026-11-23: cùng một kiểu cho dễ dùng). Chuyến không dùng drawer; Mọi màn khác (xe, lái xe, nhân sự, chi phí, dầu, công nợ, phiếu lương...) dùng Drawer cho cả thêm lẫn xem/sửa (User chốt 2026-11-23); modal chỉ còn cho chuyến và hộp xác nhận nhỏ. Modal mở/đóng bằng hiệu ứng zoom từ vị trí vừa bấm (kiểu cửa sổ macOS). Bỏ bảng chi tiết cũ; thay bằng một ô ghi chú tự do lớn, kèm dải tiền gọn (giá, các lần khách trả, chi phí đối tác, trạng thái) và dải thông tin xếp lịch (ngày giờ, xe, lái xe, số chỗ). Chỉ những thứ máy cần tính hoặc cần để xếp lịch mới là ô riêng.
5. **Được phép làm lại và hướng dẫn người dùng lại.** Dữ liệu production rất ít nên di chuyển dữ liệu rẻ.
6. **Trợ lý AI đang tắt** (`web/src/configs/features.ts`). Làm lại sau.
7. **Mọi SQL đặt trong `web/supabase/scripts/`**, chạy tay, không dùng `migrations/`.
8. Dữ liệu và tài khoản QA trên DB local (id bắt đầu `qa-`) **giữ lại** làm dữ liệu mock.

## 2. Cải tiến dữ liệu lấy từ v2 (đã duyệt)

| Mục | Quyết định |
|---|---|
| Thu tiền nhiều đợt (cọc, thanh toán, hoàn tiền) | **Bỏ** (User chốt 2026-11-25: giữ 1 ô cọc + trạng thái thủ công) |
| Hủy chuyến có phí hủy | **Xong** (TASK-054, 055) |
| Tiền kiểu số nguyên (thay số thực) | **Bỏ** (User chốt 2026-11-25: dữ liệu không có số lẻ, rủi ro đổi cột lớn hơn lợi ích) |
| Gom chi phí một sổ có phân loại | **Làm** (giai đoạn 4) |
| Lương có ngày hiệu lực, phiếu lương chốt được, tạm ứng riêng | **Làm** (giai đoạn 5, sau khi User giải thích cách trả lương thực tế) |
| Xóa mềm, nhật ký thay đổi | Để sau |
| Thực thể Khách hàng, Đối tác, 5 vai trò, chuyến nhiều chặng tùy ý | Không làm (chưa cần) |

## 3. Các giai đoạn

| GĐ | Nội dung | Ghi chú |
|---|---|---|
| 0 | Quét lỗi v1 (Playwright + dữ liệu QA), sửa lỗi nền | Có một lỗi User báo mà BA chưa tái hiện được, xem mục 4 |
| 1 | Bộ giao diện chung: nút chung, hiệu ứng zoom cho Modal, khung SideDrawer; giữ sidebar 3D và lưới lịch | **Xong** (TASK-035..037). Drawer chỉ làm khung ở đây; chuyển các màn sang drawer ở giai đoạn 6 |
| 2 | Modal chuyến thống nhất cho thêm/xem/sửa, có ô ghi chú tự do | **Xong** (TASK-038..044). Không đổi dữ liệu |
| 3 | Nâng dữ liệu tiền: chỉ làm hủy chuyến + phí hủy | **Xong** (TASK-054, 055). Thu nhiều đợt và số nguyên đã bỏ |
| 4 | Gom chi phí (dầu, cầu đường, đối tác, khác) | **Bỏ** (User chốt 2026-11-25 sau khi dùng thử: gộp màn không hợp lý, không cần màn Tổng chi phí; TASK-056..059 đã rút lại) |
| 5 | Làm lại lương | **Đã chốt nghiệp vụ (2026-11-25), xem mục 3b.** Tách thành 4 task: 067 tạm ứng riêng, 068 lương có ngày hiệu lực, 069 tính theo ngày vào/nghỉ làm (25 công), 070 chốt phiếu lương |
| 6 | Đổi các màn còn lại (xe, lái xe, nhân sự, chi phí, dầu, công nợ) sang drawer và bộ giao diện chung | **Xong** (TASK-045..052: xe, lái xe, nhân sự, dầu, chi phí khác, công nợ, lương tháng, phiếu công ngày). Tất cả màn ngoài chuyến: thêm và sửa đều qua Drawer |

## 3b. Nghiệp vụ lương đã chốt (GĐ 5)

- Phạm vi: chỉ lương tháng cố định (nhân viên văn phòng và lái xe nhà); không có tiền theo chuyến. Trả một lần/tháng (cờ đã trả + ngày trả như hiện tại).
- **Tạm ứng riêng**: ghi nhiều lần (ngày, số tiền, ghi chú); tổng tạm ứng của tháng tự trừ vào lương tháng đó; không chuyển nợ sang tháng sau. Khấu trừ khác tách khỏi tạm ứng.
- **Lương có ngày hiệu lực**: mức lương cơ bản có "hiệu lực từ ngày X" (ngày bất kỳ), có lịch sử; tháng chứa ngày X tính tỷ lệ hai mức theo ngày công.
- **Tính theo ngày vào/nghỉ làm**: 1 tháng = 25 ngày công (User chốt: không quan tâm ngày nghỉ); lương ngày = lương ÷ 25; vào hoặc nghỉ giữa tháng thì công = min(25, số ngày LỊCH đã làm trong tháng), lương = lương ÷ 25 × công.
- **Chốt phiếu lương**: chốt thì khóa số liệu (đóng băng lương cơ bản, tạm ứng, thưởng, thực nhận), không sửa được; "Mở chốt" cho bất kỳ ai có quyền sửa (phân quyền thật làm sau).

## 4. Lỗi đang theo dõi

- **Phiếu công ngày (Lương → Lương ngày):** User báo thêm một phiếu rồi bấm "Thêm" tiếp thì modal không hiện, phải chuyển sang tab trình duyệt khác rồi quay lại mới hiện. **BA chưa tái hiện được** trên local (dev và bản build production, có giả lập mạng chậm 1,2 giây, thêm hai phiếu liên tiếp đều bình thường). Cần User cho biết: chỉ xảy ra trên production hay cả local, trình duyệt nào, có bấm "Thêm" ngay lúc bảng đang làm mới không, và có xảy ra ở các modal khác (Tiền dầu, Chi phí khác, Công nợ) không.
- Lỗi lương F9 đã sửa (TASK-031). Còn tồn: lương chưa xét ngày vào làm; tháng chưa có dòng lương dùng lương cơ bản hiện tại (xử lý ở giai đoạn 5).
- Dữ liệu: chuyến cọc lớn hơn giá bị ẩn phần dư (xử lý ở giai đoạn 3).
- Đường dẫn `/cai-dat` trả 404 (thư mục rỗng `web/src/app/(main)/cai-dat/`).

## 5. Đã xong (2026-11-23 đến 2026-11-25)

TASK-019 đến TASK-031 (tài chính AI, công nợ theo ngày về, ngày nghỉ việc, chặn đăng nhập, clean code, tắt AI, bộ script SQL production, màn Doanh thu tính lương mọi tháng). Giai đoạn 1, 2, 6 xong (TASK-032..052); TASK-053 bỏ ngày trả của phiếu công ngày (đã có script production `05`). Chi tiết ở `docs/README.md` và `docs/tasks/`.

## 6. Checklist deploy production (soạn 2026-11-26)

Tại thời điểm soạn: theo em biết **chưa chạy gì trên production**, 58 commit chưa push (`origin/main` = `9f47edb`). Các script SQL do User tự chạy trên Supabase SQL Editor.

> **Thứ tự dưới đây thay cho `web/supabase/scripts/README.md` và ghi chú đầu các file 06–10.** Chỗ đó ghi "chạy sau khi deploy" là SAI: code mới đọc các cột/bảng này, thiếu thì trang lỗi. Code cũ bỏ qua cột và bảng thừa, nên chạy trước là an toàn. Chỉ `05` phải chạy sau.

### A. Trước khi đụng database

- [x] Bản đang chạy (để rollback): commit `9f47edb`, deployment `car-kue3p4fdd-xuanthai-works-projects.vercel.app`, tạo 02/11, domain `car-ms.vercel.app`.
- [ ] Vercel → Environment Variables: đủ các biến trong `web/.env.example` đang dùng (Supabase, `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, key trợ lý AI nếu bật). Build Command không được chứa `db:push`/`db:setup`.
- [x] Phân quyền (User đồng ý 2026-11-26): lên production với quyền mở tạm, mọi chức vụ xem được doanh thu và lương văn phòng, chỉ CEO là chỉ xem.
- [x] Số Doanh thu T11/2026 trên bản cũ (chụp 26/11): doanh thu 272.674.000; đã thanh toán 243.474.000; còn phải thu 29.200.000; tổng chi phí 74.205.131; lợi nhuận 198.468.869; 65 chuyến (23 chưa có giá). User: các tháng khác không cần.
- [ ] Chạy `01-audit-readonly.sql` từng khối. Thiếu bảng, hoặc thiếu cột ngoài `endDate`: dừng, gửi BA.
- [ ] Sao lưu DB (Dashboard → Backups, hoặc `pg_dump` bằng `DIRECT_URL` cổng 5432). Kiểm file sao lưu có dung lượng.
- [ ] Kiểm policy realtime (kỳ vọng 4 bảng đều `so_policy` ≥ 1; bảng nào 0 thì dừng, gửi BA, vì `02` bật RLS sẽ làm mất tự làm mới màn hình):

```sql
SELECT c.relname AS bang, c.relrowsecurity AS rls, count(p.policyname) AS so_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public' AND c.relname IN ('Vehicle','Driver','Trip','FuelEntry')
GROUP BY 1,2 ORDER BY 1;
```

### B. SQL thêm cột/bảng (chạy TRƯỚC khi push, nên làm liền một buổi, lúc ít người dùng)

- [ ] `02-sync-schema.sql` khối 01, rồi khối 02 (2 dòng) và khối 03 (0 dòng).
- [ ] `06-add-trip-cancelfee.sql`
- [ ] `07-add-salary-advance.sql`
- [ ] `08-add-salary-rate.sql`
- [ ] `09-add-driver-startdate.sql`
- [ ] `10-add-salary-lock.sql`
- [ ] Mở app (bản cũ) kiểm vẫn chạy bình thường.

### C. Lương tháng cũ (chạy sau `10`, trước khi push)

Code mới tính theo 25 công, nên tháng chứa ngày vào làm của nhân viên văn phòng sẽ ra số khác; tháng trước ngày vào làm thì dòng của người đó biến mất.

- [ ] Xem ai có ngày vào/nghỉ làm, sửa ngay trong app nếu ngày nhập sai:

```sql
SELECT name, "startDate", "endDate" FROM "OfficeStaff"
WHERE "startDate" <> '' OR "endDate" <> '' ORDER BY "startDate";
```

- [ ] Xem phiếu lương bị ảnh hưởng (rỗng là ổn):

```sql
SELECT o.name, o."startDate", o."endDate", sm."monthKey", sm."baseSalary", sm.paid
FROM "SalaryMonth" sm
JOIN "OfficeStaff" o ON o.id = sm."personId" AND sm."personType" = 'office'
WHERE sm."monthKey" IN (left(o."startDate",7), left(o."endDate",7))
   OR sm."monthKey" < left(o."startDate",7)
ORDER BY 1, 4;
```

- [ ] (**Chạy**, User chốt 2026-11-26) Giữ nguyên số của mọi phiếu **đã trả** bằng cách chốt theo công thức cũ (cơ bản + cộng − trừ). Xem trước, rồi cập nhật:

```sql
SELECT "monthKey", count(*) AS so_phieu, sum("baseSalary" + additions - deductions) AS tien_da_tra
FROM "SalaryMonth" WHERE paid AND NOT locked GROUP BY 1 ORDER BY 1;

UPDATE "SalaryMonth"
SET locked = true, "lockedAt" = now(), "workDays" = 25, earned = "baseSalary", advances = 0
WHERE paid AND NOT locked;
```

  Không dùng nút "Chốt phiếu" trong app cho các tháng đã trả: nút đó tính lại theo công thức mới. "Mở chốt" các phiếu này cũng làm số tính lại. Chốt không giữ được dòng của người bị ẩn vì ngày vào làm nằm sau tháng đó.

### D. Deploy

- [ ] `git push origin main`, chờ Vercel báo Ready.
- [ ] Đăng nhập; mở Tổng quan, Lịch (mở một chuyến), Xe, Nhân sự, Lương, Doanh thu, Tiền dầu, Chi phí khác, Công nợ, trợ lý AI (nếu bật).
- [ ] (Không bắt buộc, theo User) So Doanh thu T11 với số ở mục A.
- [ ] Mở một chuyến ở hai máy, sửa một máy, máy kia tự cập nhật (realtime).
- [ ] Xem Vercel Logs: không có lỗi `P2022` (thiếu cột) hay `P2021` (thiếu bảng).
- [ ] Thử trên iPhone: Lương, Lịch, Nhân sự.
- [ ] Cẩn thận: "Chốt tất cả" tạo phiếu cho mọi người của tháng, kể cả lái xe chưa có lương.

### E. Sau deploy

- [ ] `03-backfill-partner-debt-workdate.sql` (**chạy**, User chốt 2026-11-26): xem bước 1, rồi mới chạy bước 2.
- [ ] `04-cleanup-duplicate-trips.sql`: chỉ chạy khi xem bước 1 thấy trùng và BA xác nhận.
- [ ] Sau vài ngày ổn định: `05-drop-partnerpayout-paymentdate.sql`.

### Nếu hỏng

- Trước khi chạy `05`: Vercel → Instant Rollback về bản cũ; không cần đụng DB. Bản cũ không biết tạm ứng, phí hủy, mức lương hiệu lực, chốt phiếu nhập ở bản mới (số hiển thị sẽ khác trong lúc rollback, dữ liệu vẫn còn).
- Sau khi chạy `05`: bản cũ lỗi ở lương ngày; chỉ rollback nếu thêm lại cột `paymentDate`.
