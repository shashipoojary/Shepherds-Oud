# Shepherds Oud — Client UAT Testing Guide

**Who this is for:** Anyone testing the platform before go-live (Care Guide / admin, family tester, provider tester).

**Goal:** Walk through every important path step by step, know what each button does, and confirm the three dashboards stay in sync.

**Time needed:** About 45–60 minutes for the full happy path, plus 20 minutes for decline and close scenarios.

---

## 1. Before you start

### What you need

| Item | Why |
|------|-----|
| **Three email addresses you can open** | One for family, one for admin (Google), one for provider |
| **Admin Google account** | Must be listed in `ADMIN_EMAILS` on the server |
| **At least one provider in the system** | Admin creates matches from the provider list |
| **Production mode** | `PRELAUNCH=false` — otherwise family intake may redirect to waitlist |
| **Email service (Brevo)** | Magic links and notifications need `BREVO_API_KEY` configured |

### Three roles — where each person goes

| Role | How to sign in | Main screen |
|------|----------------|-------------|
| **Family** | Email magic link or Google → `/family/login` | `/family/dashboard` |
| **Care Guide (Admin)** | Google → `/login` | `/admin` |
| **Provider (facility)** | Email magic link → `/provider/login` | `/provider` |

**Tip:** Use three browsers or three incognito windows so you can stay signed in as all three at once.

### Suggested test names

| Role | Example |
|------|---------|
| Family | Maria Berg — `maria.test@yourdomain.com` |
| Care Guide | Your admin Google email |
| Provider | Nursing Home Test — `facility.test@yourdomain.com` |

---

## 2. Read this first — two different “close” buttons

This is the most common source of confusion. There are **two separate close actions**:

| Button | Where | What it closes | Family case | Provider view |
|--------|-------|----------------|-------------|---------------|
| **Close provider match** | Admin → **Inquiries** tab | One provider ↔ family match only | **Stays open** — family can still be matched elsewhere | Inquiry moves to **Closed** tab |
| **Close family case** | Admin → **Families** tab (bottom of side panel) | The **entire family journey** | Dashboard shows case as **archived** | No new matching for that family |

### When “Close provider match” appears (Inquiries only)

This button is **not** shown during active coordination. It only appears when:

- The provider **declined**, or
- The match was **suggested** but the family never used it (unused shortlist item)

It does **not** appear when:

- Family requested a visit or callback
- Provider accepted
- Visit/call is arranged
- Placement is recorded

**What to do after a provider declines:** Go to **Families** → Section 4 → create a new match (same or different provider). You do **not** need to close the inquiry first — closing only tidies the provider’s dashboard.

### When “Close family case” appears (Families only)

- At the bottom of the family side panel, when the case is ready to archive
- A **confirmation popup** appears before closing — you must confirm
- After closing: workflow steps 2–6 are **locked**; you only see a read-only **Closed case summary**

---

## 3. Admin dashboard — tabs explained

Open `/admin` after Google sign-in.

| Tab | What it is for |
|-----|----------------|
| **Families** | Main workflow — assign Care Guide, care plan, create matches, schedule visits, advance case, close family case |
| **Providers** | Read-only list of facility profiles |
| **Inquiries** | One row per **provider match** — follow-up when family requests visit/callback or provider responds |
| **Waitlist** | Pre-launch signups; send provider invites; custom announcements |

### Tab notification dots (orange count)

- A small number shows how many items need attention **on tabs you are not currently viewing**
- When you **open a tab**, its count hides while you are on it
- Opening a family row or inquiry row marks that item as seen (dot on the row clears)

---

## 4. Families tab — side panel steps (in order)

Open a family row to see the side panel.

