# Software Requirements Specification (SRS): NESTOS

## 1. Introduction

### 1.1 Purpose
NESTOS is a high-performance, real-time productivity and accountability operating system designed for focused execution. It bridges the gap between individual task management and shared partner accountability, offering strict daily routines, goal tracking, secure data storage, and zero-distraction workflows.

### 1.2 Tech Stack Architecture
- **Frontend**: React 18, Vite, React Router, Context API, Lucide React (Icons).
- **Styling**: Vanilla CSS with strict CSS Variables (`var(--accent)`, `var(--bg-base)`) enforcing a minimal, brutalist, high-contrast aesthetic (Dark Mode default, Light Mode supported).
- **Backend API**: Node.js, Express, RESTful architecture.
- **Database**: PostgreSQL (hosted on Supabase) utilizing strict Foreign Key constraints, Cascading Deletes, and JSONB fields.
- **Hosting**: 
  - Frontend: Vercel
  - Backend: Render / DigitalOcean
- **Authentication**: JWT-based session management.

---

## 2. Core Architecture & Data Model

### 2.1 Multi-Tenant Partner System
NESTOS is built on a "Shared Space" architecture. 
- A user can generate an **Invite Token** to link their account with a partner.
- Once linked in `pos_partner_connections`, both users share the same workspace for Goals, Tasks, and Deadlines.
- Private boundaries exist: Certain entities (e.g., Vault, Private To-Dos) strictly isolate data to the specific `user_id`.

### 2.2 Database Schema Overview
- `pos_user_profiles`: Core user identities.
- `pos_partner_connections`: Maps two users together.
- `pos_macro_goals`: Long-term objectives with categories (Academic, Dev, DSA).
- `pos_micro_tasks`: Actionable sub-tasks linked to Macro Goals.
- `pos_routines` & `pos_routine_logs`: Recurring schedules and daily completion tracking.
- `pos_routine_locks`: Strict timeline freezing.
- `pos_opportunities` & `pos_deadlines`: Event and timeline tracking.
- `pos_notes`: Markdown-supported notes and dashboard stickies.
- `pos_content_capture`: Quick brain dumps.
- `pos_vault_entries` & `pos_vault_security`: PIN-protected encrypted storage.

---

## 3. Comprehensive Feature List

### 3.1 Focus Dashboard (The Command Center)
The primary entry point designed to answer: *"What do I need to do right now?"*
- **Real-Time Clock & Date**: Persistent time tracking.
- **Sticky Notes**: Color-coded, pinned notes visible directly on the dashboard for immediate reminders.
- **Daily Routine Timeline**: A vertical timeline of recurring habits.
- **Today's Horizon**: Dynamically pulls Micro Tasks scheduled for the current date from the Backlog.
- **Overdue Action Items**: Highlights tasks that missed their scheduled date in stark red.
- **Upcoming Horizon**: Previews tasks scheduled for future dates.
- **Private Focus**: A localized list of `pos_personal_todos` strictly hidden from partners, designed for personal chores.

### 3.2 Daily Routines & Timetable
- **Timetable Editor**: Create recurring routines (e.g., "Gym at 06:00") and assign them to specific days of the week.
- **3-State Completion Tracking**:
  - `[Check]` (Done): Marks the routine as completed successfully.
  - `[X]` (Skipped): Marks the routine as explicitly missed/failed.
  - `Pending`: Unmarked state.
- **Routine Logging**: Add contextual notes to any Done or Skipped routine (e.g., "Skipped because I felt sick").
- **Strict Timeline Lock**: A "Save & Lock Timeline" button that permanently freezes the current day's routine inputs, rejecting any further edits via frontend or API.
- **Routine Analytics/History**: A dedicated page to review the past 7, 30, or 90 days of routine performance, visualizing consistency and notes over time.

### 3.3 Goal Engine & Backlog
- **Macro Goals**: Define high-level objectives (e.g., "Learn React", "Finish Thesis").
- **Micro Tasks**: Break goals down into granular units. 
  - Assignable to specific partners (e.g., "Akshay will do X").
  - Schedulable to specific dates.
  - Urgency flags.
- **Backlog Page**: A kanban-style or list-style view of all uncompleted tasks, allowing drag-and-drop scheduling or manual date assignment.

