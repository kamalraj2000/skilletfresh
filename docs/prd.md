# SkilletFresh — Product Requirements Document

> v1 · July 2026 · Companion to [product-brief.md](product-brief.md), [personas.md](personas.md), and [assumption-map.md](assumption-map.md)

## 1. Summary

This PRD specifies the SkilletFresh MVP: a custom app, powered by an agent backend, that turns a weekly goal like "hit 150g protein/day" into a planned week of meals, one deduped shopping list, and a visible adherence score — for three independent user profiles. It is the authoritative spec for the build; the running experiments (E1–E7 in the assumption map) amend it through pre-committed reversal triggers rather than reopening it.

**Two decisions here supersede the product brief** and the brief should be updated to match: (1) the MVP surface is a custom app, not documents alone; (2) the $90 budget is demoted from a planning constraint to a tracked metric until experiment E7 proves cost estimation works.

## 2. Contacts

| Name | Role | Comment |
| --- | --- | --- |
| Kamal Raj | PM / builder / founding user | Owns all decisions; dogfoods the Priya-analog profile |
| Daughter (20) | Founding user | Maya persona; phone-first, variety-driven |
| Son (17) | Founding user | Ethan persona; batch-prep, beginner cook |

## 3. Background

Eating to a plan today means juggling a fitness tracker, a recipe app, and a grocery list app, with the user as the integration layer between them. The core problem is time, not information: recipes and nutrition data exist, but a plan that survives the week doesn't. (Full problem framing: [product-brief.md](product-brief.md).)

**Why now:** agent tooling (MCPs, Skills, scheduled agents) has just made the integration layer buildable by one person in a summer — this is the HumanAngle Summer 2026 capstone. Three founding users are available and committed for live dogfooding, and the concierge trial (E1) starts immediately, so the build gets weekly behavioral data from day one.

## 4. Objective

Prove that an agent-planned week gets a real person to their nutrition target with one shopping trip and near-zero weekday decisions — measured on adherence, not plan quality.

**Key results** (measured over the first month of live MVP use, all three profiles):

- **KR1 (North Star):** each profile averages ≥4 in-band days per week, trending to 5 by month two.
- **KR2:** ≥2 of every 3 weekly plans are accepted with at most one swap.
- **KR3:** ≥80% of weeks are completed on a single shopping trip per household.
- **KR4:** the Sunday plan arrives by 6 PM without manual intervention 100% of weeks.

## 5. Market segments

Segments are defined by the job, not demographics. MVP serves the three founding-user profiles, which map onto the growth segments in [personas.md](personas.md):

| Segment | Job to be done | Key flex the product must support |
| --- | --- | --- |
| Time-boxed household planner (Priya) | Decide the whole week and one shopping trip on Sunday | Hard 30-min cook ceiling; desktop plan / phone execute |
| Variety-driven frequent cook (Maya) | Hit targets while every dinner feels different | Repetition penalty; fully phone-usable |
| Goal-locked batch prepper (Ethan) | One Sunday cook session, zero weekday decisions | Prep mode; skill ceiling as a hard filter |

**Constraints:** shared defaults across all three — pressed for time, common dietary pattern (no dairy, less red meat), one budget envelope. **Not serving** (anti-personas): shared family meals, delivery optimizers, ±2% precision athletes.

## 6. Value propositions

- **Pain removed:** hours of weekly cross-referencing between apps; decision fatigue at 6 PM; plans that die on first disruption; midweek store runs.
- **Gain created:** the week is decided before it starts; one list, one trip; visible proof the goal is being hit ("days in band") without daily math.
- **Why us over the status quo (three disconnected apps):** SkilletFresh is the integration layer — it is the only tool in the stack that knows the goal, the pantry, the budget, and the calendar at once, and it re-plans automatically instead of leaving recovery to the user.

## 7. Solution

### 7.1 UX / key flows

Custom app, mobile-responsive web first (both younger profiles are phone-first; planning may happen on desktop, execution always on a phone).