| Step | Section | What you do | What the family sees |
|------|---------|-------------|----------------------|
| — | **Case stage / Do this next** | Guidance only — follow the highlighted next action | — |
| 2 | **Assign Care Guide** | Pick a guide → **Assign Care Guide** | Timeline: “Care Guide assigned” |
| 3 | **Assessment & care plan** | Pathway + notes → **Save assessment** / **Save care plan** / **Publish care plan** | Care plan block on dashboard after publish |
| 4 | **Create provider match** | Pick provider, score, notes → **Create match** | Provider on **Results** page |
| — | *(optional)* | **Mark shortlist ready** | Case status → Providers matched |
| 5 | **Schedule visit or callback** | Date, type, provider name, notes → **Save visit & mark scheduled** | Visit details on dashboard |
| 6 | **Advance case status** | Placement milestones (only after visit scheduling) | Timeline updates |
| — | **Close family case** | **Close family case** → confirm in popup | Entire case archived |

### Care plan buttons (Section 3)

| Button you see | Meaning |
|----------------|---------|
| **Save assessment** | Internal notes only — family does not see care plan yet |
| **Save care plan** | You edited the published plan — saves draft |
| **Publish care plan** | Family dashboard shows the care plan |
| **Care plan published** | Nothing to publish — button disabled |

### Step 6 lock rule

- Section 6 (advance placement) stays **locked** until a visit is scheduled (Section 5 completed)
- You cannot skip ahead to placement milestones without visit scheduling

### After family case is closed

- Panel shows **Case archived** instead of step counter
- **Do this next** banner is hidden
- Steps 2–6 are replaced by **Closed case summary** (read-only)
- **Case record** at the bottom still shows full history

---

## 5. Inquiries tab — actions explained

Each row = one **match** (one family + one provider).

### Row actions (icons on the right)

| When status is… | Action available | What it does |
|-----------------|------------------|--------------|
| Visit requested / Callback requested / Accepted | **Mark visit/call arranged** | Opens **confirm popup** — only use when date/time agreed with both sides |
| Accepted or Contacted | **Record chosen provider** | Family committed to this provider — match → Placed |
| Declined or Suggested only | **Close provider match** | Opens **confirm popup** — archives for provider only; family case unchanged |
| Always | **Open details** | Opens side panel with full flow |

### Inquiry side panel (right side steps)

| Step | Action |
|------|--------|
| 4 | Mark visit/call arranged (with confirm popup) |
| 5 | Record chosen provider (disabled until visit arranged or provider accepted path allows) |
| 6 | Close provider match (only for declined / unused suggested — with confirm popup) |

### Provider follow-up queue vs all matches

- Default view: **Provider follow-up queue** — only items needing action
- **Show all matches** — includes suggested and closed history

---

## 6. Provider dashboard

Sign in at `/provider/login` (magic link email).

| Area | What to check |
|------|----------------|
| **Tabs: New / Ongoing / Closed** | Inquiries move between tabs as status changes |
| **Accept / Decline** | Only on New items after family requested visit or callback |
| **Unread dot** | Orange dot on row when there is an update you have not opened |
| **Facility profile** | Must be complete before responding to inquiries; availability includes **Unknown / needs confirmation** |
| **Visit notes** | Providers see visit **date and type** — not internal coordination notes (those are family/admin only) |

### Provider invite rules (if testing onboarding)

| Rule | Expected behaviour |
|------|-------------------|
| Invite link required | Provider cannot sign in with magic link/Google until they open the invite link first |
| Invite expiry | Invite expires after **7 days** |
| Re-send limit | Admin can send up to **3** invite attempts per facility |
| After expiry | Admin must send a new invite from Waitlist tab |

---

## 7. Family journey — screens to check

| Screen | URL | What to verify |
|--------|-----|----------------|
| Login | `/family/login` | Magic link and Google work |
| Intake | `/family/intake` | 5 steps; includes **preferred distance** and **medical/nursing support**; red borders on validation errors; submit works |
| Success | `/family/success` | Confirmation + timeline step 1 |
| Dashboard | `/family/dashboard` | Timeline updates when admin acts; care plan; visit block |
| Results | `/family/results` | Matched providers; **price** and **estimated wait** (when provider entered waitlist text); **Save** favourites; request visit or callback |
| Provider profile | `/providers/[id]` | Declined provider: no request buttons; clear message; save to favourites |
| About / How it works / Contact | `/about`, `/how-it-works`, `/contact` | Public info pages linked from nav and footer |

