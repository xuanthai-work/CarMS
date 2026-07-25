# CarMS — Web

Internal fleet-dispatch application for a chauffeured car-rental business. Built with Next.js and Supabase, persisting data to Supabase Postgres through Prisma.

## Features

- **Dispatch calendar** — monthly schedule with two views: per-vehicle (day × hour) and per-tour (timeline). Drag to pan; opens on the current day. Live-updating across clients (Supabase Realtime).
- **Trip management** — bookings with outbound/return legs, including different vehicles per leg, pricing, deposit, cost/profit and status.
- **Revenue** — monthly receivables, cost/profit KPIs and per-trip status (managers only).
- **Fuel costs** — per-vehicle fuel entries with payment tracking, feeding the revenue view.
- **Vehicles & staff** — vehicle CRUD; staff split into Drivers and Office staff tabs.
- **Authentication & roles** — Supabase-backed login; accounts link to an office-staff record by email. Managers (CEO/COO) see everything; regular staff are restricted (no Revenue; Staff shows Drivers only). Enforced at the app layer on nav, pages, and server actions.

## Getting started

```bash
npm install                # also runs `prisma generate`
cp .env.example .env       # add your Supabase credentials + database URLs
npm run db:push            # create the schema in Supabase Postgres
npm run db:seed            # load sample data from data/seed.json
npm run db:realtime        # enable RLS + policies + realtime (one-time)
npm run dev                # http://localhost:3000
```

## Environment

See `.env.example`.

- **Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`
- **Optional:** `NEXT_PUBLIC_SITE_URL` (password-reset links), `DIRECT_URL` (direct connection for migrations; falls back to `DATABASE_URL`)

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase Auth · Prisma 7 · Supabase Postgres.

## Project structure

Everything the app compiles lives under `src/`; the `@/*` path alias maps to `src/*`. Top level is by kind, and within each kind by domain (`vehicles`, `drivers`, `trips`/`schedule`, `fuel`, `salary`, `staff`).

| Folder | Holds |
| --- | --- |
| `src/app/` | Routes only — pages, layouts and route handlers. |
| `src/api/` | `"use server"` mutations, one file per domain. This is the boundary the client calls. |
| `src/services/` | Server-side reads: Prisma queries, row↔model mappers, and the auth/role guards. |
| `src/components/` | UI by domain, plus `common/` (Modal, pickers, inputs) and `layout/`. |
| `src/hooks/` | Reusable client hooks. |
| `src/states/` | Client-side global state (React context + localStorage). |
| `src/lib/` | Configured third-party clients: Prisma and Supabase. |
| `src/configs/` | App-level configuration (AI models, system prompt). |
| `src/utils/` | Pure helpers and domain logic — no I/O, unit-tested, tests colocated. |
| `src/types/` | Shared app models. |

Mutations and reads are separate folders because Next.js only allows a `"use server"` module to export async functions, so actions cannot share a file with mappers or constants. Pure domain logic stays out of `services/` so its unit tests never have to load Prisma.

## Notes

- Prisma 7 connects via the `pg` driver adapter (`src/lib/prisma.ts`); use the Supabase transaction pooler for `DATABASE_URL` so it works on serverless.
- Realtime: `src/components/layout/RealtimeRefresh.tsx` subscribes to Postgres changes and calls `router.refresh()`, so all open clients re-fetch through the server (Prisma) without a full reload. `npm run db:realtime` enables Row Level Security (SELECT for authenticated), which both closes the anon PostgREST hole and lets Realtime deliver events; writes stay server-only through Prisma.
- Deploying to Vercel: set the environment variables in the project settings and run `npm run db:push` + `npm run db:realtime` (once) against your Supabase database. `prisma generate` runs automatically on install.
- Do not run `npm run build` while `npm run dev` is active — they share the `.next` directory.
