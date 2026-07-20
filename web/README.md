# CarMS — Web

Internal fleet-dispatch application for a chauffeured car-rental business. Built with Next.js and Supabase. Data currently runs on a local JSON store, with a Prisma/PostgreSQL layer scaffolded for future migration.

## Features

- **Dispatch calendar** — monthly schedule with two views: per-vehicle (day × hour) and per-tour (timeline). Drag to pan; opens on the current day.
- **Trip management** — bookings with outbound/return legs, including different vehicles per leg, pricing, deposit and status.
- **Vehicles & drivers** — CRUD management with search.
- **Authentication** — Supabase-backed login protecting all internal pages.

## Getting started

```bash
npm install
cp .env.example .env     # add your Supabase credentials
npm run dev              # http://localhost:3000
```

On first run, `data/seed.json` is copied to `data/db.json` (the local runtime store, git-ignored).

## Environment

See `.env.example`.

- **Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Optional:** `NEXT_PUBLIC_SITE_URL` (password-reset links), `DATABASE_URL` (Prisma)

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase Auth · Prisma (scaffolded).

## Notes

- Data access goes through `lib/db.ts` (JSON store); the interface is designed to be swapped for PostgreSQL/Prisma later without touching callers.
- Do not run `npm run build` while `npm run dev` is active — they share the `.next` directory.
