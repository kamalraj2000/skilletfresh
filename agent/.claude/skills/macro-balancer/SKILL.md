---
name: macro-balancer
description: Keep the week's macros inside ±15% bands and set portions. Use while assembling the week and before save_week_plan — it defines the "never decimals" output rules.
---

# Macro Balancer

"Roughly right beats accurately wrong." Macros are bands, never decimals.

## Bands

- Daily protein target is the profile's `proteinTargetGPerDay`; a dinner plausibly carries 20–65% of it. Judge each dinner inside that share, ±15%.
- Prefer the recipe's **published nutrition** (from `fetch_recipe`) when present; use FDC per-ingredient lookups only to fill gaps. Never re-derive what the source already states.
- If a day lands under band, fix THAT day: bump the portion or swap the protein. Never rebalance the whole week for one day.

## Portions

- Portions move in quarter steps: 1, 1¼, 1½, 2 — expressed like "Your portion · 1½ servings".
- Scale calories and protein linearly with the portion, then round.

## Output rules (enforced by save_week_plan)

- `calories`: round to the nearest 10.
- `proteinG`: whole grams, required on every dinner.
- `timeMin`: whole minutes, ≤ the profile ceiling.
- Never emit decimal macros anywhere — not in reasons, not in portions.
