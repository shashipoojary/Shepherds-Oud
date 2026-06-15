# Shepherds Oud

Production-shaped MVP for an eldercare matching product.

The original target stack mentioned Next.js 14. npm currently reports security advisories against the Next 14 line, so this scaffold uses the current secure Next.js production line while keeping the same App Router architecture.

## Tech Stack

- Next.js 16 production line
- React
- Tailwind CSS
- TypeScript
- Prisma
- Supabase PostgreSQL and Storage
- Better Auth
- Brevo transactional email
- Zod

## App Areas

- `/` public landing page
- `/family/intake` family intake flow
- `/family/results` matched providers
- `/family/dashboard` family dashboard
- `/providers/[providerId]` provider detail page
- `/provider` provider dashboard
- `/admin` admin dashboard
- `/api/intakes` backend intake API route
- `/api/auth/[...all]` Better Auth route
- `/api/actions` admin/provider action logging route

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production service setup:

```bash
copy .env.example .env.local
npx prisma migrate dev --name init
npx prisma generate
```

See `REAL_SERVICE_SETUP.md` for database, auth, email, matching, and deployment steps.

## Editing Content

Demo content lives in `lib/content.ts`. Production persistence is designed around `prisma/schema.prisma`.
