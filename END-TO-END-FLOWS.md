# Shepherds Oud — End-to-End Website Flows

This document describes how the website and app work from first visit to placement and follow-up. It reflects the **current product** (human-guided care navigation). There is **no AI matching engine** in the codebase yet; Care Guides and admins create matches manually.

---

## 1. What the product is

Shepherds Oud is a **care-navigation platform** for the Netherlands. It helps:

| Audience | Goal |
| --- | --- |
| **Families** | Explain a care need, get a Care Guide, see matched providers, request visits/calls, track the journey |
| **Providers** | Register interest / join via invite, keep a facility profile, respond to matched family requests |
| **Admins / Care Guides** | Manage intakes, assign guides, create matches, coordinate visits/placement, run waitlist launch emails |
| **Public visitors** | Learn about the service, join a waitlist (prelaunch), or start intake (live mode) |

**Stack (high level):** Next.js App Router + Prisma + Neon PostgreSQL + Better Auth + Brevo email, hosted on Vercel.

---

## 2. Two operating modes: prelaunch vs live

Controlled by env (default = prelaunch):

```text
PRELAUNCH=true              # server (runtime on Vercel)
NEXT_PUBLIC_PRELAUNCH=true  # client nav (build-time)
```

| Mode | What visitors can do | Blocked / redirected |
| --- | --- | --- |
| **Prelaunch** (`true`) | Marketing pages + waitlist (`/register`, `/register/family`, `/register/facility`) | `/family/*` intake paths → waitlist; `/provider` dashboard → `/register/facility` |
| **Live** (`false`) | Full guided intake, family dashboard, matches, provider dashboard | Waitlist still available as secondary option |

Enforcement lives in `proxy.ts` + `lib/config/prelaunch.ts`.

---

## 3. Public / marketing site

| Path | Purpose |
| --- | --- |
| `/` | Landing page (hero, how it works, Care Guide story, CTAs) |
| `/how-it-works` | Explains the guided journey (live nav) |
| `/about` | Company / mission story |
| `/faq` | Frequently asked questions |
| `/contact` | Contact + family/provider CTAs |
| `/for-providers` | Provider value / pricing terms |
| `/internationals` | English-focused page for internationals |
| `/register` | Waitlist hub (family + facility) |
| `/register/family` | Family waitlist form |
| `/register/facility` | Facility waitlist form |
| `/register/success` | Waitlist confirmation |

### Legal / footer pages (NL + EN via locale cookie)

`/privacy` · `/terms` · `/cookies` · `/complaints` · `/data-deletion` · `/accessibility` · `/company`

### Language (i18n)

- Locales: **`nl`** (default) and **`en`**
- Cookie: `so_locale`
- Header language switcher sets cookie and refreshes the page
- UI copy: `lib/config/product-nl.ts` / `product-en.ts` (+ marketing + legal)

---

## 4. Authentication & roles

**Library:** Better Auth (`/api/auth/[...all]`)

| Role | How they sign in | Lands on |
| --- | --- | --- |
| **FAMILY** | Magic link email (not Google) | `/family/dashboard` |
| **PROVIDER** | Magic link, after invite / allowlist approval | `/provider` |
| **ADMIN** | **Google only** (email must be in `ADMIN_EMAILS`) | `/admin` |

**Role resolution** (`lib/auth/roles.ts`):

1. Email in `ADMIN_EMAILS` → `ADMIN`
2. Else email in `PROVIDER_EMAILS` or approved provider invite / linked provider → `PROVIDER`
3. Else → `FAMILY`

**Login pages:**

- `/login` — general entry (routes by role after sign-in)
- `/family/login` — family magic link
- `/provider/login` — provider magic link (+ invite token when invited)
- `/login/continue` — post-auth continuation
- Google OAuth for admins via `/login` / auth social flow

**Protection** (`proxy.ts`):

- `/admin/*` requires a session cookie
- `/provider` (except `/provider/login`) requires a session cookie

---

## 5. Family journey (end-to-end)

### A. Prelaunch path (waitlist only)

```text
Home / Contact / Register
  → /register/family
  → POST /api/waitlist (type FAMILY)
  → /register/success?type=family
  → Admin sees entry on waitlist
  → (Later) Admin can send bulk launch email
```