1. **Onboarding:** create a profile — macro targets, dietary constraints and dislikes, weekly budget envelope (tracked, not enforced), cook-time ceiling, skill level, variety preference, plan shape (daily / batch). Three independent profiles; nothing is shared between them except the household shopping trip.
2. **Sunday review (the core loop):** notification at 6 PM → open plan → accept, or swap individual meals from scored alternates → plan locks → shopping list generated.
3. **Shopping:** aisle-grouped list with check-offs; estimated cost shown; receipt total entered after the trip (feeds E7).
4. **Daily execution:** "Today" view with the recipe, portions, and a one-tap *cooked / swapped / skipped* log — this single tap is the North Star instrument and the re-plan trigger.
5. **Pantry update:** weekly, ≤2 minutes, from a short checklist of tracked staples — not free-form inventory.
6. **Mid-week re-plan:** a skip/swap, pantry edit, or target change triggers a revised remainder-of-week plan delivered as a diff ("Wednesday and Friday changed"), never a whole new plan.

### 7.2 Key features and MVP defaults

The build proceeds on these defaults; each names the experiment result that reverses it (mirrors the [assumption map](assumption-map.md) kill criteria).

| # | Feature | MVP default | Reversal trigger |
| --- | --- | --- | --- |
| 1 | Profiles ×3 | All persona flexes are profile parameters (time ceiling, skill filter, repetition penalty, plan shape) | — |
| 2 | Macro math | Ingredient-level USDA FoodData Central lookup | E3 < 8/10 within ±15% → recipe-published nutrition becomes primary, FDC fills gaps |
| 3 | Recipe sourcing | Live HTTP-fetch MCP primary, cached corpus as fallback | E4 < 80% clean-parse → cached corpus becomes primary |
| 4 | Budget | **Track only:** estimated cost displayed, receipt actuals logged; never influences recipe selection | E7 within ±20% on 2 of 3 weeks → promote to soft ranking signal in the Scorer |
| 5 | Pantry log | Manual weekly checklist, full tracked-staples granularity | E2 > 2 min/week → cut granularity; fridge-photo moves up the roadmap |
| 6 | Prep mode (batch) | Deferred to fast-follow; Ethan profile runs daily-shaped plans at MVP | E6 batch-week adherence ≥ daily-week → prep mode enters MVP scope |
| 7 | Plan editing | Minimal: accept or per-meal swap from scored alternates only | E1 shows frequent edit demand → build a fuller editor |
| 8 | Outputs | In-app plan + PDF export + Sunday email digest | — |
| 9 | Adherence dashboard | Days-in-band per week per profile, from the daily one-tap log | — |

The three Skills behind the loop: **Recipe Scorer** (0–10 fit per profile, with explanation), **Grocery Consolidator** (dedupe, combine quantities, aisle-group across the household), **Macro Balancer** (portion adjustments and swaps to land daily bands; structured JSON).

### 7.3 Technology

- **App:** mobile-responsive web app; thin client over the agent backend.
- **Agent backend:** Claude-based agent orchestrating three MCP sources — recipe-site HTTP fetch (off-the-shelf), USDA FoodData Central (off-the-shelf), pantry & constraints log (custom-built) — plus the three Skills above.
- **Scheduling:** Sunday 6 PM cron for plan generation; event triggers for mid-week re-plans.
- **Documents:** WeasyPrint for PDF; Resend for the email digest.

### 7.4 Assumptions

Tracked in full in [assumption-map.md](assumption-map.md). The ones this spec leans on hardest: A1 (an unprompted plan gets followed — flagship experiment E1), U1 (pantry logging stays under 2 min/week), F2 (ingredient-string → FDC matching supports ±15%), and F3 (enough recipes survive the full constraint stack per profile). Desk tests E3–E5 run this week, before their defaults harden into the build.

**New risk this PRD introduces:** the custom app is the largest build surface in the plan and the least essential to the value loop. Mitigation is the release order below — the agent core ships headless first, so a slipping app never blocks the Sunday plan.

## 8. Release

Relative phases; the hard boundary is capstone end (late summer 2026).

| Phase | Scope | Exit test |
| --- | --- | --- |
| **0 — now** | Desk tests E3–E5; concierge loop E1 running weekly | Defaults 2 and 3 confirmed or reversed |
| **1 — agent core, headless** | Cron → plan generation → PDF + email for all three profiles; replaces the manual concierge | A Sunday plan arrives with zero manual work (KR4) |
| **2 — app MVP** | Profiles, Sunday review + swap, Today view with one-tap log, shopping list + receipt entry, pantry checklist, adherence dashboard | Founding users run a full week without touching email/PDF |
| **3 — fast-follow** | Prep mode (per E6), budget as soft signal (per E7), fridge-photo pantry (per E2), fuller plan editor (per E1) | Each gated on its experiment |
| **Later** | Maya dual-location profiles (natural experiment: fall semester), external Priya-segment interviews (September), household shared meals — explicitly out | — |
