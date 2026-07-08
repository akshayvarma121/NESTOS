# NestOS

NestOS is a high-performance, strictly designed brutalist operating system built for absolute focus, designed for individuals and accountability partners to streamline task management, routine building, and personal growth.

## Core Philosophy

- **Zero Friction**: Clean, brutalist aesthetics with no distractions. Dark mode standard.
- **Extreme Focus**: Everything not scheduled for today is hidden away in the Backlog.
- **Accountability**: Real-time synchronization with your accountability partner.
- **Automation**: Silent background tasks sweep incomplete goals to the backlog and calculate daily heatmaps at midnight.

## Features

- **The Canvas (Backlog)**: A limitless grid to dump micro-tasks, slice macro-goals, and capture unstructured thoughts.
- **Focus Dashboard**: Your daily cockpit. Pull tasks from the Canvas into today's horizon. Private tasks remain strictly hidden.
- **Routines**: Build and track daily habits.
- **Notes & Stickies**: Pin important thoughts directly to the dashboard so you and your partner can't ignore them.
- **Heatmap Analytics**: Automatically logs and maps your productivity velocity on a beautiful calendar grid.
- **Opportunities Tracking**: Never miss a job deadline with the integrated application pipeline.
- **Push Notifications**: Receive deadline reminders and morning briefings directly to your devices.

## Tech Stack

- **Frontend**: React (Vite) + TailwindCSS (Brutalist Theme Variables)
- **Backend**: Express.js + Node Cron
- **Database**: PostgreSQL (Supabase) + Row Level Security
- **Auth**: Supabase Auth (Magic Links)

## Running Locally

1. Clone the repository.
2. Initialize the Supabase database.
3. Configure your `.env` variables for the frontend and backend.
4. Run `npm install` and `npm run dev` in both the `/web` and `/api` directories.
