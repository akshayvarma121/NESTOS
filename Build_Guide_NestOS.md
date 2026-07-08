# Build Guide — NestOS
## Vertical-slice build: scaffold → deploy, one feature at a time, full-stack each pass

No backend-then-frontend split. Each phase below takes one feature from database to working UI to a pushed commit before moving on. Feed each phase to your agentic tool as its own prompt — don't paste the whole guide at once, or it'll lose the thread on UI quality.

Design direction to lock before Phase 0 (see notes at the end for full rationale): dense, quiet, data-forward. No emoji anywhere in UI copy or code comments. No gradient hero sections, no rounded-pill everything, no bouncy micro-animations. Think Linear / Things 3 / a real trading terminal — sharp, fast, built for someone who opens it 12 times a day, not once.

---

## Phase 0 — Scaffold & Design Tokens

**Prompt:**
```
Scaffold a new project:
- Frontend: React + Vite + TypeScript + Tailwind CSS, configured as a PWA using vite-plugin-pwa
- Backend: Node + Express + TypeScript on a separate folder, deployed to Render
- Supabase client configured on both ends (anon key on frontend, service role on backend)
- Repo structure: /web (frontend), /api (backend), root README with setup steps

Set up Tailwind with this exact design token system — do not use default Tailwind grays or default border-radius:

Colors (define as CSS variables + Tailwind theme extension):
- bg-base: #0E0F11 (near-black, not pure black)
- bg-surface: #17181B (cards, panels)
- bg-surface-raised: #1F2023 (modals, dropdowns)
- border-hairline: #2A2B2F
- text-primary: #EDEDED
- text-secondary: #9A9A9E
- text-tertiary: #5C5C60
- accent: #4B7BFF (a working blue, not neon — used sparingly for primary actions and focus states only)
- danger: #E5484D (deadline urgency, destructive actions)
- warning: #E5A445 (72h countdown, not-yet-urgent)
- success: #3DD68C (completed states)

Typography:
- Display/UI font: Inter (system-ui fallback) — do NOT use a serif or display font, this is a data tool not an editorial page
- Monospace: JetBrains Mono for numbers, dates, countdowns, stats — use tabular-nums
- Base size 14px on desktop, 15px on mobile. Tight line-height (1.4) for UI chrome, 1.6 for any longer text.

Layout rules:
- Border radius: 6px max everywhere. No pill buttons, no fully-rounded cards.
- No drop shadows for elevation — use a single 1px hairline border (border-hairline) to separate surfaces instead.
- No gradients anywhere.
- Spacing scale: 4px base unit, use 4/8/12/16/24/32/48 only.

Set up two root layout shells:
1. Desktop (≥1024px): a fixed left sidebar (240px, bg-surface) with nav items (Today, Backlog, Goals, Opportunities, Captures, Partner, Settings), and a main content area that behaves like a real dashboard — dense data tables/lists, not centered marketing-style single columns.
2. Mobile (<1024px): bottom tab bar (5 icons max: Today, Goals, Opportunities, Capture, More), full-width content, native-app feel — no visible browser chrome, safe-area-inset padding for notches, tap targets minimum 44px.

Push this as the initial commit. Do not build any feature logic yet — this phase is tokens + shell + empty routed pages only.
```

**Done when:** app boots, five empty pages route correctly, sidebar/tab-bar switch at breakpoint, dark theme renders with the exact tokens above (no default Tailwind slate/gray colors visible anywhere).

---

## Phase 1 — Macro Goals + Micro Tasks + Scheduler (core engine)

