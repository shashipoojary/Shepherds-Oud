# Shepherds Oud — Client End-to-End Test Guide

**Purpose:** Step-by-step script to test all three workflows (Family, Care Guide/Admin, Provider) on staging or production.

**Companion doc:** [client-flow-overview.md](./client-flow-overview.md) — architecture, status rules, and glossary.

---

## Before you start (setup checklist)

| Requirement | What to check |
|-------------|----------------|
| **Production mode** | `PRELAUNCH=false` and `NEXT_PUBLIC_PRELAUNCH=false` (redeploy after change) |
| **Database** | Neon connected; Prisma migrations applied |
| **Admin access** | Your Google email is in `ADMIN_EMAILS` |
| **Care Guide list** | Sign in to `/admin` once with that Google account so you appear in “Assign Care Guide” dropdown |
| **Provider in database** | At least one `Provider` row exists (seed or manual) |
| **Provider login** | Provider contact email in `PROVIDER_EMAILS` **or** send a **provider invite** from Admin → Waitlist (facility) |
| **Email** | Brevo configured (`BREVO_API_KEY`, `BREVO_FROM_EMAIL`) for magic links and notifications |
| **Three test emails** | One for family, one for admin (Google), one for provider — use addresses you can read |

**Recommended:** Use a fresh database or run a demo data reset before a full walkthrough so counts and statuses are predictable.

---

## Roles at a glance

| Role | Sign-in | Main URL |
|------|---------|----------|
| **Family** | Email magic link or Google → `/family/login` | `/family/dashboard` |
| **Care Guide (Admin)** | Google → `/login` | `/admin` |
| **Provider** | Email magic link → `/provider/login` | `/provider` |

**Important:** Families must be signed in to submit intake and view dashboard. After logout, they sign in again with the **same email** used on the intake form to see their saved request.

---

## Test data suggestion

Use realistic but fake data. Example naming:

| Role | Test identity |
|------|----------------|
| Family | Maria Test — `maria.test@yourdomain.com` |
| Care Guide | Your admin Google account |
| Provider | Facility contact — `facility.test@yourdomain.com` |

---

# Scenario A — Happy path (full journey)

Run this once with three people (or three browsers/incognito profiles). Total time: ~30–45 minutes.

## Phase 1 — Family submits care request

| Step | Who | Action | Expected result |
|------|-----|--------|-----------------|
| A1 | Family | Open `/family/login` → sign in (email magic link or Google) | Signed in |
| A2 | Family | Go to `/family/intake` (or “Start intake” from nav) | Multi-step form loads |
| A3 | Family | Complete all 5 steps → **Submit** | Redirect to `/family/success` — confirmation + timeline at “Request received” |
| A4 | Family | Open **Dashboard** (nav profile or `/family/dashboard`) | Timeline, request summary visible |
| A5 | Family | Log out, sign in again, open `/family/intake` | Sidebar shows **“Go to your dashboard”** (existing request detected) |

**Emails (if Brevo live):** Family receives intake confirmation; advisor receives new-intake alert.

---

## Phase 2 — Care Guide sets up the case

| Step | Who | Action | Expected result |
|------|-----|--------|-----------------|
| B1 | Admin | Open `/login` → Google sign-in (admin email) | Lands on `/admin` |
| B2 | Admin | **Families** tab → open Maria’s row | Side panel opens; “Do this next” suggests assign Care Guide |
| B3 | Admin | **Section 2** — select yourself → **Assign Care Guide** | Only that button shows “Saving…”; family timeline → **Care Guide assigned** |
| B4 | Admin | **Section 3** — choose pathway (e.g. Home care), add assessment notes + **care plan summary** → **Publish care plan** | Only assessment button saves; family dashboard shows care plan block |
| B5 | Admin | **Section 4** — select provider, score (e.g. 85) → **Create match** | Toast success; provider appears on family **Results** |
| B6 | Admin | Optional: **Mark shortlist ready** | Family case status → **Providers matched**; Results page fully usable |
| B7 | Family | Refresh dashboard → open **Results** (`/family/results`) | One featured provider (MVP: “Your matched provider”); request visit/callback buttons active |

---

## Phase 3 — Family requests contact; provider responds

| Step | Who | Action | Expected result |
|------|-----|--------|-----------------|
| C1 | Family | On Results → **Request visit** (or callback) | Success message; match status → Visit/Callback requested |
| C2 | Admin | **Inquiries** tab | New row: family + provider; pulsing dot on **that row only** |
| C3 | Provider | `/provider/login` → magic link email → `/provider` | Dashboard loads; **New** inquiry tab shows request |
| C4 | Provider | Open inquiry → **Accept** | Status Accepted; family dashboard shows provider in “Provider response” area |
| C5 | Admin | **Inquiries** → open accepted row → **Mark coordinated** | Match → Contacted; “Do this next” guides follow-up |
| C6 | Admin | **Families** panel → **Section 5** — set visit date/time, type, notes → **Save visit & mark scheduled** | Family dashboard shows visit details; timeline → Visit scheduled |
| C7 | Family | Refresh dashboard | Visit block + timeline updated |

**Emails:** Provider received visit/callback request email at C1.

---

## Phase 4 — Placement and close

| Step | Who | Action | Expected result |
|------|-----|--------|-----------------|
| D1 | Admin | **Inquiries** → **Record placement** (or Families → Advance status) | Match → Placed; family sees placement messaging |
| D2 | Admin | **Families** → **Section 6** — advance through follow-ups or **Close case** | Timeline → Case closed; family can still view history |
| D3 | Family | Dashboard → **See history** (if past requests exist) | Slide panel with past requests + provider outcomes |

