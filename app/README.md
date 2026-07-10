# SkilletFresh — core weekly loop

Implementation of the Claude Design prototype [`design/SkilletFresh Weekly Loop.dc.html`](../design/SkilletFresh%20Weekly%20Loop.dc.html)
(project: [SkilletFresh weekly meal planner](https://claude.ai/design/p/5ae4183c-9f44-491b-8644-36f24257f770)).
Covers the three screens in [docs/design-prompt-core-loop.md](../docs/design-prompt-core-loop.md), wired as one interactive flow:

1. **Sunday Review** — default, swap bottom sheet (3 scored alternates), locked read-only state
2. **Shopping List** — aisle-grouped check-off with progress, trip-complete + skippable receipt prompt
3. **Today View** — week strip, hero recipe card, kitchen-readable recipe detail, one-tap
   Cooked / Swapped / Skipped log, logged confirmation, and the re-plan diff after a skip or swap

Data is seeded from the design file (`src/data.ts`) — in the real build it comes from the
planner agent; those shapes are the handoff contract. Recipe photos are the design's warm
gradient placeholders pending real photography.

## Run

```sh
npm install --include=dev   # dev deps are skipped if NODE_ENV=production
npm run dev
```

Vite + React + TypeScript. Design tokens (palette, type, motion curves) live in `src/index.css`
and match the Claude Design spec: Instrument Sans + Atkinson Hyperlegible, herb green primary,
paprika reserved for logging and progress.
