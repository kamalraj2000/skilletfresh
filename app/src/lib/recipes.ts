import { prisma } from "@skilletfresh/db";
import { randomUUID } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
  "drink",
  "appetizer",
  "side",
  "soup",
  "salad",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  category: Category;
  ingredients: Ingredient[];
  instructions: string[];
  servings: number;
  prep_time_minutes: number;
  cook_time_minutes: number;
  created_at: string;
  updated_at: string;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

type DbIngredient = { n: string; q: string };

function toRecipe(row: {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  ingredients: unknown;
  steps: string[];
  servings: number | null;
  prepTimeMin: number | null;
  timeMin: number;
  createdAt: Date;
  updatedAt: Date;
}): Recipe {
  const dbIngredients = row.ingredients as DbIngredient[];
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    category: (row.category ?? "other") as Category,
    ingredients: dbIngredients.map((i) => ({ name: i.n, quantity: i.q })),
    instructions: row.steps,
    servings: row.servings ?? 1,
    prep_time_minutes: row.prepTimeMin ?? 0,
    cook_time_minutes: row.timeMin - (row.prepTimeMin ?? 0),
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

const RECIPE_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  ingredients: true,
  steps: true,
  servings: true,
  prepTimeMin: true,
  timeMin: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── CRUD operations ─────────────────────────────────────────────────────────

export async function listRecipes(opts: {
  limit: number;
  offset: number;
  category?: Category;
}) {
  const where = opts.category ? { category: opts.category } : {};
  const [total, items] = await Promise.all([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      select: RECIPE_SELECT,
      orderBy: { createdAt: "desc" },
      take: opts.limit,
      skip: opts.offset,
    }),
  ]);
  const has_more = total > opts.offset + items.length;
  return {
    total,
    items: items.map(toRecipe),
    has_more,
    next_offset: has_more ? opts.offset + items.length : undefined,
  };
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const row = await prisma.recipe.findUnique({ where: { id }, select: RECIPE_SELECT });
  return row ? toRecipe(row) : undefined;
}

export async function searchRecipes(opts: {
  query: string;
  search_by: "name" | "ingredient" | "both";
  limit: number;
  offset: number;
}) {
  const q = opts.query.toLowerCase();

  // Postgres full-text isn't needed here; keep it simple with contains.
  const nameFilter = {
    OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
    ],
  };

  // Ingredient search requires a raw contains on the JSON cast.
  // We pull all rows and filter in JS for the ingredient case.
  if (opts.search_by === "ingredient" || opts.search_by === "both") {
    const where = opts.search_by === "both" ? nameFilter : {};
    const all = await prisma.recipe.findMany({ where, select: RECIPE_SELECT, orderBy: { createdAt: "desc" } });
    const filtered = all.filter((row) => {
      const byIngredient = (row.ingredients as DbIngredient[]).some((i) =>
        i.n.toLowerCase().includes(q)
      );
      if (opts.search_by === "ingredient") return byIngredient;
      const byName =
        row.name.toLowerCase().includes(q) ||
        (row.description ?? "").toLowerCase().includes(q);
      return byName || byIngredient;
    });
    const total = filtered.length;
    const items = filtered.slice(opts.offset, opts.offset + opts.limit);
    const has_more = total > opts.offset + items.length;
    return { total, items: items.map(toRecipe), has_more, next_offset: has_more ? opts.offset + items.length : undefined };
  }

  const [total, items] = await Promise.all([
    prisma.recipe.count({ where: nameFilter }),
    prisma.recipe.findMany({
      where: nameFilter,
      select: RECIPE_SELECT,
      orderBy: { createdAt: "desc" },
      take: opts.limit,
      skip: opts.offset,
    }),
  ]);
  const has_more = total > opts.offset + items.length;
  return { total, items: items.map(toRecipe), has_more, next_offset: has_more ? opts.offset + items.length : undefined };
}

export async function addRecipe(
  input: Omit<Recipe, "id" | "created_at" | "updated_at">
): Promise<Recipe> {
  const row = await prisma.recipe.create({
    data: {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      category: input.category,
      ingredients: input.ingredients.map((i) => ({ n: i.name, q: i.quantity })),
      steps: input.instructions,
      servings: input.servings,
      prepTimeMin: input.prep_time_minutes,
      timeMin: input.prep_time_minutes + input.cook_time_minutes,
      calories: 0,
    },
    select: RECIPE_SELECT,
  });
  return toRecipe(row);
}

export async function updateRecipe(
  id: string,
  updates: Partial<Omit<Recipe, "id" | "created_at" | "updated_at">>
): Promise<Recipe | undefined> {
  try {
    const row = await prisma.recipe.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.servings !== undefined && { servings: updates.servings }),
        ...(updates.instructions !== undefined && { steps: updates.instructions }),
        ...(updates.ingredients !== undefined && {
          ingredients: updates.ingredients.map((i) => ({ n: i.name, q: i.quantity })),
        }),
        ...((updates.prep_time_minutes !== undefined || updates.cook_time_minutes !== undefined) && (() => {
          const current_prep = updates.prep_time_minutes;
          const current_cook = updates.cook_time_minutes;
          return {
            ...(current_prep !== undefined && { prepTimeMin: current_prep }),
            ...(current_cook !== undefined || current_prep !== undefined
              ? { timeMin: (current_prep ?? 0) + (current_cook ?? 0) }
              : {}),
          };
        })()),
      },
      select: RECIPE_SELECT,
    });
    return toRecipe(row);
  } catch {
    return undefined;
  }
}

export async function deleteRecipe(id: string): Promise<boolean> {
  try {
    await prisma.recipe.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
