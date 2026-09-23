# Shepherds Oud Care

Shepherds Oud Care is a production-ready MVP for a care navigation service. It helps people with limited mobility explain their care situation, receive matched care options, and stay guided through placement. Providers can manage availability and respond to requests, while admins can oversee cases, providers, waitlist entries, and follow-ups.

Production GitHub repository: https://github.com/dminoue15/shepherds-Oud-Care

The product is built as one Next.js application with separate experiences for the public site, family journey, provider dashboard, and admin panel.

**End-to-end user flows (family, provider, admin, prelaunch vs live):** see [`END-TO-END-FLOWS.md`](./END-TO-END-FLOWS.md).

## Product Overview

Shepherds Oud Care supports four main users:

- People seeking care when mobility is limited — assisted living, home care, rehabilitation, or placement guidance.
- Providers who need a clear way to manage profile details, availability, and care requests.
- Admins and care guides who manage intakes, cases, matches, follow-ups, and provider coordination.
- Prelaunch visitors who can join the family or facility waitlist before the full intake flow is opened.

The app is designed to be simple, calm, mobile-first, and usable by older family members. The interface avoids generic AI-style content and focuses on clear flows, large touch targets, readable layouts, and direct actions.

## Tech Stack

### Frontend

- Next.js App Router for the public website, family app, provider dashboard, admin panel, and API routes.
- React 18 for reusable UI and interactive client components.
- Tailwind CSS for styling, responsive layouts, and clean design consistency.
- TypeScript for safer product development.
- Lucide React for consistent icons.
- Custom UI components in `components/ui` for buttons, cards, badges, custom selects, panels, feedback states, and responsive dashboard elements.

### Backend

- Next.js Route Handlers for API endpoints.
- Prisma ORM for schema management, migrations, and typed database access.
- Neon PostgreSQL for the production database.
- Better Auth for authentication, Google OAuth, sessions, roles, and dashboard verification.
- Brevo for transactional email.
- Zod for request validation.

### Hosting And Deployment

- Vercel for hosting, deploy previews, production deploys, CDN, and environment variables.
- GitHub as the source repository connected to Vercel auto-deploy.

## Application Areas

- `/` - public website or prelaunch landing page.
- `/register` - waitlist entry point.
- `/register/family` - family waitlist form.
- `/register/facility` - facility/provider waitlist form.
- `/register/success` - waitlist confirmation.
- `/triage/[step]` - crisis triage questions.
- `/result` - triage path recommendation.
- `/signup` - claim anonymous triage to an account.
- `/patient` - patient consent / bewindvoerder / invite.
- `/dashboard` - family crisis checklist dashboard.
- `/tasks/[id]` - checklist task detail.
- `/directory` - Haaglanden care directory.
- `/providers/[providerId]` - provider details page (legacy matching).
- `/provider/login` - provider login page.
- `/provider` - provider dashboard.
- `/admin` - admin dashboard.
- `/login` - user login page.
- `/login/google` - Google login redirect route.
- `/login/continue` - login continuation page.
- `/privacy` - privacy page.
- `/terms` - terms page.

## API Routes

- `GET /api/health` - health check for monitoring.
- `GET /api/cron/db-ping` - Neon keep-alive ping (cron auth; use with an external 10‑minute scheduler on Vercel Hobby).
- `POST /api/actions` - log admin and provider actions.
- `GET /api/admin/dashboard` - admin dashboard data.
- `POST /api/admin/waitlist/bulk-launch-email` - send waitlist launch emails.
- `GET /api/provider/me` - provider dashboard data.
- `POST /api/waitlist` - create a family or facility waitlist entry.
- `PATCH /api/waitlist/[id]` - update waitlist status.
- `/api/auth/[...all]` - Better Auth route.
- `/api/v2/*` - crisis triage cases, directory, partner referrals, tasks, push.

## Crisis triage (primary family product)

Self-serve crisis triage is the main family flow:

