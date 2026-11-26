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
- Lỗi lương F9 đã sửa (TASK-031); ngày vào làm và mức lương có hiệu lực đã xử lý (TASK-067..070, lên production 26/11).
- **Dữ liệu production (phát hiện 26/11, có từ trước):** 14 chuyến trống cả ngày đi lẫn ngày về, không vào tháng nào (2 đã thanh toán 3.600.000; 3 chờ xử lý có giá 11.800.000).
- **Mất tiền đối tác khi sửa chuyến:** 14 chuyến T7/2026 có `partnerCost` (tổng 10.700.000) nhưng không gắn xe đối tác; form ẩn ô tiền nên lưu lại sẽ xóa số này. Cần task sửa; trước đó không lưu các chuyến này.
- 22 chuyến "đã thanh toán" chưa có giá (nhập liệu).
- Dữ liệu: chuyến cọc lớn hơn giá bị ẩn phần dư (xử lý ở giai đoạn 3).
- Đường dẫn `/cai-dat` trả 404 (thư mục rỗng `web/src/app/(main)/cai-dat/`).

## 5. Đã xong (2026-11-23 đến 2026-11-25)

TASK-019 đến TASK-031 (tài chính AI, công nợ theo ngày về, ngày nghỉ việc, chặn đăng nhập, clean code, tắt AI, bộ script SQL production, màn Doanh thu tính lương mọi tháng). Giai đoạn 1, 2, 6 xong (TASK-032..052); TASK-053 bỏ ngày trả của phiếu công ngày (đã có script production `05`). Chi tiết ở `docs/README.md` và `docs/tasks/`.

## 6. Checklist deploy production (soạn và thực hiện xong 2026-11-26)

Trạng thái: **đã deploy `15f4bd6` ngày 26/11**; còn lại hai mục chưa kiểm ở phần D (Vercel Logs, iPhone). Trước deploy `origin/main` = `9f47edb`. Các script SQL do User tự chạy trên Supabase SQL Editor.

> **Thứ tự dưới đây thay cho `web/supabase/scripts/README.md` và ghi chú đầu các file 06–10.** Chỗ đó ghi "chạy sau khi deploy" là SAI: code mới đọc các cột/bảng này, thiếu thì trang lỗi. Code cũ bỏ qua cột và bảng thừa, nên chạy trước là an toàn. Chỉ `05` phải chạy sau.

### A. Trước khi đụng database

- [x] Bản đang chạy (để rollback): commit `9f47edb`, deployment `car-kue3p4fdd-xuanthai-works-projects.vercel.app`, tạo 02/11, domain `car-ms.vercel.app`.
- [x] Biến môi trường và Build Command: `web/.env.example` và `package.json` build không đổi so với bản đang chạy, không cần thêm biến.
- [x] Phân quyền (User đồng ý 2026-11-26): lên production với quyền mở tạm, mọi chức vụ xem được doanh thu và lương văn phòng, chỉ CEO là chỉ xem.
- [x] Số Doanh thu T11/2026 trên bản cũ (chụp 26/11): doanh thu 272.674.000; đã thanh toán 243.474.000; còn phải thu 29.200.000; tổng chi phí 74.205.131; lợi nhuận 198.468.869; 65 chuyến (23 chưa có giá). User: các tháng khác không cần.
- [x] `01-audit-readonly.sql` (BA chạy 26/11 qua MCP chỉ đọc): đủ 9 bảng; chỉ thiếu đúng các cột/bảng mà `02`, `06`–`10` thêm; cả 9 bảng đã bật RLS; anon không có quyền. Dữ liệu: 309 chuyến, trong đó 14 chuyến trống cả ngày đi lẫn ngày về (không tính vào tháng nào; 2 đã thanh toán 3.600.000, 3 chờ xử lý có giá 11.800.000); 14 chuyến T7 có tiền đối tác 10.700.000 nhưng không gắn xe đối tác; 22 chuyến đã thanh toán chưa có giá; 1 công nợ lệch ngày (cùng tháng); trùng nội dung chỉ là 3 chuyến rỗng.
- [x] Sao lưu DB: **bỏ qua** (User quyết 26/11; gói Free không có backup tự động). Hệ quả: không khôi phục được dữ liệu nếu hỏng. Không chạy `04`. Công nợ sẽ bị `03` đổi: `pd-mwock6mq4k6` ngày cũ 2026-11-21. Có export CSV 26/11 13:50 (`Trip` 309, `SalaryMonth` 9, `PartnerDebt` 15 dòng) trong thư mục Downloads của User.
- [x] Policy realtime (26/11): `Vehicle`, `Driver`, `Trip`, `FuelEntry` đều có `authenticated_read` và nằm trong publication.

