# SkilletFresh — Assumption Map & Experiments

> v1 · July 2026 · Companion to [product-brief.md](product-brief.md) and [personas.md](personas.md)

**Ground rules (decided July 5, 2026):**

- **Test surface: the three founding users only** — builder, daughter, son — mapping onto the Priya, Maya, and Ethan personas respectively. No external recruiting this summer; external-segment assumptions are *deferred with a revisit date*, not tested badly.
- **The build ships regardless.** This is not a go/no-go document. Experiments exist to shape design decisions, and kill criteria apply to **features, not the project**.
- **Experiments run parallel to the build**, so every experiment below is zero-dependency on shipped code — concierge, desk test, or spreadsheet.
- **Scope: Value + Usability (desirability) and Feasibility.** Viability, go-to-market, and team risks are out of scope for a single-builder capstone with no revenue model.
- **Evidence standard:** n=3 yields existence proofs and failure discovery, not statistics. A *pass* means "no reason found to change the design"; a *fail* is a design change — and those are the findings that matter.

## The assumptions

Impact = effect on the North Star (days with intake in the target band) × users affected. Confidence = how sure we are today, 1–10. Risk is high when confidence is low **and** being wrong is expensive to discover late.

| ID | Assumption | Category | Impact | Conf. | Verdict |
| --- | --- | --- | --- | --- | --- |
| A1 | A plan that arrives unprompted on Sunday will actually be **followed** for a full week — the brief's named riskiest assumption | Value | High | 4 | **Test** → E1 |
| A2 | Automatic re-plan after a disruption keeps the week alive instead of triggering abandonment | Value | High | 5 | **Test** → E1 |
| A3 | Maya's segment churns on sameness — the Recipe Scorer needs a repetition penalty or fit-optimization harms adherence | Value | Med | 6 | **Test** → E5 |
| A4 | A batch-aware "prep mode" flips Ethan's segment from worst-adherence to best | Value | Med–High | 5 | **Test** → E6 |
| A5 | One deduped, aisle-grouped list genuinely covers the week — no midweek store runs | Value | Med | 6 | **Test** → E1 (piggyback) |
| A6 | Users accept roughly-right macros — ±15% variance doesn't erode trust in the plan | Value | Med | 7 | **Defer** — instrument once real plans exist |
| U1 | Manual pantry logging stays under **2 min/week**; beyond that Priya stops and plan quality silently degrades | Usability | High | 3 | **Test** → E2 |
| U2 | A PDF on a phone is a good-enough execution surface in the kitchen and the store | Usability | Med | 6 | **Defer** — check during E1, no dedicated experiment |
| U3 | A review-and-accept flow can be fast and fully phone-usable | Usability | Med | 7 | **Proceed** — treat as a design constraint, not a question |
| U4 | The skill-ceiling filter works: Ethan can execute what the Scorer picks for him; one failed dish erodes trust in the whole plan | Usability | Med | 5 | **Test** → E5, E6 |
| F1 | An off-the-shelf HTTP-fetch MCP can pull clean, parseable ingredient lists from real recipe sites | Feasibility | High | 4 | **Test** → E4 |
| F2 | Scraped ingredient strings ("1 cup chopped onion") can be matched to USDA FoodData Central accurately enough for ±15% **end-to-end** | Feasibility | High | 3 | **Test** → E3 — highest feasibility risk |
| F3 | Enough recipes survive the full constraint intersection (no dairy, budget, time ceiling, macros, variety) to fill a varied week | Feasibility | High | 4 | **Test** → E5 |
| F4 | A shopping list can be costed against the $90 budget at all — **no source doc names a grocery-price data source**; USDA has none | Feasibility | High | 3 | **Test** → E7 |
| F5 | Sunday cron + event-triggered re-plan is reliable | Feasibility | Med | 9 | **Proceed** — known tech |

**Matrix summary:** six assumptions sit in the test-now quadrant (A1, U1, F1, F2, F3, F4 — high impact, low confidence); four ride along on other experiments (A2, A3, A5, U4); A4 gets its own cheap A/B; two proceed as design constraints (U3, F5); two defer (A6, U2). Nothing lands in the reject quadrant — consistent with the brief already having pruned scope hard.

## The experiments

Every experiment measures **behavior, not opinions**, needs no shipped code, and names the design decision it feeds.

### E1 · Concierge Sunday Loop — *the flagship* (A1, A2, A5)

Run the entire product manually for **three weeks, starting this Sunday**. The builder assembles each user's weekly plan (spreadsheet + Claude-assisted), delivers it Sunday 6 PM, with one consolidated shopping list per household trip. Each user keeps a one-line daily log: *cooked as planned / swapped / skipped*, plus any midweek disruption and whether a manual re-plan rescued the week. Count store trips.

