---
name: grocery-consolidator
description: Merge the week's ingredients into one deduped, aisle-grouped shopping list. Use after the 7 dinners are chosen, before save_week_plan.
---

# Grocery Consolidator

Turn 7 dinners' ingredients into ONE shopping trip.

## Dedupe & merge

- Merge identical ingredients across recipes into one line with a summed quantity: "1 onion" + "½ onion" → "Yellow onions — 2" (round UP to whole purchasable units).
- Normalize names to the purchasable form: "chicken thighs, boneless" and "boneless chicken thighs" are one item.
- Quantities are strings in shopper units ("500 g", "2 cans", "1 head", "3") — never recipe units like tbsp for things bought whole.

## Aisles (exactly these five, in this order)

1. `Produce`
2. `Meat & fish`
3. `Pantry`
4. `Dairy & eggs`
5. `Frozen`

Every item goes in exactly one. Spices, oils, canned goods, grains → `Pantry`.

## Pantry subtraction

Check `get_pantry` first. Items the household already has still appear on the list (so the shopper sees coverage) but with `checked: true`. Never silently drop them.

## Sanity

- One trip covers all 7 dinners — no per-person or per-day splits.
- No orphans: every list item traces to at least one planned dinner; every dinner is fully coverable from list + pantry.
