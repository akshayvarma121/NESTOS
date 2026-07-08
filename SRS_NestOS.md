# Software Requirements Specification
## Project: NestOS — Unified Academic, Career & Dev-Brand Command Center
**Version:** 1.0 (Full Build — No Deferred Features)
**Author:** Akshay Varma (Yaya)
**Date:** July 2026

---

## 1. Purpose & Scope

A single-tenant (you) personal productivity platform unifying four domains currently managed ad-hoc: academic/DSA/dev syllabus progress, placement/opportunity tracking, developer personal-brand content pipeline, and partner accountability — delivered as an installable PWA with push notifications.

**Out of scope:** multi-tenant support, billing, public signup. This is a private tool for one primary user (you) plus one secondary read/nudge participant (partner).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite, Tailwind CSS |
| Backend | Node/Express on Render (reuse Darzi pattern) |
| Database | Supabase Postgres — new schema `pos_*` prefix, same shared instance as Darzi per your convention |
| Auth | Supabase Auth, single user (you); partner uses tokenized magic link, no login |
| Hosting | Vercel (frontend), Render (API) |
| Push | Web Push API (VAPID) + service worker |
| WhatsApp | Meta Graph API direct (reuse existing Darzi WhatsApp number/integration) |
| Drag & Drop | dnd-kit |
| PWA | vite-plugin-pwa, Workbox |

---

## 3. Data Model

### 3.1 `pos_macro_goals`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| title | text | e.g. "Operating Systems Syllabus" |
| category | enum | academic / dsa / dev / other |
| total_units | int | e.g. 50 (problems), 12 (chapters) |
| unit_label | text | "problems", "chapters", "modules" |
| deadline | date | |
| created_at | timestamptz | |
| status | enum | active / completed / abandoned |

### 3.2 `pos_micro_tasks`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| macro_id | uuid FK | |
| unit_number | int | sequence within macro goal |
| title | text | auto-generated or manual, e.g. "OS Ch.3: Deadlocks" |
| scheduled_date | date | set by scheduler, mutable via manual canvas |
| status | enum | pending / done / skipped |
| completed_at | timestamptz | nullable |

### 3.3 `pos_daily_closeouts`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| date | date | one row per day |
| tasks_planned | int | |
| tasks_done | int | |
| tasks_rolled_over | int | |
| closed_at | timestamptz | when user tapped "close day" |

### 3.4 `pos_opportunities`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company | text | |
| role | text | |
| source_link | text | JD/registration URL |
| notes | text | eligibility criteria, CGPA cutoff, referral info |
| deadline | timestamptz | nullable (some drives have no deadline) |
| stage | enum | to_apply / applied / oa / interview / offer / rejected |
| stage_updated_at | timestamptz | |
| created_at | timestamptz | |

### 3.5 `pos_content_capture`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| raw_text | text | dumped thought |
| tag | enum | dsa_win / dev_milestone / random |
| linked_macro_id | uuid FK | nullable, set if triggered by a milestone event |
| posted | boolean | default false |
| created_at | timestamptz | |

### 3.6 `pos_partner_link`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| token | text unique | magic-link identifier, no expiry unless regenerated |
| partner_name | text | |
| partner_whatsapp_number | text | for nudge delivery |
| created_at | timestamptz | |

### 3.7 `pos_nudges`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| message | text | preset or custom |
| sent_at | timestamptz | |
| delivery_status | enum | sent / failed |

### 3.8 `pos_push_subscriptions`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| endpoint | text | |
| keys_p256dh | text | |
| keys_auth | text | |
| created_at | timestamptz | |

### 3.9 `pos_vault_entries`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| label | text | e.g. "College ERP", "GitHub", "Client Supabase" |
| category | enum | college / dev / personal / client / other |
| encrypted_value | text | AES-256-GCM ciphertext, base64 |
| iv | text | per-entry initialization vector, base64 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 3.10 `pos_vault_security`
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | single row, one user |
| pin_salt | text | random salt used in PBKDF2 |
| pin_verify_hash | text | hash of PIN+salt, used only to check PIN correctness — never used to derive the encryption key directly |
| failed_attempts | int | default 0 |
| locked_until | timestamptz | nullable, set after repeated failures |

