# Shepherds Oud Production Stack

## Frontend

- Next.js App Router for public site, family app, provider dashboard, and admin panel.
- React Server Components by default for fast first loads.
- Client components only where interaction is needed, such as the intake stepper.
- Tailwind CSS for maintainable utility styling.

## Backend

- Next.js Route Handlers for first production API surface.
- PostgreSQL as the production database.
- Prisma ORM for schema, migrations, and typed database access.
- Better Auth for family, provider, and admin roles.
- Zod for API validation.

## Recommended Services

- Vercel for app hosting.
- Neon Postgres for managed database.
- Brevo for transactional email.
- Sentry for production error monitoring.

## Domain Model

- `User`: family, provider, or admin account.
- `Intake`: family care request.
- `Provider`: care provider profile and availability.
- `Match`: score and workflow status between an intake and provider.

## Current Implementation

The app is scaffolded with production routes and mock data. Replace reads from `lib/content.ts` with Prisma queries as soon as the database is connected.

The original requested stack mentioned Next.js 14. npm audit currently reports advisories against the Next 14 line, so the implementation uses the secure current Next.js production line for production readiness.
