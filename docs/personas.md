# SkilletFresh — User Personas

> v1 · July 2026 · Composite personas seeded from the three founding users, written as segments a broad audience will map onto. Companion to [product-brief.md](product-brief.md).

**Shared across all three personas:** pressed for time (the #1 adherence risk), same budget envelope, common dietary pattern (no dairy/cheese, less red meat, more vegetables and fruit). Because these don't vary, they are product defaults — the axes below are where personas *differ* and therefore where the product must flex.

---

## 1. Priya, 42 — "The Time-Boxed Household Planner"

Working professional, experienced (not expert) home cook, owns the household grocery run. Plans on a computer, checks in from a phone when out. Hard ceiling: **~30 minutes of cooking per day**. Represents the first external growth segment: time-starved professionals who *intend* to cook healthy but fail somewhere along plan → recipes → grocery run → actually prepping.

- **Primary JTBD:** *When Sunday evening arrives, I want the whole week's meals and one shopping trip decided for me, so I can spend my weekday attention on work and family, not on "what's for dinner."* Frequency: weekly plan, daily execution.
- **Top pains:** (1) Integration overhead — juggling a fitness tracker, a recipe app, and a grocery list app, being the glue between them. (2) Any recipe that quietly exceeds the 30-minute window blows up the evening. (3) Mid-week disruptions invalidate the plan and there's no cheap way to recover.
- **Top gains:** A plan that survives the week; a single deduped, aisle-grouped list per shopping trip; measures success as *days where intake landed in the target band* without thinking about it.
- **Unexpected insight:** The planning happens at a desk, but the *failures* happen in the kitchen and the store — so the PDF/mobile view at execution time matters more to adherence than the planning UI. Desktop-first planning, phone-first execution.
- **Product fit:** Strong — she is the design center. Friction risk: manual pantry logging is one more integration job dumped back on her; if it takes >2 min/week she'll stop, and plan quality silently degrades.

## 2. Maya, 20 — "The Variety-Driven Frequent Cook"

College student cycling between family home and a college apartment. The most experienced cook of the young segment; cooks most days rather than batching. **Phone-first for everything.** Health and weight-management goals, but gets bored before she gets off-track — sameness, not willpower, is her churn risk.

- **Primary JTBD:** *When I plan my week, I want every dinner to feel different while still hitting my targets, so cooking stays something I look forward to instead of a chore I quit.* Frequency: cooks 5–6×/week, replans opportunistically.
- **Top pains:** (1) Repetitive plans — an optimizer that converges on the same five efficient recipes loses her in two weeks. (2) Context switches: pantry, budget, and store all change when she moves between home and campus. (3) Anything that requires a computer.
- **Top gains:** Novelty inside constraints (new cuisines/techniques that still fit macros and time); a plan that ports cleanly to a new kitchen and store; success = "I cooked something interesting *and* my week landed in band."
- **Unexpected insight:** Variety is not a preference, it's her adherence mechanism — the Recipe Scorer needs a *repetition penalty*, otherwise pure fit-optimization actively harms the North Star for this segment.
- **Product fit:** Good, with two gaps: the profile must support multiple pantry/location contexts (home vs. apartment), and all review/accept/swap flows must be fully phone-usable.

## 3. Ethan, 17 — "The Goal-Locked Batch Prepper"

High-school senior, newest cook of the three. Wants **meal-prep plans**: cook in one or two big sessions, eat all week. Prioritizes simple recipes that map directly to his goal; treats food as fuel for a specific health/weight outcome. Represents beginners who adopt cooking *because of* the goal, not for love of cooking.

- **Primary JTBD:** *When I have one free block on Sunday, I want a short list of simple, goal-aligned recipes I can batch-cook, so the rest of the week requires zero decisions and zero skill.* Frequency: 1–2 cook sessions/week, 7 days of eating.
- **Top pains:** (1) Recipes that assume technique he doesn't have — one failed dish erodes trust in the whole plan. (2) Plans optimized for cook-fresh-daily don't batch or store well. (3) Choice overload: he wants 3 recipes, not 12 options.
- **Top gains:** Simplicity as a hard filter (low skill ceiling, few ingredients, few steps); portions pre-split across the week by the Macro Balancer; success = the containers in the fridge match the target macros with no daily math.
- **Unexpected insight:** He has the *highest* adherence potential of the three — batching front-loads all willpower into one session — but only if the plan is batch-aware (storage, reheating, portion math). A naive daily-meal plan converts the best-adherence segment into the worst.
- **Product fit:** Good if the planner supports a "prep mode" (batch sessions + storage-friendly recipe filter). Friction: recipe scoring must weight skill ceiling heavily for him; the ±15% variance principle suits him fine.

---

## Anti-personas (explicitly not designing for)

- **The family-meal household** — cooks shared meals for a table of mixed eaters; multi-person planning is out of scope for MVP.
- **The delivery optimizer** — wants cheaper/healthier takeout, not a cooking plan.
- **The precision athlete** — needs ±2% macro accuracy; we committed to ±15% ("roughly right beats accurately wrong").

## What the personas force the product to decide

| Axis | Priya | Maya | Ethan |
| --- | --- | --- | --- |
| Cooking cadence | Daily, ≤30 min | Frequent, variety-led | 1–2 batch sessions |
| Skill ceiling | Experienced | Comfortable | Beginner — hard filter |
| Recipe selection bias | Time fit | Novelty (repetition penalty) | Simplicity + goal fit |
| Primary device | Computer plan / phone execute | Phone everything | Phone everything |
| Plan shape | 7 dinners + 1 shop | 5–6 varied cooks | Few recipes × many portions |

## Data gaps to validate

- Adherence spectrum is inferred, not measured — instrument "plan accepted vs. plan followed" per persona from day one.
- Maya's dual-location need is seeded from one user; check whether the broader segment shares it before building multi-context profiles.
- The time-starved-professional hypothesis (Priya's external segment) is founder intuition — validate with 5–8 interviews before investing beyond MVP.