### 3.4 Accountability & Analytics
- **Daily Closeout System**: An automated CRON job (or manual trigger) that rolls over uncompleted "Today" tasks to the next day.
- **Roll-over Tracking**: The system increments a `rollover_count` for tasks that are continually delayed, highlighting procrastination.

### 3.5 Global Pomodoro Timer
- **Persistent State**: A floating or globally accessible timer that survives page navigation using React Context.
- **Modes**: Focus (25m), Short Break (5m), Long Break (15m).
- **Audio Cues**: Chimes upon completion.

### 3.6 Encrypted Vault
- **Zero-Knowledge Architecture**: Secure storage for API keys, passwords, and sensitive journals.
- **PIN Protection**: Requires a 6-digit PIN to unlock. The PIN is hashed using bcrypt.
- **AES-256-GCM Encryption**: Data is encrypted on the backend before touching the database. The server never stores the raw text.
- **Auto-Lock**: The vault automatically locks after a period of inactivity or upon page refresh.

### 3.7 Opportunities & Calendar
- **Deadlines**: Tracks critical dates with visual countdowns (e.g., "3 days left").
- **Opportunities**: A tracker for job applications, hackathons, or project ideas, complete with status tags (Applied, Interviewing, Rejected).
- **Calendar View**: A visual monthly grid mapping out tasks, routines, and deadlines.

### 3.8 Notes & Captures
- **Knowledge Base (Notes)**: Full-page text editor for meeting notes, study guides, and journaling. Supports Markdown.
- **Brain Dump (Captures)**: A rapid-entry text box for capturing fleeting thoughts without breaking focus. Includes tagging.

### 3.9 System Settings & Security
- **Appearance**: Brutalist Light/Dark mode toggles.
- **Partner Management**: UI to generate or consume invite tokens to link accounts.
- **Danger Zone**:
  - **Vault Factory Reset**: Forcibly destroys the vault and its contents if a PIN is forgotten. Requires typing `DELETE`.
  - **Clear All Data**: Wipes all goals, tasks, routines, captures, and notes from the database, effectively factory-resetting the workspace while keeping the user account and partner link intact. Requires typing `CLEAR`.
- **Authentication**: Secure logout and session destruction.

### 3.10 Recent Feature Iterations (New)
*The following features were developed as enhancements beyond the initial specifications:*
- **Productivity Analytics Dashboard**: Transformed the basic routine history into a full Recharts-powered dashboard displaying KPI summary cards (Adherence %, Total Routines, Total Macro Slices Done), Stacked Bar Charts for routine execution, and Area Charts for goal slice completion over 7/14/30-day timeframes.
- **Collaborative Calendar Slices**: Micro-tasks (slices) and Deadlines are now visually rendered side-by-side on the Calendar monthly grid, allowing for unified viewing of all actionable items on a given day.
- **Bulk JSON Import Capabilities**: Users can now instantly populate their Timetable and Goal Backlogs via strict JSON imports, dramatically reducing the friction of initial setup.
- **Non-Destructive Slice Skipping**: Clicking "Skip" on a scheduled micro-task in the Focus Dashboard no longer marks it as permanently skipped/hidden. Instead, it strips the `scheduled_date` and resets the status to `pending`, effectively moving it back to the Backlog for rescheduling.
- **Pomodoro Contextual Milestones**: The Pomodoro system now automatically triggers UI toast notifications when specific milestones (e.g. 3 sessions completed) are reached, enhancing the gamification of focus.

---

## 4. UI/UX & Design Philosophy
- **Brutalism & Minimalism**: Utilitarian design over flashy graphics. High contrast borders, mono-spaced fonts for metadata, and stark color coding (Red = Overdue/Danger, Green/Accent = Done).
- **Zero Friction**: Inline editing for task titles, one-click completions, and keyboard-friendly inputs (e.g., hitting Enter to save a note).
- **Information Density**: Maximum relevant data on the Focus Dashboard without requiring extra clicks.

## 5. Security & Constraints
- Cross-Origin Resource Sharing (CORS) configured for secure client-server communication.
- Row-level security enforced via backend middleware (`req.sharedSpaceIds`) ensuring users can never query or modify data belonging to unlinked accounts.
- Strict Foreign Key constraints in PostgreSQL ensure orphaned data (e.g., tasks belonging to a deleted goal) is automatically cascade-deleted.