**Prompt:**
```
Build the full vertical slice for the task engine, backend to UI, using the schema and logic below (from the SRS). Reference file: SRS_Personal_OS.md sections 3.1, 3.2, FR-1, FR-2, FR-3.

Backend:
- Supabase tables: pos_macro_goals, pos_micro_tasks (exact schema in SRS section 3)
- Express routes: POST/GET/PATCH/DELETE /api/macro-goals, GET/PATCH /api/micro-tasks, POST /api/micro-tasks/:id/split
- Scheduler recompute logic exactly as specified in FR-3.1–FR-3.3 (recompute on every load, not cron). Write this as a pure function first (easy to unit test), then wire it to POST /api/scheduler/recompute.

Frontend:
- Goals page: list of macro goals grouped by category (academic/dsa/dev/other), each with a thin horizontal progress bar (not a circular percentage — this is a dashboard, use bars), unit count as "32/50 problems" in mono font. Create-goal as a slide-in panel from the right, not a modal dialog (feels more native/dashboard than a popup).
- Today page: today's scheduled tasks grouped by category, each a single-line row with a checkbox-style tap target, category color-coded via a small left border strip (not full background color — keep it quiet).
- Inline rename of auto-generated task titles (click text, it becomes an input, blur to save — no separate edit button).

Call /api/scheduler/recompute once on Today page mount, before rendering the task list, so recalibration always runs fresh.

Empty states: if no macro goals exist, Today page should say plainly "No goals yet. Add one to start scheduling tasks." with a direct button to the Goals page — not a mascot illustration or cute copy.

Commit and deploy: push frontend to Vercel, backend to Render, verify the live URL shows working goal creation and today's task list end to end before moving to Phase 2.
```

**Done when:** you can create a macro goal, see auto-sliced tasks, see them distributed across days respecting the deadline, and reloading the next day (or manually shifting your system clock) shows recalibration working.

---

## Phase 2 — Daily Close-Out + Manual Canvas

**Prompt:**
```
Add to the existing task engine (do not rebuild Phase 1):

Backend:
- pos_daily_closeouts table, POST /api/close-day per FR-5

Frontend:
- "Close Day" button on Today page, enabled always but visually emphasized (accent color) after the user-configured hour (default 21:00, store in a simple local settings table or localStorage for now)
- Close-day flow: a slide-up sheet (mobile) / side panel (desktop) that lists each still-pending task from today with three inline actions per row: Done / Tomorrow / Skip — no separate confirmation dialogs, tapping one action immediately resolves that row and it disappears from the list
- Backlog/Canvas page: two-column layout — left column "Backlog" (all pending unscheduled tasks grouped by macro goal), right column "Today" (today's scheduled tasks). Implement drag-and-drop from Backlog into Today using dnd-kit, single drop zone only per FR-4. Dropped tasks get scheduled_date = today and a "pinned" flag so the next recompute doesn't reassign them elsewhere.
- Dragging should feel native: a subtle lift (slight scale + border highlight) while dragging, snap into place on drop, no bounce/spring overshoot — a sharp, precise motion, not a playful one.

Deploy and verify close-day and drag-drop work on both a real mobile browser (installed as PWA) and desktop before moving on.
```

**Done when:** you can close a day and see rolled-over tasks correctly reappear, and drag a backlog task into Today with it staying pinned there after a page reload.

---

## Phase 3 — Opportunity Tracker

**Prompt:**
```
Build the full vertical slice for the opportunity tracker per SRS section 3.4, FR-6, FR-7, FR-8.

Backend:
- pos_opportunities table
- CRUD routes per the API list in SRS section 6

Frontend:
- Kanban board, six columns (To Apply, Applied, OA, Interview, Offer, Rejected), horizontal scroll on desktop if needed, but on mobile render as a single-column list with a stage picker at the top instead of a horizontal kanban (horizontal kanban on a phone is a bad native pattern — don't do it).
- Card: company name (bold), role (secondary text), deadline countdown in mono font, colored per FR-7 (red under 24h, orange under 72h, no color if none/far out or no deadline).
- Rejected and Offer columns collapsed by default (show count only, tap to expand) — per FR-8.3, keep historical clutter out of the active view.
- Add-opportunity as a slide-in panel matching the pattern from Phase 1 (consistency matters here — same interaction pattern for every "add new thing" in the app).
- Drag between columns updates stage immediately, optimistic UI update (don't wait for server response to move the card visually).

Deploy and verify before moving to Phase 4.
```

