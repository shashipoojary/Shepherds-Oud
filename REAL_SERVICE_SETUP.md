# Connecting Shepherds Oud To The Production Stack

The chosen stack is Vercel, Neon PostgreSQL, Better Auth, Brevo, and Tailwind CSS.

## 1. Database

Use Neon PostgreSQL.

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` and `DIRECT_URL`.
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

This repo uses Better Auth.

Set:

```bash
BETTER_AUTH_SECRET="replace-with-openssl-rand-base64-32"
BETTER_AUTH_URL="https://your-vercel-domain.vercel.app"
BETTER_AUTH_API_KEY="copy-from-better-auth-dash"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

The auth route is:

- `/api/auth/[...all]`

For Better Auth Dash, connect your app with:

- Base URL: `https://your-vercel-domain.vercel.app`
- Base Path: `/api/auth`

If Dash asks for ownership verification, copy the API key from Dash into `BETTER_AUTH_API_KEY`, then redeploy.

Roles exist in Prisma:

- `FAMILY`
- `PROVIDER`
- `ADMIN`

Protect these route groups once auth is added:

- `/family/*`
- `/provider`
- `/admin`

## 4. Email Notifications

Use Brevo for transactional email.

Add to `.env.local`:

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/shepherds_oud?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/shepherds_oud?sslmode=require"
BETTER_AUTH_SECRET="replace-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_API_KEY="copy-from-better-auth-dash"
BREVO_API_KEY="xkeysib_..."
ADVISOR_EMAIL="dominique@shepherdsoud.com"
BREVO_FROM_EMAIL="dominique@shepherdsoud.com"
BREVO_FROM_NAME="Shepherds Oud"
```

Emails are triggered after intake creation in `app/api/intakes/route.ts` and after admin/provider actions in `app/api/actions/route.ts`.

Recommended notifications:

- family confirmation
- care advisor alert
- provider inquiry alert

## 5. Buttons And Actions

Admin and provider buttons call:

- `POST /api/actions`

Without `DATABASE_URL`, the endpoint runs in demo mode and returns success. With `DATABASE_URL`, it stores actions in the `ActionLog` table.

Run this after adding or changing the database:

```bash
npx prisma migrate deploy
```

## 6. Deployment On Vercel

Vercel is the simplest deployment target.

1. Push repo to GitHub.
2. Import project into Vercel.
3. Add the environment variables from `.env.example`.
4. Attach Neon Postgres.
5. Run Prisma migration in deployment pipeline or manually before launch.

## 7. Production Matching Logic

Start with rule-based scoring:

- location distance
- care type overlap
- availability
- language overlap
- budget fit
- urgency support

Store scores in the `Match` table and display them in `/family/results` and `/admin`.
