# SkilletFresh

Agent-backed weekly meal planner: a weekly nutrition goal in, a planned week of
dinners, one aisle-grouped shopping trip, and a visible adherence score out.
Product docs live in [docs/](docs/) (PRD, personas, assumption map).

## Layout

| Path | What |
|---|---|
| `app/` | Next.js (App Router) web app — the three-tab weekly loop |
| `agent/` | Claude Agent SDK planner: weekly plan + re-plan runs, cron worker, PDF/email outputs |
| `packages/contracts/` | zod schemas for the planner handoff contract (shared by app and agent) |
| `packages/db/` | Prisma client + the single write path for planner output |
| `prisma/` | schema, migrations, seed (3 founding profiles + a stub week) |

## Quickstart

```bash
npm install
npm run db:up        # Postgres 17 in Docker
npm run db:migrate   # prisma migrate dev (generates the client)
npm run db:seed      # Priya / Maya / Ethan + a planned week each
npm run dev          # app on http://localhost:3000
```

Sign in as `priya@skilletfresh.local` / `maya@…` / `ethan@…`, password
`skillet-dev` (override with `SEED_PASSWORD` before seeding).

Env: copy `.env.example` → `.env` (Prisma/agent) and put `AUTH_SECRET`,
`DATABASE_URL`, `PRINT_TOKEN` in `app/.env.local` for the app.

## The planner agent

The app works end-to-end on a deterministic stub. The real planner is a
Claude agent (`agent/`) with three Skills (recipe-scorer,
grocery-consolidator, macro-balancer) and Prisma/FDC/recipe-fetch tools; it
delivers output only through zod-validated save tools — the same write path
as the stub.

```bash
npx tsx agent/src/cli.ts plan --profile priya [--week 2026-07-13] [--verbose]
npx tsx agent/src/cli.ts replan --profile priya
npm run -w agent worker   # Sunday-6PM cron + AgentJob queue + PDF/email pipeline
```

- Auth: uses your local `claude` CLI credentials, or set `ANTHROPIC_API_KEY`.
- Cost: a weekly plan run is roughly **$1–2** (Opus); logged per run in `AgentRunLog`.
- `RECIPE_SOURCE=corpus` (default) plans from cached recipes; `live` lets the
  agent fetch recipe sites (several major sites bot-block plain fetches — see
  `scripts/harness-e4-parse.mts` for the E4 feasibility probe).
- With the worker running, set `REPLAN_STUB=0` for the app so skip/swap
  re-plans come from the agent (via `AgentJob`) instead of the instant stub.
- Emails need `RESEND_API_KEY` + `DIGEST_FROM`; PDFs need the app running and
  `PRINT_TOKEN` set (rendered via the `/plan/<id>/print` route).

## Verification

```bash
npx tsx scripts/e2e-loop.mts        # Playwright drive of the full weekly loop (18 checks)
npx tsx scripts/harness-e4-parse.mts  # recipe-site JSON-LD parse-rate probe
```

`npm run db:reset` drops the database — once real dogfooding starts, receipts
and meal logs are the experiment data; back up the `pgdata` volume first.
