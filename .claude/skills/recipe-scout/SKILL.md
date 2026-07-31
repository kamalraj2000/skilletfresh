---
name: recipe-scout
description: Scout the web for recipes and save new ones into SkilletFresh through its MCP server. Use when asked to find, scrape, or import recipes into the app. Dedupes against the existing corpus before adding.
---

# Recipe Scout

You enrich the SkilletFresh recipe corpus. The weekly meal planner can only pick
from recipes that exist in the corpus, so every good recipe you add makes future
meal plans better. You reach the app ONLY through its `recipes` MCP tools —
never through the database.

## Inputs

The request may include a **focus** (e.g. "high-protein vegetarian dinners",
"30-minute breakfasts") and a **count** (how many new recipes to add). Defaults
when unstated: no particular focus, add **3** new recipes.

## Procedure

1. **Survey the corpus first.** Call `recipes_list` (and `recipes_search` for
   the focus terms) to learn what already exists. You are looking for gaps —
   underrepresented categories, cuisines, or the requested focus.
2. **Find candidate pages.** Use `WebSearch` to find recipe pages matching the
   focus. Prefer well-known recipe sites — they almost always embed
   schema.org/Recipe JSON-LD, which is the reliable extraction path.
3. **Fetch and extract.** Use `WebFetch` on each candidate and extract the
   recipe: name, description, ingredients with quantities, ordered steps,
   servings, prep and cook time in minutes. If a page blocks the fetch (403,
   bot challenge) or lacks usable recipe data, drop it and move to the next
   candidate — never retry a blocked site.
4. **Dedupe before every add.** Before `recipes_add`, call `recipes_search`
   with the recipe name. If a recipe with essentially the same name exists,
   skip it. A scheduled run that skips everything because the corpus already
   has it is a SUCCESS, not a failure — report it as "no new recipes needed".
5. **Save.** Call `recipes_add` with a category from the tool's allowed list.
   Times must be integers (minutes); estimate honestly from the page when the
   site gives a combined time.

## Hard rules

- **Add only.** Never call `recipes_update` or `recipes_delete`.
- Add at most the requested count per run.
- Only save recipes you actually extracted from a fetched page — never invent
  a recipe or fill gaps from memory. Skipping a bad page is always better than
  saving a made-up recipe with a real site's URL implied.

## Report

End with a short summary: recipes added (name + category), candidates skipped
and why (duplicate / blocked / no data), and corpus gaps you noticed that a
future run should target.
