# SkilletFresh — Claude Design Prompt: Core Loop Prototype

> v1 · July 2026 · Prompt for generating the Phase 2 high-fidelity visual prototype in Claude Design. Scope decisions: core loop only, mobile frame, Priya as design center, triple-duty artifact (usability test with founding users + capstone demo + Phase 2 build reference). Companion to [prd.md](prd.md) §7.1.

---

Copy everything below the line into Claude Design.

---

Design a high-fidelity mobile prototype for **SkilletFresh**, a meal-planning app where an AI agent turns a weekly nutrition goal (e.g. "hit 150g protein/day") into a planned week of dinners, one shopping list, and a visible adherence score. This prototype covers the **core weekly loop only** — the three screens the product lives or dies on — and will be used for usability testing with real users, a capstone demo, and as the visual spec for the build. Design every state listed, not just the happy path.

## Product context you must design around

- **The user:** Priya, 42 — a working professional who plans her week on Sunday and executes on her phone in the kitchen and the grocery store. She has a **hard 30-minute cooking ceiling per day**. The app's job is to make her weekday food decisions disappear.
- **The one metric:** "days in band" — days her nutrition landed inside the target range. Every screen should quietly reinforce progress toward it without making her do math.
- **Tone of the AI:** the agent already did the work; the UI presents *decisions to confirm*, not options to research. Never present more than a handful of choices at once.
- **Nutrition precision is deliberately loose:** targets are bands (±15%), not exact numbers. Show macros as "in band" / range language, never decimal precision.
- **Budget is informational only:** estimated cost appears as passive information. It must never look like a warning, a limit, or a constraint being enforced.

## Frame and platform

Mobile-responsive web app, design at **390px width, light mode**. Clean modern component language, thumb-reachable primary actions, generous tap targets (the core interaction happens with wet or busy hands in a kitchen).

## Screens and states

### 1. Sunday Review — "Your week is ready"

The weekly plan arrives Sunday 6 PM by notification; this screen is what opens.

- Header: week date range + a one-line agent summary ("7 dinners planned · all under 30 min · protein on target every day").
- A vertical list of 7 day cards (Mon–Sun). Each card: recipe photo, recipe name, total time (with a subtle badge confirming it's under her 30-min ceiling), macro summary as compact chips (protein highlighted), and a **fit score out of 10** with a one-line plain-English reason ("9/10 — high protein, uses the chicken already in your pantry").
- Two actions per card: implicit accept (default), and **Swap**.
- **Swap state (bottom sheet):** tapping Swap slides up 3 scored alternates for that day only — same card anatomy, ranked by fit score, each with its one-line reason. One tap replaces the meal and the sheet closes. No search, no browsing, no filters.
- Sticky bottom bar: estimated grocery cost for the week (passive, informational) + a single primary button **"Lock plan & build list"**.
- **Locked state:** after locking, the plan becomes read-only with a locked indicator and the CTA changes to "View shopping list".

### 2. Shopping List — one trip, aisle-grouped

Generated the moment the plan locks. Priya uses this standing in the store.

- Items grouped by **store aisle** (Produce, Meat & Fish, Pantry, Frozen…), each group collapsible with a count.
- Each item: name, combined quantity ("chicken thighs — 1.2 kg"), large easy checkbox. Quantities are already deduped and merged across the household's three profiles — the list should feel like *one* trip, with no per-person breakdown visible.
- Checked items collapse to the bottom of their group, struck through. A progress indicator shows items remaining.
- Estimated total shown passively at top.
- **Post-trip state:** when all items are checked, a gentle prompt appears to enter the actual receipt total (single number field, skippable) — framed as "help SkilletFresh learn prices", never as budget tracking.

### 3. Today View — the daily home screen and the single most important interaction

What Priya sees when she opens the app any weekday evening.

- Top: today's date and a small **week strip** — 7 dots/segments showing each day's status (in band / logged / upcoming), her ambient adherence progress. No numbers, no charts.
- Center: today's recipe as a hero card — photo, name, time (30-min-ceiling badge), her portion size, macro chips.
- Tapping the card opens the **recipe detail**: ingredients with per-portion quantities, then numbered steps in large kitchen-readable type (design this screen too — it's used mid-cooking at arm's length).
- Bottom, thumb zone: the North Star interaction — **three large one-tap log buttons: Cooked · Swapped · Skipped**. This is the most important tap in the product; make it satisfying and unmissable. Design the confirmed state after tapping (e.g. "Logged — 4 of 5 days in band this week").
- **Skip consequence state:** tapping Skipped or Swapped triggers a re-plan. Show the follow-up as a **diff banner**: "Plan updated — Wednesday and Friday changed", with just those two revised day cards shown for one-tap confirmation. Never present a whole new week.

## Visual direction

Fresh and food-forward, but data-credible — this app makes a promise about numbers, so it can't feel like a lifestyle blog, and it lives in kitchens, so it can't feel like a finance dashboard.

- **Palette:** warm off-white base; deep herb green as primary; a single warm accent (paprika/tomato) reserved for the log actions and moments of progress; ink-dark neutral text. No blue/purple SaaS gradients.
- **Type:** a friendly humanist sans for headings, a highly legible companion for data and steps. Recipe steps and the shopping list are the legibility-critical surfaces.
- **Imagery:** real-feeling recipe photography, consistent warm treatment, never sterile stock.
- **Data styling:** macro chips and fit scores styled as calm, rounded UI elements — confident, small, glanceable. The "days in band" week strip should feel like a streak you want to keep, not a report card.
- **Motion cues (describe in the design):** the swap sheet slide, the check-off collapse, and the log-tap confirmation are the three moments worth micro-delight.

## Explicitly out of scope — do not design

Onboarding/profile setup, the full adherence dashboard (the Today week strip is the only adherence surface), pantry checklist, batch/meal-prep mode, multi-profile switching UI, budget warnings or limits of any kind, search or recipe browsing.

## Deliverable

High-fidelity mobile screens covering: Sunday Review (default, swap sheet open, locked), Shopping List (in progress, complete + receipt prompt), Today View (default, recipe detail, logged confirmation, re-plan diff). Consistent components across all screens so the set reads as one product.
