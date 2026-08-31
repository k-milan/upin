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

UPin now has a working Today view and Inbox, date navigation, user-defined daily buckets, persisted task and bucket ordering, a start-of-day carry-over review, Markdown task notes, and local task attachments. With `DATABASE_URL` configured, task data persists in PostgreSQL; without it, the app falls back to a development-only in-memory store.

## Daily buckets and drag-and-drop

Today is organised into small, named buckets you create for that particular day rather than one long checklist. A bucket is a lightweight heading, not a global project or category.

- Tasks can be dragged to reorder them within a bucket or moved to another bucket.
- Bucket names are editable directly from Today; new buckets can be added whenever needed.
- Each bucket has its own add-task control and a gentle empty state.
- The separate **Unbucketed** section holds tasks that do not belong in a daily bucket yet.
- Buckets themselves can be reordered on the day.
- Empty buckets stay visible until deliberately removed.
- At the start of the current day, unfinished tasks from yesterday can be carried over individually, all together, or not at all. Carried tasks enter Unbucketed for fresh organisation.
- Dragging must remain fully keyboard-accessible; it is a convenience, not the only way to organise tasks.

Each task opens in a responsive floating paper panel: half-width on larger screens and full-screen on smaller ones. Notes live together as Markdown with debounced autosave. Files up to 10 MB can be attached, downloaded, and removed; files are stored under `storage/attachments` while their metadata lives in PostgreSQL.

The richer Notion-like block editor remains a later roadmap item. The current editor stores plain Markdown source. New-task motion will also get a deliberate later design pass; existing panel movement respects reduced-motion preferences.

## Run locally

```bash
pnpm install
pnpm dev
```

To run PostgreSQL in Docker, create an ignored `.env` with `POSTGRES_PASSWORD`, then start it. Copy `.env.example` to `.env.local`, set `DATABASE_URL`, and run the migration:

```bash
docker compose up -d
pnpm db:migrate
```

The named Docker volume `upin-postgres` keeps database data when the container is recreated. Back up both that database and `storage/attachments` before deployment.

## Production deployment

Pushing to `main` deploys to the existing droplet through GitHub Actions. The
workflow runs `/var/www/upin/scripts/deploy-production.sh`, which fast-forwards
the checkout, installs lockfile-defined dependencies, builds with the server's
memory limit, applies outstanding Drizzle migrations, and restarts both `upin`
and `upin-mcp`. It leaves `.env.local`, PostgreSQL data, and uploaded files
untouched.

Create these repository secrets under **Settings → Secrets and variables →
Actions**:

- `UPIN_DEPLOY_HOST`: `159.89.200.6`
- `UPIN_DEPLOY_USER`: `root`
- `UPIN_DEPLOY_SSH_KEY`: a private SSH key that is authorized on the droplet
- `UPIN_DEPLOY_KNOWN_HOSTS`: the output of `ssh-keyscan -H 159.89.200.6`

The deployment script refuses to proceed if tracked files on the server were
edited manually, so it cannot silently overwrite a server-side change.

## Visual direction

- Primary: apricot orange (`#F59E6B`; dark `#FFB58A`)
- Secondary: periwinkle (`#7C88C9`; dark `#AAB5F5`)
- Light background: warm white (`#FFFEFC`)
- Dark background: warm near-black (`#171716`)
- Corners are gently rounded: 16px cards, 12px controls, 7–8px checkboxes.

The product should feel like warm paper and a quiet dusk-blue accent—not a productivity dashboard.
