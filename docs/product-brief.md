# SkilletFresh — Cooking Plan Agent

> Product brief · v1 · July 2026 · Capstone — HumanAngle Summer 2026 Training (document-heavy track)

**One-liner:** SkilletFresh turns a weekly goal like "hit 150g protein/day on a $90 budget" into a planned week of meals and one deduped shopping list — so when it's time to cook, everything is already decided and already in the kitchen.

## Problem

Eating to a plan today means juggling three disconnected apps: one for health and fitness tracking, one for recipes, one for the grocery list. Nothing talks to anything, so the user is the integration layer — manually cross-referencing macros against recipes against what's in the pantry. The result: hours lost every week to deciding and shopping, and home-cooking plans that collapse under the coordination overhead. **The core problem is time, not information** — recipes and nutrition data exist; a plan that survives the week doesn't.

## Users

- **Now:** the builder (dogfooding), eating to macro and budget targets.
- **Next:** family members (son, daughter) — same flow, separate individual profiles.
- **Later:** a broad audience of goal-driven home cooks, once the single-user loop is proven.

## The main flow

Help the user **pick the right recipes and plan the grocery run** so everything is set to cook when the time comes:

1. **Sunday 6 PM** — agent generates next week's plan from the goal, pantry log, and constraints.
2. User reviews and accepts; gets a PDF meal plan + one aisle-grouped, deduped shopping list.
3. One shopping trip; the week is pre-decided. Mid-week disruptions (skipped meal, pantry change, budget edit) trigger an automatic re-plan.

**Powered by three sources** — recipe-site fetch (HTTP MCP), nutrition data (USDA FoodData Central MCP), and a custom pantry & constraints MCP — **and three skills:** Recipe Scorer (0–10 fit with explanation), Grocery Consolidator (merged list, combined quantities), Macro Balancer (portions and swaps to land daily targets; structured JSON).

## Product principles

- **Time wins when constraints conflict.** If budget, macros, and cook time can't all be met, protect the user's time first; flag the trade-off rather than silently blowing the time ceiling.
- **Roughly right beats accurately wrong.** ±15% macro variance is acceptable; don't over-invest in ingredient-level precision at the cost of shipping the loop.
- **Degrade gracefully.** Recipe fetch fails → fall back to cached recipes. The Sunday plan always arrives.

## Success metric

**North Star: days where actual intake landed in the target band.** Supporting signals: plans accepted without edits, weeks completed with a single shopping trip, plan-generation-to-review time.

## Scope

| In (MVP) | Stretch | Out |
| --- | --- | --- |
| Single-user weekly plan cycle | Fridge-photo pantry update | Multi-person households |
| Manual pantry log | Voice pantry update | Leftovers / batch meal-prep |
| PDF plan + shopping list, email digest | Recipe cards / dish images | Grocery delivery integration |

## Riskiest assumption

**That the user will actually create and follow the plan.** Every abandoned planning tool died here. Mitigation is built into the design: the plan arrives unprompted (Sunday cron), disruptions re-plan automatically instead of invalidating the week, and the North Star measures adherence — so drift is visible early, not discovered at quarter's end.
