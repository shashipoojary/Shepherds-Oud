# Connecting Shepherds Oud To Real Services

This app is ready to move from mock data to real services in small steps.

## 1. Database

Use Neon, Supabase, Railway, or any managed PostgreSQL provider.

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL`.
4. Run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

The first real endpoint is already wired:

- `POST /api/intakes`
- validates with `lib/validation/intake.ts`
- writes to the `Intake` table when `DATABASE_URL` exists
- falls back to demo mode when no database is configured

## 2. Replace Mock Reads

Current demo screens read from `lib/content.ts`.

Replace these with Prisma reads:

- family dashboard: `prisma.intake.findMany`
- results: `prisma.provider.findMany` plus match scoring
- provider dashboard: `prisma.provider.update` for availability
- admin dashboard: `prisma.intake.findMany`, `prisma.provider.findMany`, `prisma.match.findMany`

## 3. Authentication

Recommended options:

- Clerk for fastest production setup
- Supabase Auth if using Supabase Postgres
- Auth.js if you want full control inside Next.js

Roles already exist in Prisma:

- `FAMILY`
- `PROVIDER`
- `ADMIN`

Protect these route groups once auth is added:

- `/family/*`
- `/provider`
- `/admin`

## 4. Email Notifications

Use Resend for transactional email.

Add to `.env.local`:

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/shepherds_oud?sslmode=require"
AUTH_SECRET="replace-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
ADVISOR_EMAIL="care@shepherdsoud.nl"
FROM_EMAIL="Shepherds Oud <care@shepherdsoud.nl>"
```

Trigger email after intake creation in `app/api/intakes/route.ts`.

Recommended notifications:

- family confirmation
- care advisor alert
- provider inquiry alert

## 6. Buttons And Actions

Admin and provider buttons call:

- `POST /api/actions`

Without `DATABASE_URL`, the endpoint runs in demo mode and returns success. With `DATABASE_URL`, it stores actions in the `ActionLog` table.

Run this after adding or changing the database:

```bash
npx prisma migrate deploy
```

## 7. Deployment

Vercel is the simplest deployment target.

1. Push repo to GitHub.
2. Import project into Vercel.
3. Add environment variables.
4. Attach Neon/Supabase Postgres.
5. Run Prisma migration in deployment pipeline or manually before launch.

## 8. Production Matching Logic

Start with rule-based scoring:

- location distance
- care type overlap
- availability
- language overlap
- budget fit
- urgency support

Store scores in the `Match` table and display them in `/family/results` and `/admin`.