---

## 4. Functional Requirements

### FR-1: Macro-Goal Vault
- FR-1.1: User can create a macro goal with title, category, total_units, unit_label, deadline.
- FR-1.2: User can edit or archive (status=abandoned) a macro goal at any time; abandoning stops it from being included in scheduling math but preserves history.
- FR-1.3: Macro goal list view shows a progress bar (`completed_units / total_units`) per goal, grouped by category.

### FR-2: Micro-Task Slicer
- FR-2.1: On macro goal creation, system auto-generates `total_units` micro_task rows numbered 1..N with placeholder titles ("Unit 1", "Unit 2"...) which the user can rename inline.
- FR-2.2: User can manually add/remove/reorder micro-tasks post-creation (e.g. split "Unit 5" into "5a"/"5b").

### FR-3: Auto-Pilot Scheduler
- FR-3.1: On every app load (not cron-based), system recomputes distribution for all active macro goals:
  ```
  remaining_days = max(1, deadline - today)
  remaining_tasks = count(pending + not scheduled_before_today)
  tasks_per_day = ceil(remaining_tasks / remaining_days)
  ```
- FR-3.2: Unscheduled pending tasks are assigned to upcoming dates starting today, filling `tasks_per_day` slots per day per macro goal, distributed round-robin across all active macro goals for a given day so no single day is monopolized unless user manually overrides (see FR-4).
- FR-3.3: Recalibration (missed-day handling): any task with `scheduled_date < today` and `status = pending` is treated as unscheduled and re-enters the FR-3.1 pool before that day's distribution runs. No manual trigger required — this happens automatically on load.

### FR-4: Manual Canvas (Drag & Drop)
- FR-4.1: "Today" view shows a drop zone; "Backlog" sidebar lists all pending tasks not yet scheduled to today, grouped by macro goal.
- FR-4.2: User can drag any backlog task into Today, overriding the auto-scheduler's distribution for that task (sets `scheduled_date = today` directly, pins it so recalibration won't reassign it elsewhere).
- FR-4.3: Single drop zone only (Today). No multi-day drag targets in this build.

### FR-5: Daily Close-Out
- FR-5.1: A "Close Day" action, available any time after a configurable hour (default 9 PM, user-editable in settings) or manually triggered.
- FR-5.2: On close, every task still `pending` and `scheduled_date = today` is prompted individually: Mark Done / Roll to Tomorrow / Skip.
- FR-5.3: Writes one row to `pos_daily_closeouts` summarizing the day's numbers.
- FR-5.4: If Close Day is never tapped, the next day's load still triggers FR-3.3 recalibration on unclosed pending tasks — the system self-heals even without explicit close-out.

### FR-6: Opportunity Tracker — Link Vault
- FR-6.1: User can add an opportunity with company, role, source_link, notes, deadline (deadline optional).
- FR-6.2: Full-text search/filter across company/role/notes.

### FR-7: Countdown Urgency
- FR-7.1: Any opportunity with deadline within 24h renders with red background/badge and floats to top of its stage column regardless of default sort.
- FR-7.2: Deadline within 72h renders orange.
- FR-7.3: Sort order within a stage column is deadline-ascending by default; nulls (no deadline) sort last.

### FR-8: Application Kanban
- FR-8.1: Six columns: To Apply → Applied → OA → Interview → Offer, plus Rejected as an explicit terminal column (not a deletion).
- FR-8.2: Drag between columns updates `stage` and `stage_updated_at`.
- FR-8.3: Rejected/Offer cards remain visible (collapsed by default, expandable) for historical pattern review — not deleted.

### FR-9: Quick Capture
- FR-9.1: A persistent floating action button (available on every screen) opens a lightweight text input.
- FR-9.2: On submit, user tags the entry (dsa_win / dev_milestone / random); entry saved instantly, no required formatting.
- FR-9.3: Flat reverse-chronological list view of all captures with a "posted" toggle checkbox per entry. No kanban stages.