### After provider declines

- Declined provider shown as “not available”
- If another match exists: family can request visit with another provider
- If no other match: recovery message that Care Guide is reviewing options
- Timeline does **not** incorrectly show “Provider accepted”

### Visit notes visibility

- **Family** sees visit/callback notes on dashboard
- **Provider** does not see those internal notes

---

# TEST SCENARIOS — follow in order

---

## Scenario A — Happy path (full journey)

**People:** Family + Admin + Provider  
**Time:** ~30–45 minutes

### A1 — Family submits request

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Family | `/family/login` → sign in | Signed in |
| 2 | Family | `/family/intake` → complete all 5 steps → Submit | Success page; “Request received” |
| 3 | Family | Open dashboard | Timeline and request summary |
| 4 | Family | Log out, sign in again, open intake | “Go to your dashboard” (existing request detected) |

### A2 — Admin sets up case

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Admin | `/login` → Google | Admin dashboard |
| 2 | Admin | **Families** → open family row | Side panel; “Do this next” says assign Care Guide |
| 3 | Admin | Section 2 → Assign Care Guide | Family timeline → Care Guide assigned |
| 4 | Admin | Section 3 → pathway + assessment + care plan → **Publish care plan** | Family dashboard shows care plan |
| 5 | Admin | Section 4 → Create match (provider + score) | Provider on family Results |
| 6 | Admin | Optional: Mark shortlist ready | Status → Providers matched |

### A3 — Family requests visit; provider accepts

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Family | Results → **Request visit** (or callback) | Success message |
| 2 | Admin | **Inquiries** tab | New row; orange dot on row until opened |
| 3 | Provider | Sign in → open inquiry → **Accept** | Status Accepted |
| 4 | Family | Refresh dashboard | Provider shown in active section |
| 5 | Admin | Inquiries → **Mark visit/call arranged** → confirm popup | Match → Contacted |
| 6 | Admin | Families → Section 5 → visit date, type, notes → Save | Family dashboard shows visit |
| 7 | Family | Refresh dashboard | Visit block + timeline updated |

**Check:** Close provider match button should **NOT** appear on this inquiry now.

### A4 — Placement and close family case

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Admin | Inquiries → **Record chosen provider** | Match → Placed |
| 2 | Admin | Families → Section 6 → advance milestones as needed | Timeline updates |
| 3 | Admin | **Close family case** → confirm popup | Case archived; steps locked; summary only |
| 4 | Family | Refresh dashboard | Case shows as closed / archived |

---

## Scenario B — Provider declines (recovery)

**Time:** ~20 minutes

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Admin | Create match with Provider A | Suggested on family Results |
| 2 | Family | Request visit with Provider A | Visit requested |
| 3 | Provider A | **Decline** | Match → Declined |
| 4 | Family | Refresh dashboard | Provider A “not available”; recovery message if no other match |
| 5 | Admin | Inquiries → declined row | **Close provider match** button **is** visible (optional — tidies provider view) |
| 6 | Admin | Families → Section 4 → create match with Provider B | New suggested match |
| 7 | Family | Request visit with Provider B | Visit requested |
| 8 | Provider B | **Accept** | Active provider = B; A stays declined/muted |

**Important:** Closing the inquiry in step 5 does **not** close the family case. Family case continues in Families tab.

---

## Scenario C — Re-match same provider after decline

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Admin | After decline, Families → Section 4 → same provider again | Match reopens as **Suggested** (not auto visit-requested) |
| 2 | Family | Must request visit again on Results | Normal flow restarts |

---

## Scenario D — Provider onboarding (new facility)

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Public | `/register/facility` → submit waitlist | Entry in Admin → Waitlist |
| 2 | Admin | Waitlist → **Send provider invite** | Email with invite link |
| 3 | Provider | Open invite link **first** → then sign in (magic link or Google) | Linked to facility |
| 4 | Provider | Complete facility profile | Profile complete badge |
| 5 | Provider | Try magic link **without** opening invite first | Clear error — must use invite |

