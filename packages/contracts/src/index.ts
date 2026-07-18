// The planner handoff contract. Direct descendant of the prototype's
// app/src/data.ts shapes ("shapes here are the handoff contract") — the
// agent's save tools and the app's stub both validate against these.

import { z } from 'zod';

export const AISLES = ['Produce', 'Meat & fish', 'Pantry', 'Dairy & eggs', 'Frozen'] as const;

export const IngredientSchema = z.object({
  n: z.string().min(1),
  q: z.string(),
});

export const RecipeSpecSchema = z.object({
  name: z.string().min(3),
  timeMin: z.int().positive(),
  calories: z.int().multipleOf(10), // "roughly right beats accurately wrong" — never decimals
  proteinG: z.int().positive().optional(),
  portionLabel: z.string().optional(),
  ingredients: z.array(IngredientSchema),
  steps: z.array(z.string().min(1)),
  sourceUrl: z.url().optional(),
});

export const ScoredMealSchema = z.object({
  recipe: RecipeSpecSchema,
  fit: z.int().min(0).max(10),
  reason: z.string().min(5).max(140),
});

export const PlannedMealSpecSchema = ScoredMealSchema.extend({
  dayIndex: z.int().min(0).max(6), // 0 = Monday
});

export const ShoppingItemSpecSchema = z.object({
  aisle: z.enum(AISLES),
  name: z.string().min(1),
  qty: z.string(),
  /** true when the pantry already covers it — pre-checked in the list */
  checked: z.boolean(),
});

export const PlannerOutputSchema = z.object({
  weekStart: z.iso.date(), // Monday
  meals: z.array(PlannedMealSpecSchema).length(7),
  alternates: z.array(ScoredMealSchema).min(2).max(4),
  estGroceriesCents: z.int().positive(),
  shoppingItems: z.array(ShoppingItemSpecSchema).min(1),
});

export const ReplanEntrySpecSchema = ScoredMealSchema.extend({
  dayIndex: z.int().min(0).max(6),
  wasName: z.string(),
});

export const ReplanOutputSchema = z.object({
  entries: z.array(ReplanEntrySpecSchema).min(1).max(4),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type RecipeSpec = z.infer<typeof RecipeSpecSchema>;
export type ScoredMeal = z.infer<typeof ScoredMealSchema>;
export type PlannedMealSpec = z.infer<typeof PlannedMealSpecSchema>;
export type ShoppingItemSpec = z.infer<typeof ShoppingItemSpecSchema>;
export type PlannerOutput = z.infer<typeof PlannerOutputSchema>;
export type ReplanEntrySpec = z.infer<typeof ReplanEntrySpecSchema>;
export type ReplanOutput = z.infer<typeof ReplanOutputSchema>;

/** Deterministic warm-gradient fallback for recipes without designed photo colors. */
export function photoColors(name: string): { p1: string; p2: string } {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = 18 + (h % 70); // warm band: orange → olive
  return {
    p1: `hsl(${hue} 52% 66%)`,
    p2: `hsl(${hue} 55% 42%)`,
  };
}