---

# Scenario B — Provider declines (recovery path)

Tests decline handling and mixed states.

| Step | Who | Action | Expected result |
|------|-----|--------|-----------------|
| E1 | Admin | Create match with **Provider A** (if not done) | Suggested match on family Results |
| E2 | Family | Request visit with Provider A | Visit requested |
| E3 | Provider A | **Decline** inquiry | Match → Declined |
| E4 | Family | Refresh dashboard | “Not available right now” card for Provider A; recovery banner if no other active provider; timeline **not** stuck on “Provider accepted” |
| E5 | Family | Click **View profile** on declined provider | No visit/callback buttons; message to choose another option |
| E6 | Admin | **Families** panel “Do this next” | **Wait for family request** after you create a new match — not “Offer alternative” forever |
| E7 | Admin | **Section 4** — create match with **Provider B** | New suggested match |
| E8 | Family | Request visit with Provider B; Provider B **Accepts** | Active provider section shows B; declined A stays in muted list; **no** big recovery banner |

**Inquiries tab:** Declined and accepted rows are **separate**; opening one clears unread dot on **that row only**.

---

# Scenario C — Provider onboarding (if no provider yet)

| Step | Who | Action | Expected result |
|------|-----|--------|-----------------|
| F1 | Public | `/register/facility` — submit waitlist (prelaunch) OR skip if providers exist | Waitlist entry in Admin |
| F2 | Admin | **Waitlist** tab → facility row → **Send provider invite** | Email with invite link |
| F3 | Provider | Open invite link → complete sign-in | Provider account linked to facility |
| F4 | Provider | `/provider` → complete **Facility profile** (beds, services, etc.) | Profile badge clears; inquiries unlocked |

---

# What to verify on each screen

## Family

| Screen | URL | Verify |
|--------|-----|--------|
| Login | `/family/login` | Magic link + Google work |
| Intake | `/family/intake` | 5 steps, validation, submit, dashboard shortcut if request exists |
| Success | `/family/success` | Reference, timeline step 1 |
| Dashboard | `/family/dashboard` | Timeline matches admin actions; care plan; provider updates; refresh works |
| Results | `/family/results` | Matched provider(s); visit/callback; single-match copy when only one |
| Provider profile | `/providers/[id]` | Actions match match status (declined = no request buttons) |
| History | Dashboard → **See history** | Slide panel, past cases only |

## Admin (`/admin`)

| Tab | Verify |
|-----|--------|
| **Families** | Row open → panel steps 2–6; independent save spinners; “Do this next” matches case state |
| **Providers** | Read-only facility details |
| **Inquiries** | Rows per match; per-row unread dots; coordinated / placement / close actions |
| **Waitlist** | Mark contacted; provider invite for facilities |

## Provider (`/provider`)

| Area | Verify |
|------|--------|
| **Inquiries** | Tabs: New / Ongoing / Closed; accept & decline; unread dots per row |
| **Facility profile** | Save sticky footer; incomplete profile blocks inquiries |

---

# Email checklist (live Brevo)

| Event | Recipient |
|-------|-----------|
| Family submits intake | Family + advisor |
| Shortlist ready (matched) | Family |
| Care arranged (placed) | Family |
| Family requests visit/callback | Provider |
| Provider / family magic link | Whoever signed in |

*Assessment text, care plan edits, and most status tweaks appear on the **dashboard only** — not email.*

---

# Common issues during testing

| Symptom | Likely cause |
|---------|----------------|
| `/family/intake` redirects to waitlist | `PRELAUNCH=true` — set both prelaunch flags to `false` and redeploy |
| Admin login “unauthorized” | Email not in `ADMIN_EMAILS` |
| No Care Guides in dropdown | Admin must sign in once so User row exists with role ADMIN |
| Provider magic link fails | Email not in `PROVIDER_EMAILS` and no active invite; or facility profile incomplete |
| Family dashboard empty after login | Signed in with different email than intake; or no intake linked to account |
| “Cannot change status…” toast | Case already moved forward — use next allowed action (see overview doc §9) |
| No providers on Results | Admin must publish care plan + create match (+ optional “Mark shortlist ready”) |
| Visit schedule button disabled | Wait until family requested visit or provider accepted |

---

# Quick URL reference

```
Public          /
Family login    /family/login
Family intake   /family/intake
Family dash     /family/dashboard
Family results  /family/results
Admin login     /login
Admin panel     /admin
Provider login  /provider/login
Provider dash   /provider
```

---

# Sign-off checklist (client)

Use this for a demo or UAT sign-off:

### Family workflow
- [ ] Sign in → submit intake → success page
- [ ] Dashboard shows live timeline updates
- [ ] Care plan visible after admin publishes
- [ ] Matched provider on Results; request visit works
- [ ] Decline path: clear messaging, no dead-end buttons on declined profile
- [ ] Return visit: login → dashboard without hunting through menus

### Admin workflow
- [ ] Assign guide, publish plan, create match (separate save feedback per section)
- [ ] Inquiries appear and coordinate through to placement/close
- [ ] Per-inquiry unread dots behave independently
- [ ] “Do this next” updates after decline + new match

### Provider workflow
- [ ] Magic link login
- [ ] Profile complete → receive inquiry
- [ ] Accept and decline both update family/admin views correctly

### Environment
- [ ] Production mode (not prelaunch-only)
- [ ] Emails received for key milestones
- [ ] All three roles tested on same family case

---

*Last updated from codebase: family login required, decline recovery, per-inquiry admin dots, single-match MVP copy.*