### B. Live path (guided intake → placement → follow-up)

```text
1. Start
   / or /how-it-works or /contact
     → /family/intake

2. Intake
   Multi-step form (needs, location, languages, urgency, decision-makers, …)
     → POST /api/intakes
     → Confirmation email (Brevo / outbox)
     → /family/success
     → Optional: sign in → /family/dashboard

3. Care Guide work (admin)
   Intake appears in /admin as NEW
     → Assign Care Guide (often ADVISOR_EMAIL)
     → Status moves through assessment / care plan
     → Admin creates provider matches (POST /api/matches)

4. Family sees matches
   /family/dashboard  (primary)
   /family/results    (results view)
   /providers/[id]    (provider detail)
     → Family can request visit or callback on a match
       (PATCH /api/matches/[id])

5. Provider responds
   Provider dashboard shows the request
     → Accept / decline

6. Placement & follow-up
   Admin advances case status toward PLACED
     → FOLLOW_UP_7 → FOLLOW_UP_30 → FOLLOW_UP_90
     → CLOSED when done
```

### Family case statuses (intake)

Order used by the journey timeline:

```text
NEW
→ CARE_GUIDE_ASSIGNED
→ ASSESSMENT
→ CARE_PLAN
→ MATCHED
→ VISIT_SCHEDULED
→ PROVIDER_RESPONSE
→ PLACEMENT_IN_PROGRESS
→ PLACED
→ FOLLOW_UP_7 → FOLLOW_UP_30 → FOLLOW_UP_90
→ CLOSED
```

### Match statuses (per provider ↔ intake)

```text
SUGGESTED
→ family: VISIT_REQUESTED or CALLBACK_REQUESTED
→ provider: ACCEPTED or DECLINED
→ admin: CONTACTED / PLACED / CLOSED (as allowed)
```

Family-visible match states include suggested, contacted, visit/callback requested, accepted, placed, declined (not typically `CLOSED` in the family UI list).

### Family pages

| Path | Purpose |
| --- | --- |
| `/family/intake` | Guided intake form |
| `/family/success` | Post-intake confirmation |
| `/family/dashboard` | Case status, matches, Care Guide contact |
| `/family/results` | Matched providers list |
| `/family/login` | Magic-link sign-in |
| `/providers/[providerId]` | Public-ish provider detail for a match |

### Family APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/intakes` | Create intake |
| `GET` / `PATCH` | `/api/intakes/[id]` | Read / update intake |
| `GET` | `/api/family/intakes` | List intakes for signed-in family |
| `GET` / `POST` | `/api/matches` | List / create matches |
| `PATCH` | `/api/matches/[id]` | Advance match (visit/callback, etc.) |

---

## 6. Provider journey (end-to-end)

### A. Prelaunch / interest

```text
/for-providers or /register
  → /register/facility
  → POST /api/waitlist (type FACILITY)
  → /register/success
  → Admin reviews waitlist
```

### B. Invited / live access

```text
1. Admin creates provider invite (or allowlists email)
     → POST /api/admin/provider-invites
     → Invite email with magic-link / token

2. Provider opens /provider/login
     → Access check: GET/POST /api/provider/login-access
     → Magic link emailed
     → Session → /provider

3. Complete facility profile
     → GET/PATCH /api/provider/me
     → Services, care levels, languages, funding, beds, etc.

4. Respond to matched families
     → See match requests on dashboard
     → Accept / decline (PATCH /api/matches/[id] as provider)

5. Ongoing
     → Keep availability accurate
     → Admin may place family with this provider
```

### Provider pages

| Path | Purpose |
| --- | --- |
| `/for-providers` | Marketing / terms |
| `/register/facility` | Waitlist registration |
| `/provider/login` | Magic-link login |
| `/provider` | Dashboard (profile + matches) |

**Note:** In prelaunch mode, `/provider` redirects to the facility waitlist.

---

## 7. Admin / Care Guide journey (end-to-end)