```sql
SELECT c.relname AS bang, c.relrowsecurity AS rls, count(p.policyname) AS so_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public' AND c.relname IN ('Vehicle','Driver','Trip','FuelEntry')
GROUP BY 1,2 ORDER BY 1;
```

Đối chiếu trước deploy (26/11): tính Doanh thu T11 theo công thức bản mới bằng SQL trên dữ liệu thật ra đúng 272.674.000 / chi phí 74.205.131 / lợi nhuận 198.468.869, khớp bản cũ. Tháng khác đổi do bản mới tính lương mọi tháng và theo ngày vào làm: T2–T5 chi phí lương giảm 11.000.000, T6 giảm 9.080.000, T12 tăng 23.000.000. Rà lương (mục C): không phiếu nào đổi số; sẽ chốt 8 phiếu lái xe đã trả (96.000.000).

### B. SQL thêm cột/bảng (chạy TRƯỚC khi push, nên làm liền một buổi, lúc ít người dùng)

- [x] `02-sync-schema.sql` khối 01, rồi khối 02 (2 dòng) và khối 03 (0 dòng).
- [x] `06-add-trip-cancelfee.sql`
- [x] `07-add-salary-advance.sql`
- [x] `08-add-salary-rate.sql`
- [x] `09-add-driver-startdate.sql`
- [x] `10-add-salary-lock.sql`
- [x] Mở app (bản cũ) kiểm vẫn chạy bình thường.

BA kiểm qua MCP 26/11 sau khi User chạy: đủ cột và bảng mới, RLS bật, anon không có quyền, số dòng không đổi (309 chuyến, 9 phiếu lương, 15 công nợ, 43 phiếu công ngày).

### C. Lương tháng cũ (chạy sau `10`, trước khi push)

Code mới tính theo 25 công, nên tháng chứa ngày vào làm của nhân viên văn phòng sẽ ra số khác; tháng trước ngày vào làm thì dòng của người đó biến mất.

- [x] Xem ai có ngày vào/nghỉ làm, sửa ngay trong app nếu ngày nhập sai:

```sql
SELECT name, "startDate", "endDate" FROM "OfficeStaff"
WHERE "startDate" <> '' OR "endDate" <> '' ORDER BY "startDate";
```

- [x] Xem phiếu lương bị ảnh hưởng (rỗng là ổn):

```sql
SELECT o.name, o."startDate", o."endDate", sm."monthKey", sm."baseSalary", sm.paid
FROM "SalaryMonth" sm
JOIN "OfficeStaff" o ON o.id = sm."personId" AND sm."personType" = 'office'
WHERE sm."monthKey" IN (left(o."startDate",7), left(o."endDate",7))
   OR sm."monthKey" < left(o."startDate",7)
ORDER BY 1, 4;
```

- [x] (**Chạy**, User chốt 2026-11-26) Giữ nguyên số của mọi phiếu **đã trả** bằng cách chốt theo công thức cũ (cơ bản + cộng − trừ). Xem trước, rồi cập nhật:

```sql
SELECT "monthKey", count(*) AS so_phieu, sum("baseSalary" + additions - deductions) AS tien_da_tra
FROM "SalaryMonth" WHERE paid AND NOT locked GROUP BY 1 ORDER BY 1;

UPDATE "SalaryMonth"
SET locked = true, "lockedAt" = now(), "workDays" = 25, earned = "baseSalary", advances = 0
WHERE paid AND NOT locked;
```

  Không dùng nút "Chốt phiếu" trong app cho các tháng đã trả: nút đó tính lại theo công thức mới. "Mở chốt" các phiếu này cũng làm số tính lại. Chốt không giữ được dòng của người bị ẩn vì ngày vào làm nằm sau tháng đó.

User chạy `UPDATE` 26/11; BA kiểm qua MCP: 8 phiếu lái xe đã trả đã chốt (25 công, 96.000.000, số không đổi); 1 phiếu văn phòng chưa trả giữ tính động. Không chạy câu hoàn tác.

### D. Deploy

- [x] `git push origin main`, chờ Vercel báo Ready.
- [x] Đăng nhập; mở Tổng quan, Lịch (mở một chuyến), Xe, Nhân sự, Lương, Doanh thu, Tiền dầu, Chi phí khác, Công nợ, trợ lý AI (nếu bật).
- [x] (Không bắt buộc, theo User) So Doanh thu T11 với số ở mục A.
- [x] Mở một chuyến ở hai máy, sửa một máy, máy kia tự cập nhật (realtime).
- [ ] Xem Vercel Logs: không có lỗi `P2022` (thiếu cột) hay `P2021` (thiếu bảng).
- [ ] Thử trên iPhone: Lương, Lịch, Nhân sự.
- Cẩn thận: "Chốt tất cả" tạo phiếu cho mọi người của tháng, kể cả lái xe chưa có lương.

Deploy 26/11 14:00: push `15f4bd6`, Vercel success. User kiểm đăng nhập/các trang, Doanh thu T11, Lương T9 đã chốt, realtime: ổn. BA kiểm qua MCP: 309 chuyến, doanh thu T11 272.674.000, 8 phiếu chốt, 14 chuyến T7 có tiền đối tác còn nguyên. Chưa kiểm: Vercel Logs, iPhone (không được báo lại).

### E. Sau deploy

- [x] `03` (26/11): User chạy câu `UPDATE` cho đúng 1 dòng lệch (`pd-mwock6mq4k6`, 21/11 → 22/11). BA kiểm: không còn dòng lệch.
- [x] `04`: **không chạy** (bản trùng chỉ là 3 chuyến rỗng).
- [x] `05` (User chạy ngay 26/11). BA kiểm: cột đã bỏ, 43 phiếu công ngày còn nguyên (27.050.000). Trước khi Instant Rollback về `9f47edb` phải chạy `ALTER TABLE "PartnerPayout" ADD COLUMN IF NOT EXISTS "paymentDate" TEXT;`

### Nếu hỏng

- Trước khi chạy `05`: Vercel → Instant Rollback về bản cũ; không cần đụng DB. Bản cũ không biết tạm ứng, phí hủy, mức lương hiệu lực, chốt phiếu nhập ở bản mới (số hiển thị sẽ khác trong lúc rollback, dữ liệu vẫn còn).
- Sau khi chạy `05`: bản cũ lỗi ở lương ngày; chỉ rollback nếu thêm lại cột `paymentDate`.

## 7. Lần deploy tiếp theo (TASK-073, TASK-074)

- [ ] SQL Editor: `web/supabase/scripts/11-add-soft-delete.sql` (chạy TRƯỚC khi push).
- [ ] `git push origin main`, chờ Vercel Ready.
- [ ] Kiểm: Xe, Nhân sự, Lịch (mở một chuyến xe đối tác), Lương. Không thử xóa bằng dữ liệu thật.
- Trước khi bản mới lên: không xóa xe hay người trên production (bản đang chạy xóa thật).

