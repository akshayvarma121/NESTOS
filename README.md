# NestOS

NestOS is a high-performance, strictly designed brutalist operating system built for absolute focus. Designed for individuals and accountability partners, it streamlines task management, routine building, and personal growth.

🌍 **Live Application**: [https://nestos-kappa.vercel.app](https://nestos-kappa.vercel.app)  
*(No local setup required! Simply visit the link, log in, and start focusing instantly.)*

## Core Philosophy

- **Zero Friction**: Clean, brutalist aesthetics with no distractions. Dark mode standard.
- **Extreme Focus**: Everything not scheduled for today is hidden away in the Backlog.
- **Accountability**: Real-time synchronization with your accountability partner.
- **Automation**: Silent background tasks sweep incomplete goals to the backlog and calculate daily heatmaps at midnight.

## Features

- **The Canvas (Backlog)**: A limitless grid to dump micro-tasks, slice macro-goals, and capture unstructured thoughts.
- **Focus Dashboard**: Your daily cockpit. Pull tasks from the Canvas into today's horizon. Private tasks remain strictly hidden.
- **Routines & Timetable**: Build and track daily habits. Timelines lock at 23:00 every day to enforce discipline.
- **Analytics Dashboard**: Automatically logs and visualizes your routine adherence, goal completion, and productivity velocity on beautiful graphs.
- **Notes & Stickies**: Pin important thoughts directly to the dashboard so you and your partner can't ignore them.
- **Pomodoro Timer**: A brutalist built-in countdown timer with milestone tracking to manage your deep work sessions.
- **Opportunities Tracking**: Never miss a job deadline with the integrated application pipeline.
- **Push Notifications**: Receive deadline reminders and morning briefings directly to your devices.

## Guide: How to Use & Configure

1. **Focus First**: Start your day in the **Focus Dashboard**. Any micro-tasks scheduled for today will automatically appear here. As you complete them, they vanish, leaving you with a clean slate.
2. **Timetable**: Set up your recurring routines using the Timetable editor. You can use the UI or bulk-import via JSON (see format below).
3. **Macro Goals**: Go to the **Goals** page to create large, long-term goals. The system will automatically slice them into micro-tasks (or you can provide custom slices). Micro-tasks stay in your Backlog until you schedule them for a specific day.
4. **Partner Synchronization**: Link an accountability partner to share goals, routines, and deadlines. Tasks marked as "Private" remain visible only to you.
5. **Skipping Tasks**: If you skip a micro-task, you can click the "X" button. It will disappear from your Focus Dashboard but safely return to your Backlog for rescheduling.

## Bulk Import JSON Formats

To speed up setup, NestOS supports bulk importing via JSON. Ensure your JSON is formatted exactly as shown to guarantee an error-free, lag-free experience.

### 1. Timetable Import Format
Use this in the Timetable Editor -> JSON Mode to quickly populate your recurring routines.
```json
[
  {
    "title": "Deep Work",
    "description": "Uninterrupted coding time",
    "time_label": "09:00 - 11:30",
    "days_of_week": ["Mon", "Tue", "Wed", "Thu", "Fri"]
  },
  {
    "title": "Gym",
    "description": "Leg day or Cardio",
    "time_label": "17:00 - 18:30",
    "days_of_week": ["Mon", "Wed", "Fri"]
  }
]
```

### 2. Goal Creation Import Format
Use this in the Goals Page -> Import JSON to instantly create goals and custom micro-task slices.
```json
[
  {
    "title": "Learn System Design",
    "category": "dev",
    "deadline": "2026-12-31",
    "total_units": 3,
    "unit_label": "Chapter",
    "customSlices": [
      { "title": "Load Balancing", "description": "Read chapter 1 and write notes" },
      { "title": "Caching Strategies", "description": "Implement a Redis cache example" },
      { "title": "Database Sharding", "description": "Understand horizontal partitioning" }
    ]
  }
]
```
*(Note: `category` options are usually `dev`, `dsa`, `academic`, or `other`)*

## Tech Stack

- **Frontend**: React (Vite) + TailwindCSS (Brutalist Theme Variables)
- **Backend**: Express.js + Node Cron
- **Database**: PostgreSQL (Supabase) + Row Level Security
- **Auth**: Supabase Auth (Magic Links)

## For Developers: Running Locally

*(If you just want to use the app, visit the live link at the top. The following steps are for developers who want to run the code locally.)*

1. Clone the repository.
2. Initialize the Supabase database using the scripts in `api/scripts/`.
3. Configure your `.env` variables for the frontend and backend (VAPID keys, Supabase URLs, etc).
4. Run `npm install` and `npm run build && npm run preview` (or `npm run dev`) in both the `/web` and `/api` directories.
