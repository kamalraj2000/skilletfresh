---
name: recipe-scorer
description: Score a candidate dinner 0–10 for a specific profile and write its one-line reason. Use when ranking candidate recipes for the week plan, the swap alternates, or a re-plan replacement.
---

# Recipe Scorer

Score every candidate recipe for THIS profile before it enters the plan.

## Hard filters (score 0 — never plan it)

- Cook time over the profile's `timeCeilingMin`.
- Violates any diet tag (e.g. `vegetarian`, `no-pork`).
- Technique above the skill level: levels 1–2 get one-pan / sheet-pan / simple sautés only; no butchery, no multi-component timing, no deep frying.

## Soft scoring (start at 10, subtract)

- **Repetition penalty**: −2 if the same primary protein appeared in the last 2 days of the plan; −1 if the same cuisine appears 3+ times this week. Scale by `varietyPreference`: at 5, double these penalties; at 1, halve them.
- **Protein contribution**: −1 if the dinner lands in the bottom quarter of the plausible dinner-protein band for the profile's daily target.
- **Pantry overlap bonus**: +1 (max 10) if 2+ pantry staples are used.
- **Effort fit**: −1 if the recipe is at the ceiling on a weeknight (Mon–Thu) for profiles with `timeCeilingMin` ≤ 30.

## The reason line

One sentence, ≤ 120 chars, concrete and personal — name the ingredient, the timing, or the balance it serves:

- GOOD: "High protein; uses the chicken already in your pantry"
- GOOD: "Lightest night; balances Friday's richer dinner"
- BAD: "A tasty and nutritious option" (generic — never write this)

Fit scores in the final plan should mostly be 7–9. A 10 is rare. Anything under 7 should have been swapped out before saving.
