// E4 harness (assumption map): what share of live recipe pages parse cleanly
// via schema.org/Recipe JSON-LD? PRD kill criterion: < 80% clean → flip
// RECIPE_SOURCE=corpus (cached corpus becomes primary).
//
// Run: npx tsx scripts/harness-e4-parse.mts [url ...]

const DEFAULT_URLS = [
  'https://www.seriouseats.com/quick-fried-chicken-cutlets-piccata-style-recipe',
  'https://www.budgetbytes.com/garlic-butter-shrimp/',
  'https://www.skinnytaste.com/grilled-chicken-souvlaki-bowls/',
  'https://cooking.nytimes.com/recipes/1023341-sheet-pan-gochujang-chicken-and-roasted-vegetables',
  'https://www.bonappetit.com/recipe/tofu-and-green-bean-stir-fry',
  'https://www.delish.com/cooking/recipe-ideas/a19665918/best-baked-salmon-recipe/',
  'https://www.allrecipes.com/recipe/212721/indian-chicken-curry-murgh-kari/',
  'https://www.loveandlemons.com/chickpea-salad-sandwich/',
];

function extractJsonLdRecipe(html: string): { name?: string; recipeIngredient?: string[]; recipeInstructions?: unknown } | null {
  const blocks = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const nodes: unknown[] = Array.isArray(parsed) ? parsed : [parsed, ...(((parsed as Record<string, unknown>)['@graph'] as unknown[]) ?? [])];
      for (const node of nodes) {
        const type = (node as { '@type'?: string | string[] })['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('Recipe')) return node as never;
      }
    } catch {
      /* keep scanning */
    }
  }
  return null;
}

const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_URLS;
let clean = 0;
let fetched = 0;

for (const url of urls) {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) SkilletFresh/0.1 feasibility check' },
      signal: AbortSignal.timeout(20000),
      redirect: 'follow',
    });
    if (!res.ok) {
      console.log(`✗ HTTP ${res.status}  ${url}`);
      fetched++;
      continue;
    }
    fetched++;
    const recipe = extractJsonLdRecipe(await res.text());
    const ingredients = recipe?.recipeIngredient?.length ?? 0;
    if (recipe?.name && ingredients > 0 && recipe.recipeInstructions) {
      clean++;
      console.log(`✓ ${recipe.name} (${ingredients} ingredients)  ${new URL(url).hostname}`);
    } else {
      console.log(`✗ no clean JSON-LD Recipe  ${url}`);
    }
  } catch (e) {
    fetched++;
    console.log(`✗ ${(e as Error).message}  ${url}`);
  }
}

const rate = fetched ? Math.round((clean / fetched) * 100) : 0;
console.log(`\nClean-parse rate: ${clean}/${fetched} = ${rate}%  (E4 kill criterion: < 80% → set RECIPE_SOURCE=corpus)`);