- **Success:** ≥4/7 in-band days per user by week 2; ≤1 unplanned store trip per week.
- **Shapes:** how much re-plan automation matters vs. Sunday-plan polish; notification design; whether a plan-editing UI is needed at all (count how often users want edits).
- **Watch for:** *who* breaks the plan and *why* — the failure taxonomy here is worth more than the pass rate.

### E2 · Pantry-Log Stopwatch (U1)

Inside E1: each user logs the pantry weekly in a plain shared note, and times it.

- **Success:** ≤2 minutes/week, three weeks running.
- **On fail:** promote the fridge-photo stretch goal toward MVP, or cut log granularity (staples assumed, only track proteins and produce).

### E3 · Macro-Math Bench (F2) — *desk test, ~half a day, do first*

Take 10 real recipes from target sites that publish their own nutrition facts. Hand-match every ingredient to a FoodData Central entry, compute macros, compare against the published numbers.

- **Success:** ≥8/10 recipes land within ±15% on calories and protein.
- **On fail:** invert the architecture — use recipe-published nutrition as primary and FDC only to fill gaps. This decision hardens into the build fast, which is why this runs first.

### E4 · Fetch Reliability Sweep (F1) — *desk test, ~half a day*

Pull 25 recipes across 5 target sites through the off-the-shelf HTTP MCP. Score each fetch: clean ingredient list with quantities, or not.

- **Success:** ≥80% clean-parse rate.
- **On fail:** the graceful-degradation path becomes the primary path — standardize on 1–2 parse-friendly sites and build the cached recipe corpus now, not as a fallback.

### E5 · Constraint Dry-Run (F3, A3, U4) — *desk test, uses E4's corpus*

Manually apply the Recipe Scorer criteria to the fetched corpus, once per persona profile.

- **Success:** ≥2× the needed weekly recipe count survives each profile's full filter stack; for the Maya profile, survivors span enough cuisines that a repetition penalty has something to work with; for the Ethan profile, survivors genuinely sit at beginner skill.
- **Shapes:** first real tuning data for Scorer weights — time ceiling (Priya), repetition penalty (Maya), skill hard-filter (Ethan).

### E6 · Prep-Mode A/B (A4, U4)

Inside E1: the son gets week 2 as a cook-daily plan and week 3 as a two-session batch plan (portions pre-split, storage-aware).

- **Success:** batch week adherence ≥ daily week adherence, and zero dishes abandoned mid-cook for skill reasons.
- **Shapes:** whether prep mode is MVP or fast-follow — the personas doc claims a naive daily plan "converts the best-adherence segment into the worst"; this is the direct test.

### E7 · Checkout-Receipt Audit (F4)

Before each E1 shopping trip, estimate the list's cost using the intended costing method (LLM price estimation, unless a better source is found). Compare against the actual receipt.

- **Success:** within ±20% on at least 2 of 3 weeks.
- **On fail:** demote budget from hard constraint to soft ranking signal — and update the product brief's trade-off principle accordingly.

## Sequencing

| When | What |
| --- | --- |
| This week (desk) | E3 → E4 → E5, in that order — they de-risk architecture decisions before the parallel build hardens them |
| This Sunday | E1 begins (3-week run); E2 and E7 ride along from week 1 |
| E1 weeks 2–3 | E6 prep-mode A/B |
| End of week 3 | Findings review → update brief and Scorer spec; feed the PRD |

## Feature kill criteria

The project ships regardless; these are the pre-committed *feature* decisions:

| Feature decision | Killed or demoted if |
| --- | --- |
| Ingredient-level USDA macro math | E3 < 8/10 → recipe-published nutrition becomes primary |
| Live recipe fetch as primary source | E4 < 80% → cached corpus becomes primary |
| Budget as a hard constraint | E7 misses ±20% → soft ranking signal |
| Manual pantry log as designed | E2 > 2 min/week → cut granularity or promote fridge-photo |
| Prep mode deferred past MVP | E6 shows batch ≥ daily for Ethan → prep mode enters MVP |
| Plan-editing UI investment | E1 shows plans accepted without edits → keep review flow minimal |

## Deferred — with revisit dates

- **Priya's external segment** (time-starved professionals — founder intuition per the personas doc): needs 5–8 interviews we can't run this summer. Revisit **September 2026**, only if the family loop proves out in E1.
- **Maya's dual-location profile**: a natural experiment arrives when the daughter returns to campus in the **fall**. Until then, keep the profile schema location-ready but build nothing.
- **A6 (±15% trust)** and **U2 (phone execution surface)**: instrument once real plans exist; no pre-build test beats live observation here.
