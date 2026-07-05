# Cooking Plan Agent

> Capstone project — HumanAngle Summer 2026 Training. Document-heavy track.

**Pipeline:** Ideation → grocery → recipes → macro/calorie tracking.

Turns a weekly goal ("hit 150g protein/day on a $90 budget") into a planned week of meals, a deduped shopping list, and a nutrition dashboard.

## Who it's for

Someone who wants to eat to a macro or budget target but loses hours every week deciding what to cook and what to buy.

## Sources → bar #3

- **Recipe site fetch** — off-the-shelf HTTP-fetch MCP pulling recipes + ingredient lists.
- **Nutrition data** — off-the-shelf MCP over a food/nutrition API (e.g. USDA FoodData Central) for per-ingredient macros.
- **Pantry & constraints log** — custom MCP authored in Claude Code: what's already in the pantry, dietary constraints, dislikes, weekly budget.

## Relevance filter — your first Skill → bar #5

A recipe is relevant if it:

- fits the user's dietary constraints and dislikes,
- lands inside the weekly budget,
- moves the day toward its macro target, and
- matches the user's cooking time and skill ceiling.

## Named Skills → bar #5

| Skill | Input | Output |
| --- | --- | --- |
| **Recipe Scorer** | A recipe + the user's constraints/macros/budget | Score 0–10 for fit, with an explanation of the dock |
| **Grocery Consolidator** | The week's chosen recipes | One deduped shopping list with combined quantities and aisle grouping |
| **Macro Balancer** | A draft week | Adjusted portions and swaps to land daily calories/protein inside target bands; returns structured JSON |

## Multi-modal outputs → bar #4

- PDF weekly meal plan + shopping list (WeasyPrint)
- Printable recipe cards or generated dish images
- Optional Sunday-night email digest (Resend)

## Background planning → bar #2

- **Every Sunday 6 PM** — generate next week's plan (Macro Balancer).
- **Re-plan** when the pantry log changes, a meal is marked skipped/swapped, or the budget is edited mid-week.
