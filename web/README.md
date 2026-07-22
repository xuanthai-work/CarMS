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

## Notes

- Data access goes through `lib/db.ts` (Prisma queries + row↔model mappers); server mutations live in `lib/actions.ts`.
- Prisma 7 connects via the `pg` driver adapter (`lib/prisma.ts`); use the Supabase transaction pooler for `DATABASE_URL` so it works on serverless.
- Realtime: `components/RealtimeRefresh.tsx` subscribes to Postgres changes and calls `router.refresh()`, so all open clients re-fetch through the server (Prisma) without a full reload. `npm run db:realtime` enables Row Level Security (SELECT for authenticated), which both closes the anon PostgREST hole and lets Realtime deliver events; writes stay server-only through Prisma.
- Deploying to Vercel: set the environment variables in the project settings and run `npm run db:push` + `npm run db:realtime` (once) against your Supabase database. `prisma generate` runs automatically on install.
- Do not run `npm run build` while `npm run dev` is active — they share the `.next` directory.