**Done when:** you can add an opportunity, see it correctly color-coded by deadline urgency, and drag it through stages with the Rejected/Offer columns properly collapsed.

---

## Phase 4 — Quick Capture + Posting Prompts

**Prompt:**
```
Build per SRS section 3.5, FR-9, FR-10.

Backend:
- pos_content_capture table, capture CRUD routes
- Event listener: hook into the macro-goal completion write from Phase 1 (when completed_units crosses 50%, 75%, or 100% of total_units), auto-insert a pre-filled capture row per FR-10.1

Frontend:
- Floating action button, bottom-right on desktop, above the tab bar on mobile, visible on every screen (goals, today, opportunities — persistent across routes)
- Tapping it opens a minimal single-textarea input with three tag buttons below it (DSA win / Dev milestone / Random) — no dropdown, tap a tag to select, tap again to submit. Should feel instant, sub-second, this is meant to capture a thought before it evaporates.
- Captures list page: flat reverse-chronological list, each row shows the text (truncated to 2 lines), tag as a small colored label (not a badge with rounded pill — a plain colored left border strip again, consistent with the Today page pattern from Phase 1), and a "Posted" checkbox on the right.
- When a posting-prompt auto-capture appears, surface a small non-blocking toast/banner ("New milestone captured — draft a post?") rather than an interrupting modal.

Deploy and verify the milestone-triggered auto-capture actually fires when you complete a goal from Phase 1.
```

**Done when:** quick capture is fast enough to use mid-DSA-session without breaking flow, and finishing a goal auto-generates a capture entry.

---

## Phase 5 — Partner Sync + Nudge

**Prompt:**
```
Build per SRS section 3.6, 3.7, FR-11, FR-12.

Backend:
- pos_partner_link, pos_nudges tables
- GET /api/partner/:token (public route, no auth middleware, read-only — only exposes macro goal progress percentages and today's completion %, nothing else)
- POST /api/nudges — sends via Meta Graph API to the stored WhatsApp number (reuse the existing Darzi WhatsApp integration/credentials, do not set up a second WhatsApp Business number)

Frontend:
- Settings page: field to set partner name + WhatsApp number, generates the magic link token, shows a copyable link
- Public shared view at /shared/:token — completely separate minimal layout (no sidebar/tab-bar, just a clean read-only progress view), since the partner never logs in
- Nudge panel: two preset buttons + one custom text field, send button, and a simple log below showing sent nudges with delivery status (small mono-font timestamp + status dot: green sent, red failed)

Deploy and test the actual WhatsApp delivery end to end, and confirm the shared link works in an incognito browser (proving it truly needs no auth).
```

**Done when:** the shared link works with zero login in an incognito tab, and a nudge actually arrives on WhatsApp.

---

## Phase 6 — Push Notifications + PWA Polish

**Prompt:**
```
Final phase, per FR-13, FR-14.

Backend:
- pos_push_subscriptions table, VAPID key setup
- POST /api/push/subscribe
- Cron (Render cron job or simple node-cron) for morning briefing at the user-configured time, per FR-14.1
- Deadline alert trigger: a scheduled check (every 15-30 min is fine) that scans pos_opportunities for any crossing the 24h threshold with alerted = false, sends push, sets alerted = true

Frontend:
- Push permission request: do NOT prompt on first load. Trigger it contextually — e.g. after the user creates their first macro goal, show a small inline banner "Get a morning briefing on your phone?" with an explicit opt-in button. Unprompted permission popups on load are the single most common thing that makes a PWA feel like a website pretending to be an app, not a real one.
- Service worker: cache app shell + last-fetched today/opportunities data for offline read access, per NFR-5. Show a small persistent "Offline — showing last synced data" strip at the top when network is unavailable, in text-secondary color, not alarming red.
- Final manifest.json polish: correct icons (192/512 + maskable variant), theme_color matching bg-base, display: standalone, orientation not locked (support both).
- Do a final pass on every screen for: visible focus states on all interactive elements (keyboard nav), consistent spacing per the Phase 0 token scale, and remove any lingering default browser affordances (default checkbox/radio styling, default select dropdowns) — replace with styled equivalents matching the token system.

Deploy. Install the PWA on your actual phone home screen and verify: it opens without browser chrome, morning briefing arrives at the set time, and a test opportunity with a fake 23-hour deadline correctly fires a push.
```

