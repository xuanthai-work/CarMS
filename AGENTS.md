# Repository Guidelines

## Project Structure & Module Organization

The application lives in `web/` and is a Next.js App Router project. Pages and route handlers are under `web/src/app/`; reusable UI is in `web/src/components/`, domain utilities in `web/src/utils/`, shared types in `web/src/types/`, and app state/configuration in `web/src/states/` and `web/src/configs/`. Prisma schema, migrations/scripts, and seed data are in `web/prisma/`; static assets are in `web/public/`; project notes and supporting material are in `web/docs/`.

## Build, Test, and Development Commands

Run commands from `web/`:

- `npm run dev` — start the local Next.js development server.
- `npm run build` — create and validate the production build.
- `npm test` — run the Vitest suite once.
- `npx tsc --noEmit` — type-check without emitting files.
- `npm run db:setup` — push the Prisma schema, configure realtime, and seed data; use only when database setup is intended.

## Coding Style & Naming Conventions

Use TypeScript/TSX with two-space indentation, semicolons, and double-quoted imports consistent with the existing source. Components and pages use PascalCase where they are named files; utilities and tests use lower-case names (for example, `revenue.ts` and `revenue.test.ts`). Keep shared logic in `src/utils` or `src/components` rather than duplicating it in route pages. Preserve responsive behavior and existing Tailwind conventions when changing UI.

## Testing Guidelines

Tests use Vitest and are colocated with the code as `*.test.ts` (currently under `web/src/`). Add regression tests for changed business rules, especially date, payment, and revenue calculations. Run the focused test first, then `npm test`, `npx tsc --noEmit`, and `npm run build` for changes affecting application behavior.

## Commit & Pull Request Guidelines

Commit history uses short, imperative, lower-case summaries, often with a category such as `fix:` (for example, `fix: ghi nhan doanh thu theo ngay hoan tat`). Keep each commit focused. Pull requests should explain the behavior change, list validation commands, mention any Prisma/schema or environment changes, and include screenshots for UI changes. Never commit secrets from `.env`; update `.env.example` when configuration keys change.

## Architecture decisions

- Logic tính tiền (doanh thu, lợi nhuận, lương) nằm ở `web/src/utils/revenue.ts` và `web/src/utils/salary.ts`; hệ thống đang vận hành thực tế với tiền cọc, doanh thu chuyến, cầu đường, đối tác, tiền dầu và lương, nên mọi thay đổi không được làm lệch logic này và phải có test hồi quy.
- Mọi tool của trợ lý AI tương tác DB mặc định là READ-ONLY (chỉ dùng hàm đọc của Prisma), trừ khi yêu cầu nghiệp vụ ghi rõ cho phép ghi.
- Ngày giờ dùng múi giờ Việt Nam (`Asia/Ho_Chi_Minh`) qua helper `todayStr()` tại `web/src/utils/format.ts`, để tránh lệch ngày gần nửa đêm.
- Mọi lệnh cài đặt, typecheck, test và build chạy từ thư mục `web/`.
- Dự án chưa cấu hình ESLint (`npm run lint` gọi `next lint` sẽ hỏi cài đặt), nên không có gate lint.
- Phân quyền đang mở tạm (2026-11-25): `isManager()` trả true cho mọi chức vụ, chỉ CEO vẫn chỉ xem; khi làm phân quyền thật phải đổi lại `isManager` ở `web/src/utils/office.ts` (xem comment tại hàm).