---

## Scenario E — Custom announcements (Waitlist)

| Step | Who | Do this | You should see |
|------|-----|---------|----------------|
| 1 | Admin | Waitlist tab → announcements panel | Template with `{{contactName}}`, `{{facilityName}}` |
| 2 | Admin | Preview then send (with confirmation phrase) | Email preview counts; send succeeds |

---

# Quick reference — status meanings

## Family case status (Families tab)

| Status | Meaning |
|--------|---------|
| New | Intake received |
| Care Guide assigned | Named guide on case |
| Assessment / Care plan | Internal work / plan published |
| Providers matched | Shortlist ready |
| Visit scheduled | Visit or callback booked |
| Provider response | Provider accepted or declined |
| Placement in progress / Placed | Moving toward or completed care arrangement |
| Closed | Whole case archived |

## Inquiry (match) status (Inquiries tab)

| Status | Meaning |
|--------|---------|
| Suggested | On family shortlist; no request yet |
| Visit / Callback requested | Family asked to connect |
| Accepted | Provider said yes |
| Declined | Provider said no |
| Contacted | Visit/call arranged |
| Placed | Family chose this provider |
| Closed | Archived on provider side only |

---

# Emails to expect (if Brevo is live)

| Event | Who receives |
|-------|----------------|
| Family submits intake | Family + advisor |
| Shortlist ready | Family |
| Family requests visit/callback | Provider |
| Care arranged / placed | Family |
| Magic link sign-in | Whoever requested link |
| Provider invite | Facility contact |

*Most small status updates appear on dashboards only — not every change sends email.*

---

# Common issues during testing

| Problem | Likely cause |
|---------|----------------|
| Family intake redirects to waitlist | Prelaunch mode still on |
| Admin “unauthorized” | Email not in `ADMIN_EMAILS` |
| No Care Guides in dropdown | Admin must sign in once so account exists |
| Provider cannot sign in | No invite accepted; or email not allowed; or profile incomplete |
| Family dashboard empty | Signed in with different email than intake |
| “Cannot change status” error | Wrong action for current stage — use “Do this next” |
| Close button missing on inquiry | Normal — only shows for declined/unused suggested |
| Close inquiry did not close family case | **Expected** — use Close family case in Families tab |

---

# UAT sign-off checklist

Copy this for your client sign-off meeting.

### Family
- [ ] Sign in → submit intake → success page
- [ ] Dashboard timeline updates when admin acts
- [ ] Care plan visible after publish
- [ ] Request visit/callback works
- [ ] Decline path: clear messaging, no broken buttons
- [ ] Visit notes visible on family dashboard

### Admin — Families tab
- [ ] Assign Care Guide, publish care plan, create match (separate save per section)
- [ ] Visit scheduling works; step 6 locked until visit scheduled
- [ ] Close family case shows confirm popup and locks steps

### Admin — Inquiries tab
- [ ] Inquiry appears when family requests visit
- [ ] Mark visit arranged shows confirm popup
- [ ] Close provider match only on declined/suggested — with confirm popup
- [ ] Close provider match does **not** close family case

### Provider
- [ ] Invite link required before first sign-in
- [ ] Accept and decline update family/admin views
- [ ] Closed inquiries appear in Closed tab
- [ ] Does not see internal visit coordination notes

### All three roles
- [ ] Same family case tested end-to-end on staging/production
- [ ] Key emails received

---

# URL quick reference

```
Family login      /family/login
Family intake     /family/intake
Family dashboard  /family/dashboard
Family results    /family/results
Admin login       /login
Admin dashboard   /admin
Provider login    /provider/login
Provider dashboard /provider
```

---

*Document version: July 2026 — includes close provider match vs close family case, confirm dialogs, step locks, provider invite rules, and decline/rematch flow.*