**Done when:** installed on your phone, it opens indistinguishably from a native app, and both push types have actually fired and been received once each.

---

## Phase 7 — PIN-Protected Password Vault

**Prompt:**
```
Build the full vertical slice for the vault per SRS section 3.9, 3.10, FR-15.

Backend:
- pos_vault_entries, pos_vault_security tables
- POST /api/vault/setup — first-time PIN entry, generate random salt (crypto.randomBytes), store pin_verify_hash = a strong hash (e.g. scrypt or PBKDF2-SHA256, high iteration count) of PIN+salt. Never store or log the raw PIN.
- POST /api/vault/unlock — takes the PIN, re-derives the hash with stored salt, compares to pin_verify_hash. On success, separately derive a 256-bit AES key from PIN+salt via PBKDF2 (distinct derivation from the verify hash — same salt is fine, different info/context string), hold this key server-side only for the duration of a short-lived session token (e.g. 5 min JWT or similar), return only the session token to the client, never the key itself.
- POST /api/vault/entries — requires valid session token, encrypts the submitted value with AES-256-GCM using the session's derived key, generates a fresh random IV per entry, stores ciphertext + iv.
- GET /api/vault/entries — no session required, returns only label + category + id, never encrypted_value.
- GET /api/vault/entries/:id/reveal — requires valid session token, decrypts and returns the value.
- Implement the failed-attempt lockout per FR-15.6 (track failed_attempts and locked_until on pos_vault_security).

Frontend:
- Vault page: locked by default. Lock screen is a plain numeric PIN pad (large tap targets, mono font digits), matching the app's dark theme — no cutesy lock icon animation, just a clean numeric entry.
- Once unlocked: list of entries showing label + category only (small colored left-border strip per category, consistent with the pattern from Today/Captures). Tapping an entry shows the value with a "Copy" button; copying triggers a toast "Copied — clears in 30s" and the frontend clears the clipboard via the Clipboard API after 30 seconds.
- Add-entry: same slide-in panel pattern as every other "add" flow in the app (label input, category dropdown, value input as a masked password-style field with a show/hide toggle).
- Auto-lock: implement per FR-15.5 — on route change away from vault, on visibility change (tab/app backgrounded), and a 2-minute inactivity timer while on the vault screen. Locking simply discards the client-held session token and returns to the PIN pad.
- Settings: add a "Reset vault PIN" action with an explicit, unambiguous warning that this wipes all existing entries (since forgotten-PIN recovery is not supported per FR-15.7) — require the user to type "DELETE" to confirm, not just a single confirm button, since this is genuinely destructive and irreversible.

Deploy and verify: set a PIN, add a real entry, lock the app by switching tabs, come back, confirm it's locked, unlock, reveal and copy the value, confirm clipboard clears after 30s.
```

**Done when:** the vault is genuinely locked (server never returns a value without a valid unlock session), auto-lock actually triggers on tab switch, and the destructive PIN-reset flow requires deliberate confirmation.

---

## Notes on the "no AI slop" direction

The single biggest tell of an AI-generated dashboard is over-decoration: gradients, big rounded cards with heavy shadows, emoji in headers, bouncy spring animations on every interaction, and centered marketing-page layouts used for what should be dense utility screens. Everything in this guide pushes the opposite way — hairline borders instead of shadows, sharp 6px-max radius, mono font for anything numeric, single-accent color used only for primary actions and urgency states, and interaction patterns (slide-in panels, inline edit-on-click, optimistic drag updates) borrowed from real tools you already use daily (Linear, Notion, Things) rather than generic component-library defaults.

If at any phase the agentic build starts reaching for gradient buttons, colorful badge pills, or a centered single-column "hero" layout on what should be a data screen — stop it there and re-paste the Phase 0 token constraints before continuing.


NESTOS@ADMIN