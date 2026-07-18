// Read-side tools: pantry & constraints (the PRD's custom source), the
// cached recipe corpus, live recipe fetch (schema.org JSON-LD first), and
// USDA FoodData Central.

import { z } from 'zod';
import { tool } from '@anthropic-ai/claude-agent-sdk';
import { prisma } from '@skilletfresh/db';
import { FDC_API_KEY } from '../env';

const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 1) }],
});
const errorText = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
});

export function constraintTools(profileId: string) {
  const getConstraints = tool(
    'get_constraints',
    "The profile's goals and hard limits: protein target, time ceiling, skill level, variety preference, plan shape, diet tags, budget (display-only).",
    {},
    async () => {
      const p = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
      return text({
        displayName: p.displayName,
        proteinTargetGPerDay: p.proteinTargetG,
        timeCeilingMin: p.timeCeilingMin,
        skillLevel: `${p.skillLevel} of 5`,
        varietyPreference: `${p.varietyPreference} of 5`,
        planShape: p.planShape,
        dietTags: p.dietTags,
        weeklyBudgetUsdDisplayOnly: p.budgetCents / 100,
      });
    },
  );

  const getPantry = tool(
    'get_pantry',
    'Staples the household already has. Shopping items covered by the pantry must be emitted with checked=true.',
    {},
    async () => {
      const items = await prisma.pantryItem.findMany({ where: { profileId } });
      return text(items.map((i) => ({ name: i.name, qty: i.qty ?? undefined })));
    },
  );

  return [getConstraints, getPantry];
}

export const searchRecipeCorpus = tool(
  'search_recipe_corpus',
  'Search the cached recipe corpus (name substring, optional max cook time). Prefer this before fetching live pages.',
  {
    query: z.string().optional().describe('substring of the recipe name'),
    maxTimeMin: z.number().int().optional(),
  },
  async ({ query, maxTimeMin }) => {
    const recipes = await prisma.recipe.findMany({
      where: {
        ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
        ...(maxTimeMin ? { timeMin: { lte: maxTimeMin } } : {}),
      },
      take: 12,
      orderBy: { name: 'asc' },
    });
    return text(
      recipes.map((r) => ({
        name: r.name,
        timeMin: r.timeMin,
        calories: r.calories,
        proteinG: r.proteinG ?? undefined,
        ingredients: r.ingredients,
        steps: r.steps,
        sourceUrl: r.sourceUrl ?? undefined,
      })),
    );
  },
);

interface JsonLdRecipe {
  name?: string;
  totalTime?: string;
  recipeIngredient?: string[];
  recipeInstructions?: unknown;
  nutrition?: Record<string, string>;
}

function extractJsonLdRecipe(html: string): JsonLdRecipe | null {
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const nodes: unknown[] = Array.isArray(parsed) ? parsed : [parsed, ...((parsed['@graph'] as unknown[]) ?? [])];
      for (const node of nodes) {
        const type = (node as { '@type'?: string | string[] })['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.includes('Recipe')) return node as JsonLdRecipe;
      }
    } catch {
      // malformed block — keep scanning
    }
  }
  return null;
}

function instructionsToSteps(instructions: unknown): string[] {
  if (typeof instructions === 'string') return instructions.split(/\n+/).filter(Boolean);
  if (Array.isArray(instructions)) {
    return instructions
      .flatMap((step) => {
        if (typeof step === 'string') return [step];
        const s = step as { text?: string; itemListElement?: { text?: string }[] };
        if (s.text) return [s.text];
        if (s.itemListElement) return s.itemListElement.map((e) => e.text ?? '');
        return [];
      })
      .filter(Boolean);
  }
  return [];
}

export const fetchRecipe = tool(
  'fetch_recipe',
  'Fetch a recipe page and parse its schema.org/Recipe JSON-LD. The parsed recipe is cached into the corpus. Falls back to raw page text when no JSON-LD exists (parse it yourself, but prefer JSON-LD sources).',
  { url: z.string().url() },
  async ({ url }) => {
    let html: string;
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': 'SkilletFresh/0.1 (personal meal planner)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return errorText(`Fetch failed: HTTP ${res.status}`);
      html = await res.text();
    } catch (e) {
      return errorText(`Fetch failed: ${(e as Error).message}`);
    }

    const ld = extractJsonLdRecipe(html);
    if (!ld?.name) {
      const plain = html
        .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 6000);
      return text({ parsedVia: 'none', note: 'No JSON-LD Recipe found; raw text follows.', pageText: plain });
    }

    const steps = instructionsToSteps(ld.recipeInstructions);
    const parsed = {
      parsedVia: 'jsonld',
      name: ld.name,
      totalTime: ld.totalTime,
      ingredients: ld.recipeIngredient ?? [],
      steps,
      nutrition: ld.nutrition,
      sourceUrl: url,
    };
    return text(parsed);
  },
);

// FDC responses are cached in-process; the free tier is 1,000 req/hr and
// harness runs would burn it without this.
const fdcCache = new Map<string, unknown>();

async function fdc(path: string): Promise<unknown> {
  if (fdcCache.has(path)) return fdcCache.get(path);
  const res = await fetch(`https://api.nal.usda.gov/fdc/v1${path}${path.includes('?') ? '&' : '?'}api_key=${FDC_API_KEY}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`FDC HTTP ${res.status}`);
  const json = await res.json();
  fdcCache.set(path, json);
  return json;
}

export const fdcSearchFoods = tool(
  'fdc_search_foods',
  'Search USDA FoodData Central for an ingredient. Returns the top 5 matches (fdcId, description, dataType).',
  { query: z.string() },
  async ({ query }) => {
    try {
      const json = (await fdc(`/foods/search?query=${encodeURIComponent(query)}&pageSize=5`)) as {
        foods?: { fdcId: number; description: string; dataType: string }[];
      };
      return text(
        (json.foods ?? []).map((f) => ({ fdcId: f.fdcId, description: f.description, dataType: f.dataType })),
      );
    } catch (e) {
      return errorText(`FDC search failed: ${(e as Error).message}`);
    }
  },
);

export const fdcGetNutrients = tool(
  'fdc_get_nutrients',
  'Macros per 100 g for an FDC food id: kcal, protein, carbs, fat.',
  { fdcId: z.number().int() },
  async ({ fdcId }) => {
    try {
      const json = (await fdc(`/food/${fdcId}?format=abridged`)) as {
        description?: string;
        foodNutrients?: { nutrient?: { name?: string; unitName?: string }; name?: string; amount?: number; unitName?: string }[];
      };
      const wanted = ['Energy', 'Protein', 'Carbohydrate, by difference', 'Total lipid (fat)'];
      const out: Record<string, string> = {};
      for (const n of json.foodNutrients ?? []) {
        const name = n.nutrient?.name ?? n.name ?? '';
        if (wanted.includes(name) && n.amount !== undefined) {
          out[name] = `${n.amount} ${n.nutrient?.unitName ?? n.unitName ?? ''}`;
        }
      }
      return text({ description: json.description, per100g: out });
    } catch (e) {
      return errorText(`FDC lookup failed: ${(e as Error).message}`);
    }
  },
);