### FR-10: Posting Prompts
- FR-10.1: When a macro goal's `completed_units` reaches 100% of `total_units`, or crosses a 50%/75% threshold, system auto-generates a `pos_content_capture` row (tag=dev_milestone or dsa_win per category) pre-filled with a template string ("Just finished {title} — {total_units} {unit_label} down.") and surfaces a dismissible in-app prompt: "Draft a post about this?"
- FR-10.2: This is implemented as an event listener on FR-1/FR-3 completion writes — no separate scheduling infrastructure.

### FR-11: Partner Sync — Shared Dashboard
- FR-11.1: System generates one persistent magic-link token (`pos_partner_link`) requiring no login; visiting the link shows a read-only view of your macro-goal progress bars and today's task completion %.
- FR-11.2: Partner's own tasks: since partner has no account, this build supports **read-only visibility of your progress only** in v1 of this feature (not mutual — partner-side task entry would require her own auth/task tables, explicitly excluded per your instruction to keep her side zero-login). If mutual tracking is wanted later, this needs a second full task-engine instance under her token — flagged here as a known limitation, not silently dropped.

### FR-12: Nudge/Ping System
- FR-12.1: Nudge button on your dashboard with preset messages ("Get back to work!", "Did you do your LeetCode today?") plus custom text input.
- FR-12.2: On send, backend calls Meta Graph API (reusing existing Darzi WhatsApp business number) to deliver message to `partner_whatsapp_number`.
- FR-12.3: Every nudge logged in `pos_nudges` with delivery status for a simple history view (so it doesn't feel like shouting into a void — you can see if it delivered).

### FR-13: PWA Shell
- FR-13.1: Full manifest.json (icons, name, theme color per your neon-brutalist palette), installable on Android/iOS/desktop.
- FR-13.2: Service worker caches shell + last-loaded task/opportunity data for offline viewing (read-only offline; writes queue and sync on reconnect using Workbox background sync).

### FR-14: Push Notifications
- FR-14.1: Morning Briefing — daily push at user-configured time (default 7:00 AM IST) summarizing today's scheduled task count by category ("5 DSA, 2 OS, 1 Dev task today") and top opportunity deadline if within 72h.
- FR-14.2: Deadline Alerts — push fired when any opportunity crosses the 24h-remaining threshold, sent once (deduplicated via a `alerted` boolean flag on the opportunity row to avoid repeat spam).
- FR-14.3: Push delivery uses VAPID keys stored server-side; subscription objects stored in `pos_push_subscriptions`.

### FR-15: PIN-Protected Password Vault
- FR-15.1: First-time setup: user sets a PIN (4-6 digits, their choice). System generates a random salt, stores `pin_verify_hash = hash(PIN + salt)` in `pos_vault_security`. The raw PIN is never stored.
- FR-15.2: The PIN is also run through PBKDF2 (with the same salt, high iteration count) to derive a 256-bit AES key. This key exists only in memory during an unlocked session — never persisted, never sent to any log.
- FR-15.3: Adding an entry: user provides a label, category, and the raw value. Backend encrypts the value with AES-256-GCM using the session-derived key, generates a fresh IV per entry, stores `encrypted_value` + `iv` in `pos_vault_entries`.
- FR-15.4: Viewing an entry requires the vault to be unlocked (correct PIN entered this session). Vault list view (labels + categories only, no values) is visible without unlocking; tapping any entry to reveal its value triggers the PIN prompt if not already unlocked this session.
- FR-15.5: Vault auto-locks: on navigating away from the vault screen, on app backgrounding (mobile), and after 2 minutes of inactivity while on the vault screen. Re-entering requires the PIN again — this is intentional friction, not a bug, per the security requirement of not trusting a single flat check.
- FR-15.6: Failed PIN attempts: after 5 consecutive wrong entries, lock out for 60 seconds (`locked_until`), doubling on repeated failures. This is a UI-level throttle, not a cryptographic requirement, but prevents casual brute-forcing.
- FR-15.7: No PIN recovery flow in this build — if the PIN is forgotten, entries are unrecoverable by design (this is the honest tradeoff of deriving the encryption key from the PIN itself rather than storing a recovery-capable master key). Flag this clearly in Settings UI copy so it isn't a surprise later.
- FR-15.8: Copy-to-clipboard on reveal, with the clipboard automatically cleared after 30 seconds (mobile and desktop both support the Clipboard API for this).

---

## 5. Non-Functional Requirements

- **NFR-1 Performance:** Dashboard load (task recalibration + render) under 1.5s for realistic data volumes (hundreds of tasks, not thousands).
- **NFR-2 Reliability:** Recalibration logic must be idempotent — running it twice in a row without new data produces no duplicate or drifted schedule.
- **NFR-3 Security:** Partner magic link uses a non-guessable UUID token; no other auth needed since it's read-only and non-sensitive. Your own auth via Supabase Auth session, single user only — no signup flow to build.
- **NFR-4 Data integrity:** No hard deletes on opportunities or macro goals — status flags only (abandoned/rejected), preserving history for future pattern-analysis features.
- **NFR-5 Offline tolerance:** Read access to today's tasks and opportunities must work with no network; writes queue locally and flush on reconnect.

---

## 6. API Endpoints (REST, Express)

```
# Macro Goals
POST   /api/macro-goals
GET    /api/macro-goals
PATCH  /api/macro-goals/:id
DELETE /api/macro-goals/:id        (soft: sets status=abandoned)

# Micro Tasks
GET    /api/micro-tasks?date=today
PATCH  /api/micro-tasks/:id        (status, scheduled_date)
POST   /api/micro-tasks/:id/split  (manual slice into 5a/5b)

# Scheduler
POST   /api/scheduler/recompute    (called on app load)

# Daily Close-out
POST   /api/close-day

# Opportunities
POST   /api/opportunities
GET    /api/opportunities
PATCH  /api/opportunities/:id      (stage, deadline, notes)

# Content Capture
POST   /api/captures
GET    /api/captures
PATCH  /api/captures/:id           (posted toggle)

# Partner
GET    /api/partner/:token         (public, read-only)
POST   /api/nudges                 (send via WhatsApp)
GET    /api/nudges

# Push
POST   /api/push/subscribe
POST   /api/push/morning-briefing  (cron-triggered server side)

# Vault
POST   /api/vault/setup            (first-time PIN set)
POST   /api/vault/unlock            (verify PIN, returns short-lived session token, not the key itself)
GET    /api/vault/entries           (labels + categories only, no values)
POST   /api/vault/entries           (requires unlocked session)
GET    /api/vault/entries/:id/reveal (requires unlocked session, returns decrypted value)
DELETE /api/vault/entries/:id
```

---

## 7. Screens

1. **Today** — today's task list (per category), close-day button, quick capture FAB
2. **Backlog/Canvas** — drag-drop override view
3. **Macro Goals** — list + progress bars + create/edit
4. **Opportunities** — kanban board with countdown badges
5. **Content Capture** — flat list, posted toggle
6. **Partner** — nudge button, nudge history, (partner-facing: shared read-only view at `/shared/:token`)
7. **Vault** — PIN unlock screen, entry list (labels/categories visible, values hidden), reveal-on-tap, add-entry panel
8. **Settings** — close-day hour, morning briefing time, WhatsApp number, push opt-in, vault PIN reset (wipes existing entries, explicit warning)

---

## 8. Build Sequencing (for agentic build, single pass)

1. Schema + Supabase setup (all tables above)
2. Macro goal + micro task CRUD + scheduler + recalibration
3. Today view + close-day flow
4. Manual canvas drag-drop
5. Opportunity tracker + kanban + countdown styling
6. Quick capture + posting-prompt event listener
7. Partner magic link + nudge (WhatsApp integration reuse)
8. PWA manifest + service worker + offline caching
9. Push subscription + morning briefing cron + deadline alert trigger
10. PIN-protected password vault (PBKDF2 key derivation + AES-256-GCM encryption)

---

## 9. Known Limitations (explicitly not silently dropped)

- Partner side is read-only; no mutual task tracking without her own auth/task engine.
- No multi-user/tenant support — single-user tool only.
- No analytics/reporting dashboard on historical patterns (data is preserved for this, but the analysis UI itself is not in this build).