- Start: `/triage/1` → `/result` → `/signup` → `/patient` → `/dashboard`
- Directory: `/directory`
- Seed demo directory: `npm run db:seed:haaglanden`
- Launch checklist: [`docs/CRISIS_V2_LAUNCH_CHECKLIST.md`](./docs/CRISIS_V2_LAUNCH_CHECKLIST.md)
- PWA: `public/manifest.webmanifest` + `public/sw.js`; optional `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
- Cron: `/api/cron/checklist-reminders` (daily) marks approaching/stale tasks for privacy-safe reminders
- Legacy Care Guide paths (`/family/intake`, `/family/dashboard`, `/v2/*`, `/hospital/*`) redirect to the new routes

Care Guide intake/match/hospital APIs and DB models have been removed. Crisis triage (`CareCase`, directory, partner referrals) is the family product.

## Core Data Model

The Prisma schema lives in `prisma/schema.prisma`.

Main models:

- `User` - family, provider, or admin account.
- `Session`, `Account`, `Verification` - Better Auth tables.
- `CareCase` / `TriageResponse` / `ChecklistTask` - crisis triage journey.
- `DirectoryProvider` / `PlacementReferral` - Haaglanden directory and partner fees.
- `Provider` - care provider profile, service areas, languages, capacity, prices, and availability.
- `ActionLog` - audit trail for admin and provider actions.
- `WaitlistEntry` - prelaunch family and facility registrations.

Main roles:

- `FAMILY`
- `PROVIDER`
- `ADMIN`

## End-To-End Flow

1. A family visits the site and either joins the prelaunch waitlist or starts crisis triage (`/triage/1`).
2. Triage answers are scored into an urgency path and checklist; optional signup claims the case.
3. The family works through tasks, browses the Haaglanden directory, and may contact facilities.
4. Partner referrals track success-fee status for directory contacts.
5. Providers manage facility profiles from the provider dashboard.
6. Admins review crisis cases, directory listings, referrals, waitlist, and announcements.
7. Brevo sends transactional emails (magic links, waitlist, announcements) via the Neon outbox.
8. Better Auth manages sign-in, sessions, Google OAuth, roles, and Better Auth Dash verification.

## Project Structure

```text
app/                  Next.js routes, pages, layouts, loading states, and API handlers
components/           UI, layout, family, provider, admin, auth, and shared components
lib/auth/             Better Auth client/server helpers, route config, and role utilities
lib/client/           Browser-side API helpers
lib/config/           Brand, env, SEO, legal, content, and prelaunch config
lib/core/             Database, API helpers, logging, rate limit, security headers
lib/data/             Seed/demo data helpers
lib/domain/           Care pathway, care guide, workflow, matching, and status logic
lib/email/            Brevo email client and transactional email templates
lib/providers/        Provider server actions and provider errors
lib/validation/       Zod schemas for API requests
prisma/               Prisma schema and migrations
public/brand/         Brand assets
scripts/              Database and load-test helper scripts
docs/                 Product flow documentation and diagrams
```

## Environment Variables

Copy `.env.example` to `.env.local` for local development.

```bash
cp .env.example .env.local
```

Required for a full production deployment:

```bash
NEXT_PUBLIC_APP_URL=

DATABASE_URL=
DIRECT_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
BETTER_AUTH_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=Shepherds Oud Care
ADVISOR_EMAIL=

ADMIN_EMAILS=
PROVIDER_EMAILS=

PRELAUNCH=true
NEXT_PUBLIC_PRELAUNCH=true
```

For local development, use:

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
BETTER_AUTH_URL="http://localhost:3000"
```

For Vercel production, use the deployed domain without a trailing slash:

```bash
NEXT_PUBLIC_APP_URL="https://shepherds-oud.vercel.app"
BETTER_AUTH_URL="https://shepherds-oud.vercel.app"
```

## Getting Service Credentials

### Neon

Create a Neon project, then get:

- `DATABASE_URL` from the pooled connection string.
- `DIRECT_URL` from the direct connection string.

Use the pooled URL for app runtime traffic and the direct URL for Prisma migrations.

Neon’s free tier scales the database down after a few minutes with no queries. Vercel **Hobby** cron jobs can only run **once per day** (more frequent schedules fail at deploy), so a 10‑minute Vercel cron is not available on the free plan.

To keep Neon warm between visits, use a free external scheduler (e.g. [cron-job.org](https://cron-job.org)) every **10 minutes**:

- URL: `GET https://<your-vercel-domain>/api/cron/db-ping`
- Header: `Authorization: Bearer <CRON_SECRET>`

That endpoint runs `SELECT 1` only — minimal cost and well within Hobby limits (~144 pings/day). Your existing daily Vercel crons (`retention`, `email-outbox`, `checklist-reminders`) stay on once‑per‑day schedules in `vercel.json`.

For faster email retries (especially after bulk announcements), also schedule an external job every **30 minutes**:

- URL: `GET https://<your-vercel-domain>/api/cron/email-outbox`
- Header: `Authorization: Bearer <CRON_SECRET>`

The outbox worker processes up to 25 pending emails per run. Bulk sends queue overflow recipients to the outbox automatically in production.

### Better Auth

Use Better Auth Dash with:

- Base URL: your app domain, for example `https://shepherds-oud.vercel.app`
- Base Path: `/api/auth`

Add the Dash API key to:

```bash
BETTER_AUTH_API_KEY=
```

Generate `BETTER_AUTH_SECRET` locally with:

```bash
openssl rand -base64 32
```

Google login requires a Google OAuth client:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Brevo

Create a Brevo account and generate a transactional email API key:

- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL` — verified sender, e.g. `dominique@shepherdsoud.com` (single From source for all emails via `lib/email/brevo.ts`)
- `BREVO_FROM_NAME` — display name, e.g. `Shepherds Oud Care`

Also authenticate the sending domain in Brevo (Senders → Domains: Brevo code + DKIM + DMARC). Sender-email verification alone is not enough: without domain authentication Brevo rewrites From to `@<accountId>.brevosend.com`, which triggers Gmail rate limits.

Outbound sends go through `sendBrevoEmail` with a **Neon email outbox** (free/open): each message is recorded and **sent immediately**; if Brevo fails, `/api/cron/email-outbox` retries (daily on Vercel Hobby — once per day is the Hobby cron limit). Set `CRON_SECRET` so the cron can authenticate (`Authorization: Bearer …`).

Set `ADVISOR_EMAIL` to the operations inbox for waitlist/ops alerts when configured (e.g. `dominique@shepherdsoud.com`).

## Local Development

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations locally or against Neon:

```bash
npx prisma migrate dev
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Deployment

1. Push the repository to GitHub.
2. Import the GitHub repo into Vercel.
3. Add all production environment variables in Vercel.
4. Create the Neon database.
5. Run Prisma migrations against Neon.
6. Configure Better Auth Dash with the production domain and `/api/auth`.
7. Add the Better Auth API key to Vercel.
8. Add Brevo email credentials to Vercel.
9. Redeploy the project.
10. Check `/api/health` after deployment.

The build command is:

```bash
npm run build
```

`package.json` runs `prisma generate` during `postinstall` and before `next build` so Prisma works correctly on Vercel.

## Prelaunch Mode

The app supports waitlist-only mode and full production mode.

Waitlist mode:

```bash
PRELAUNCH=true
NEXT_PUBLIC_PRELAUNCH=true
```

Full production mode:

```bash
PRELAUNCH=false
NEXT_PUBLIC_PRELAUNCH=false
```

Redeploy after changing `NEXT_PUBLIC_PRELAUNCH` because it is used by client-side code.

## Useful Commands

```bash
npm run dev
npm run build
npm run typecheck
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
```

## Production Notes

- Keep `BETTER_AUTH_SECRET`, `BETTER_AUTH_API_KEY`, `GOOGLE_CLIENT_SECRET`, and `BREVO_API_KEY` server-side only.
- Use `/api/health` for uptime monitoring.
- Use `ActionLog` for admin and provider audit history.
- Use `ADMIN_EMAILS` and `PROVIDER_EMAILS` to map signed-in Google accounts to the correct dashboard access.
- Keep `PRELAUNCH` and `NEXT_PUBLIC_PRELAUNCH` in sync.

## Current Status

The app is wired as a production MVP with:

- Public and prelaunch registration pages.
- Family intake, success, results, and dashboard flows.
- Provider detail and provider dashboard flows.
- Admin dashboard for families, providers, inquiries, waitlist, case actions, and follow-ups.
- Better Auth route and Dash verification plugin.
- Neon PostgreSQL through Prisma.
- Brevo transactional email helpers.
- Responsive mobile-first UI components.

Some live behavior depends on production environment variables and deployed service credentials. Without those credentials, parts of the app run in demo-safe mode so the interface can still be reviewed locally.
