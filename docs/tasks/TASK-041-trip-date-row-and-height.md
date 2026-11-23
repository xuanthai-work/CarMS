# TASK-041: Gộp Dòng Ngày Đi/Về, Giảm Chiều Cao Modal Chuyến

## 1. Thông Tin Chung
- **Mã Task**: TASK-041
- **Ngày hoàn thành**: 2026-11-23
- **Phân hệ**: Schedule / UX
- **Trạng thái**: **Đã xong (QA AUDIT PASS)**
- **Dev**: Gemini

## 2. Bối Cảnh & Yêu Cầu
User chốt: dòng ngày gộp thành `Ngày đi [ngày] ☐ Về [ngày về]` (ô ngày về chỉ hiện khi tick); modal còn quá cao, có khoảng trống dưới ô Ghi chú.

## 3. Thay Đổi Theo File
- `components/schedule/TripForm.tsx`: dùng `Row2` cho dòng ngày (checkbox "Về" là nhãn thứ hai, `r_date` chỉ khi `hasReturn`); form/fieldset là cột flex, dòng Ghi chú `flex-1`, textarea `h-full min-h-[4.5rem] resize-none rows=3`.
- `components/common/Modal.tsx`: nhánh `fixedHeight` cao `min(36rem, 100dvh-2rem)`, thân là cột flex. Nhánh thường không đổi.

## 4. Kết Quả Kiểm Chứng
- Dev: `tsc --noEmit --noUnusedLocals`, `npm test` (133), `npm run build` đạt.
- QA (Playwright 1440×900, 19 kiểm tra đạt): một dòng ngày, khung cao đúng 576px, bỏ/tick "Về" không đổi khung; chuyến một chiều ghi chú cao 155px lấp chỗ trống; có lượt về ghi chú co còn 78px; footer đứng yên khi cuộn; lưu, xóa, banner lỗi giữ dữ liệu, 390px không tràn.
- Ghi nhận: chuyến có lượt về thân dư 1px để cuộn, không đáng kể.
