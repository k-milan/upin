# UPin

A quiet, daily-first personal to-do app named in memory of Upin.

## Stack

- Next.js App Router, React, and TypeScript
- Tailwind CSS v4, shadcn/ui (base-nova), Lucide icons
- TanStack Query and Axios, following the Hairclubs frontend conventions
- PostgreSQL with Drizzle migrations
- Nginx on the existing DigitalOcean Droplet

The web app owns the browser UI and `/api` routes. A separate TypeScript MCP process will be exposed at `/mcp` by Nginx, sharing UPin’s task service and database.

## Current state

The initial Today checklist is working with add and complete interactions. Until the `upin` Postgres database is provisioned, it runs against a development-only in-memory store. Those example tasks reset when the server restarts.

## Daily buckets and drag-and-drop

Today is organised into small, named buckets you create for that particular day rather than one long checklist. A bucket is a lightweight heading, not a global project or category.

- Tasks can be dragged to reorder them within a bucket or moved to another bucket.
- Bucket names are editable directly from Today; new buckets can be added whenever needed.
- Each bucket has its own add-task control and a gentle empty state.
- The separate **Unbucketed** section holds tasks that do not belong in a daily bucket yet.
- Buckets themselves can be reordered on the day.
- Empty buckets stay visible until deliberately removed.
- During the start-of-day carry-over review, a carried task can be placed into a chosen bucket; otherwise it enters an unassigned section at the top of Today.
- Dragging must remain fully keyboard-accessible; it is a convenience, not the only way to organise tasks.

Each task opens in a responsive side sheet: half-width on larger screens and full-screen on smaller ones. Notes, bullets, and checklists live together as Markdown. Attachments come after Postgres-backed tasks and the daily-review flow.

New-task and drag motion will be designed as a deliberate later pass. The first implementation should keep movement subtle, quick, and optional for people who prefer reduced motion.

## Run locally

```bash
pnpm install
pnpm dev
```

For the eventual Postgres setup, copy `.env.example` to `.env.local`, set `DATABASE_URL`, then run:

```bash
pnpm db:generate
pnpm db:migrate
```

## Visual direction

- Primary: apricot orange (`#F59E6B`; dark `#FFB58A`)
- Secondary: periwinkle (`#7C88C9`; dark `#AAB5F5`)
- Light background: warm white (`#FFFEFC`)
- Dark background: warm near-black (`#171716`)
- Corners are gently rounded: 16px cards, 12px controls, 7–8px checkboxes.

The product should feel like warm paper and a quiet dusk-blue accent—not a productivity dashboard.
