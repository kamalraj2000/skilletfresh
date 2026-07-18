# SkilletFresh app

Next.js (App Router) client for the weekly loop: **Week** (Sunday review +
swaps + lock), **List** (aisle-grouped shopping with receipt capture), and
**Today** (one-tap Cooked/Swapped/Skipped log + re-plan diff banner).

Run from the repo root — see the [root README](../README.md) for the full
quickstart (Postgres, migrations, seed, agent worker).

```bash
npm run dev      # from repo root, or: npm run dev -w app
npm run build -w app
npm run lint -w app   # oxlint
```

Structure notes:

- Pages are server components: `requireProfile()` → Prisma (scoped by
  profileId) → view models (`src/lib/view.ts`) → client components.
- Mutations are server actions in `src/lib/actions.ts`; shopping check-offs
  are optimistic (`useOptimistic`).
- Auth is next-auth v5 credentials + JWT; `src/auth.config.ts` is the
  edge-safe half shared with the route-gating middleware.
- The design system is a single `src/app/globals.css` (ported verbatim from
  the prototype); fonts load via `next/font/google` into the `--font-ui` /
  `--font-data` custom properties.
- `/plan/[planId]/print` is the print layout the agent's PDF renderer hits
  with `?token=PRINT_TOKEN`.
