# CarMS

CarMS is a lightweight fleet-dispatch application for a chauffeured car-rental business, replacing an ad-hoc spreadsheet workflow with a purpose-built scheduling tool. It provides a monthly dispatch calendar, trip (booking) management, and vehicle & driver records behind internal authentication.

## Tech stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS
- Supabase (authentication)
- Prisma / PostgreSQL (planned persistence layer)

## Getting started

The application lives in [`web/`](web/):

```bash
cd web
npm install
cp .env.example .env     # add your Supabase credentials
npm run dev              # http://localhost:3000
```

See [`web/README.md`](web/README.md) for details.

> Prototype — data currently runs on a local JSON store; migration to PostgreSQL is planned.
