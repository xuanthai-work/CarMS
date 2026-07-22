# CarMS Redesign Prompt — Master Brief

> Cách dùng: Stitch (và hầu hết công cụ sinh UI) sinh **từng màn một**. Mỗi lần dán
> **toàn bộ khối "MASTER BRIEF" dưới đây** + **một khối screen** trong file
> `redesign-prompt-screens.md`. Hai nét bắt buộc giữ để không rơi vào look admin
> generic: **số dạng bảng (tabular/mono)** và **dispatch board** ở màn Lịch.

---

````text
# MASTER BRIEF — paste this first, then reuse it above each screen prompt

## Product
"CarMS" — an internal operations dashboard for a Vietnamese chauffeured-car & tour-transport dispatch company. It replaces a shared Google Sheet. Daily users are dispatchers and managers who coordinate trips, vehicles, drivers, revenue, fuel costs, and staff. Desktop-first, data-dense back-office tool. All UI copy is in Vietnamese.

## Users / roles
- "Quản lý" (managers: CEO/COO) — see everything.
- "Nhân viên" (staff) — restricted: no Revenue screen; on the Staff screen they see only the Drivers tab.

## Design direction (follow exactly — do NOT use a generic Bootstrap-admin look)
Mood: control-room clarity — calm, precise, trustworthy, modern. Light theme. The product is schedules and numbers, so numbers are treated as a first-class visual element.

Palette (use these hex values):
- Canvas background: #F5F7FA
- Surface / cards: #FFFFFF
- Primary text (ink): #16233B  (deep slate-navy)
- Muted text: #64748B
- Hairline borders: #E6EAF1
- Primary action "Dispatch Blue": #2F5BEA  (buttons, active nav, links)
- Attention accent "Signal Amber": #F59E0B  ("now" marker, highlights)
- Status colors: pending/new = #F59E0B (amber), "customer notified" = #06B6D4 (cyan), "paid" = #10B981 (emerald), danger/overdue = #EF4444
- Ownership tint: own vehicles/drivers = blue family, partner/outsourced = violet #7C3AED

Typography:
- Headings & large KPI numbers: "Space Grotesk" (geometric, confident).
- Body & UI: "Inter".
- Numeric data — times, license plates, money, dates in tables and the schedule: a monospaced/tabular face ("IBM Plex Mono") or Inter with tabular-nums so columns of numbers align perfectly. This tabular-number treatment is the signature type move.

Layout shell (every screen shares it):
- Slim left sidebar, collapsible to an icon rail. Nav items (Vietnamese, with an icon each): "Tổng quan", "Lịch", "Doanh thu", "Tiền dầu", "Quản lý xe", "Nhân sự", "Lương". Active item uses Dispatch Blue.
- Sticky top bar: page title on the left; contextual controls in the center/right (e.g. a month selector, a primary "＋ Tạo chuyến" button); a profile chip on the far right showing the user's name + role badge.
- Content area max-width ~1680px, generous padding, rounded-2xl white cards with soft shadow (shadow-sm) and hairline borders, 4/8px spacing scale.

Signature element: the dispatch board (see the "Lịch" screen) — vehicles as sticky left-hand rows, days/time along the top, color-coded trip blocks, and a thin vertical amber "now" line. This is what makes the product unmistakably a fleet-dispatch tool.

Motion: restrained — subtle hover lift on cards, smooth month transitions, skeleton loaders. No decorative animation.

Accessibility: visible keyboard focus rings (Dispatch Blue), status never conveyed by color alone (pair with a label/dot), responsive down to tablet.
````