```text
1. Sign in with Google (email ∈ ADMIN_EMAILS)
     → /admin

2. Dashboard loads
     → GET /api/admin/dashboard
     → Intakes, providers, waitlist, matches, invites, …

3. Typical case handling
     Review new intake
     → Assign Care Guide / update status (PATCH /api/intakes/[id])
     → Write care plan / assessment notes
     → Match providers (POST /api/matches)
     → Coordinate visit / placement
     → Log actions (POST /api/actions)
     → Advance follow-ups (7 / 30 / 90) → close

4. Waitlist ops
     Review entries
     → PATCH /api/waitlist/[id]
     → Bulk launch email when going live
       (POST /api/admin/waitlist/bulk-launch-email)

5. Provider ops
     Invite providers
     → Manage provider profiles
       (PATCH /api/admin/providers/[id])

6. Optional staging tools
     Reset test data (only if ALLOW_ADMIN_DATA_RESET=true)
       → POST /api/admin/reset-data
```

### Admin page

| Path | Purpose |
| --- | --- |
| `/admin` | Single admin panel (cases, matches, waitlist, providers, announcements) |

---

## 8. High-level system flow (diagram)

```text
                    ┌─────────────────────┐
                    │   Public website    │
                    │  /  /faq  /about …  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Prelaunch?         Live family      Providers
              │                │                │
              ▼                ▼                ▼
        /register/*      /family/intake    /register/facility
        waitlist API     create intake     waitlist / invite
              │                │                │
              ▼                ▼                ▼
           Admin ◄──────── Care Guide ──────► /provider
           /admin          matching          respond to matches
                               │
                               ▼
                    Placement + 7/30/90 follow-up
                               │
                               ▼
                            CLOSED
```

---

## 9. Background jobs & email

| Path | Purpose |
| --- | --- |
| `GET/POST /api/cron/email-outbox` | Sends queued emails (Brevo); needs `Authorization: Bearer CRON_SECRET` |
| `GET/POST /api/cron/retention` | Purges old action logs per `ACTION_LOG_RETENTION_DAYS` |
| `GET /api/health` | Health check for monitoring |

Transactional email covers: waitlist confirmations, intake confirmations, magic links, provider invites, launch emails, etc. (via Brevo + outbox pattern).

---

## 10. Config that changes what users see

| Variable | Effect on flow |
| --- | --- |
| `PRELAUNCH` / `NEXT_PUBLIC_PRELAUNCH` | Waitlist-only vs full intake + dashboards |
| `ADMIN_EMAILS` | Who can open `/admin` via Google |
| `PROVIDER_EMAILS` | Hard allowlist for provider role |
| `ADVISOR_EMAIL` | Default Care Guide for new intakes |
| `NEXT_PUBLIC_CARE_GUIDE_PHONE` | Phone shown in header / contact |
| `NEXT_PUBLIC_KVK_NUMBER` | Company page KvK (or “registration pending”) |
| `ALLOW_ADMIN_DATA_RESET` | Enables dangerous admin wipe |
| `CRON_SECRET` | Protects cron endpoints |

---

## 11. What is *not* in the flow yet

- **No AI / LLM matching** — matches are created by admins/Care Guides
- No automated “recommend top 3 providers” engine
- Provider public directory browsing for anonymous users is not the primary product path; matching is case-driven

When marketing copy says “AI-powered,” treat that as **future positioning** unless/until an AI feature is built.

---

## 12. Quick “happy path” checklist (live mode)

1. Family completes `/family/intake` → intake `NEW`
2. Admin opens `/admin`, assigns Care Guide, moves to assessment/care plan
3. Admin matches 1+ providers → family sees them on `/family/dashboard`
4. Family requests visit/callback on a match
5. Provider accepts on `/provider`
6. Admin marks placement progress → `PLACED`
7. Follow-ups at 7 / 30 / 90 days → `CLOSED`

---

## Related files

| Area | Where to look |
| --- | --- |
| Prelaunch routing | `lib/config/prelaunch.ts`, `proxy.ts` |
| Auth & roles | `lib/auth/config.ts`, `lib/auth/roles.ts`, `lib/auth/routes.ts` |
| Intake statuses | `lib/domain/intake-workflow.ts` |
| Match transitions | `lib/domain/match-transitions.ts` |
| Brand / public env | `lib/config/brand.ts`, `.env.example` |
| Setup & stack | `README.md` |
