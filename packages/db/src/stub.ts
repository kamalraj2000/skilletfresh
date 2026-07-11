// Deterministic planner stub: contract-valid output lifted from the design
// prototype's seed data (app/src/data.ts in the Vite app). Stands in for the
// Claude planner agent so the app works end-to-end before the agent ships.

import type { PlannerOutput, RecipeSpec, ReplanOutput } from '@skilletfresh/contracts';

const recipe = (
  name: string,
  timeMin: number,
  calories: number,
  extras: Partial<RecipeSpec> = {},
): RecipeSpec => ({
  name,
  timeMin,
  calories,
  ingredients: [],
  steps: ['Full recipe arrives with the planner agent.'],
  ...extras,
});

/** Designed gradient colors from the Claude Design handoff, keyed by recipe name. */
export const DESIGNED_PHOTO_COLORS: Record<string, [string, string]> = {
  'Skillet lemon chicken & orzo': ['#E8C878', '#C08F42'],
  'Ginger-scallion salmon bowls': ['#E8A48C', '#C4714F'],
  'Smoky chickpea & spinach skillet': ['#C8763F', '#96491E'],
  'Turkey larb lettuce cups': ['#A8BC7E', '#75904B'],
  'Sheet-pan harissa shrimp & peppers': ['#E08A5A', '#AC532A'],
  'Miso-butter steak & greens': ['#A57B5B', '#714A2E'],
  'White bean & sausage ragout': ['#D9A560', '#A67232'],
  'Chicken souvlaki bowls': ['#DFB36A', '#AC7F35'],
  'Seared tofu & green bean stir-fry': ['#9FB877', '#6C8B45'],
  'Pork tenderloin with apples': ['#D19A72', '#9C6440'],
};

const smokyChickpea = recipe('Smoky chickpea & spinach skillet', 30, 540, {
  portionLabel: 'Your portion · 1½ servings',
  ingredients: [
    { n: 'Olive oil', q: '1 tbsp' },
    { n: 'Yellow onion', q: '½, sliced' },
    { n: 'Garlic', q: '2 cloves' },
    { n: 'Smoked paprika', q: '1 tsp' },
    { n: 'Chickpeas', q: '1 can, drained' },
    { n: 'Baby spinach', q: '120 g' },
    { n: 'Feta', q: '40 g, crumbled' },
    { n: 'Lemon', q: '½, juiced' },
    { n: 'Greek yogurt', q: '2 tbsp, to serve' },
  ],
  steps: [
    'Warm the olive oil in your largest skillet over medium-high heat.',
    'Add the onion with a pinch of salt. Cook 4–5 minutes, until soft and golden at the edges.',
    'Stir in the garlic and smoked paprika. 30 seconds — just until it smells toasty.',
    'Add the chickpeas. Leave them untouched 3–4 minutes so they crisp a little.',
    'Pile in the spinach in two batches, folding until just wilted.',
    'Off the heat: lemon juice, feta, a spoon of yogurt on top. Plate it.',
  ],
});

export function stubPlannerOutput(weekStart: string): PlannerOutput {
  return {
    weekStart,
    meals: [
      { dayIndex: 0, recipe: recipe('Skillet lemon chicken & orzo', 25, 610), fit: 9, reason: 'High protein; uses the chicken already in your pantry' },
      { dayIndex: 1, recipe: recipe('Ginger-scallion salmon bowls', 20, 580), fit: 9, reason: 'Omega-rich; the rice cooks while the salmon roasts' },
      { dayIndex: 2, recipe: smokyChickpea, fit: 8, reason: 'Meat-free night; protein still lands in band' },
      { dayIndex: 3, recipe: recipe('Turkey larb lettuce cups', 25, 520), fit: 8, reason: "Lightest night; balances Friday's richer dinner" },
      { dayIndex: 4, recipe: recipe('Sheet-pan harissa shrimp & peppers', 20, 590), fit: 9, reason: 'Fastest cook of the week; highest-protein night' },
      { dayIndex: 5, recipe: recipe('Miso-butter steak & greens', 30, 680), fit: 8, reason: 'Weekend treat — still inside every band' },
      { dayIndex: 6, recipe: recipe('White bean & sausage ragout', 30, 640), fit: 9, reason: 'One pot; leftovers cover Monday lunch' },
    ],
    alternates: [
      { recipe: recipe('Chicken souvlaki bowls', 25, 560), fit: 9, reason: "Same protein band; reuses Monday's lemon and herbs" },
      { recipe: recipe('Seared tofu & green bean stir-fry', 20, 510), fit: 8, reason: "Keeps Thursday meat-free and the week's carbs in band" },
      { recipe: recipe('Pork tenderloin with apples', 30, 600), fit: 8, reason: 'Right at your 30-minute ceiling; protein in band' },
    ],
    estGroceriesCents: 8700,
    shoppingItems: [
      { aisle: 'Produce', name: 'Bell peppers', qty: '3', checked: false },
      { aisle: 'Produce', name: 'Baby spinach', qty: '320 g', checked: false },
      { aisle: 'Produce', name: 'Butter lettuce', qty: '1 head', checked: false },
      { aisle: 'Produce', name: 'Green beans', qty: '300 g', checked: false },
      { aisle: 'Produce', name: 'Scallions', qty: '2 bunches', checked: false },
      { aisle: 'Produce', name: 'Lemons', qty: '4', checked: true },
      { aisle: 'Produce', name: 'Yellow onions', qty: '2', checked: true },
      { aisle: 'Produce', name: 'Garlic', qty: '1 head', checked: true },
      { aisle: 'Meat & fish', name: 'Ground turkey', qty: '500 g', checked: false },
      { aisle: 'Meat & fish', name: 'Shrimp, peeled', qty: '600 g', checked: false },
      { aisle: 'Meat & fish', name: 'Sirloin steak', qty: '450 g', checked: false },
      { aisle: 'Meat & fish', name: 'Italian sausage', qty: '400 g', checked: false },
      { aisle: 'Meat & fish', name: 'Chicken thighs', qty: '1.2 kg', checked: true },
      { aisle: 'Meat & fish', name: 'Salmon fillets', qty: '700 g', checked: true },
      { aisle: 'Pantry', name: 'Chickpeas', qty: '2 cans', checked: false },
      { aisle: 'Pantry', name: 'White beans', qty: '2 cans', checked: false },
      { aisle: 'Pantry', name: 'Orzo', qty: '250 g', checked: false },
      { aisle: 'Pantry', name: 'Jasmine rice', qty: '500 g', checked: false },
      { aisle: 'Pantry', name: 'Harissa paste', qty: '1 jar', checked: false },
      { aisle: 'Pantry', name: 'Smoked paprika', qty: '1 tin', checked: false },
      { aisle: 'Dairy & eggs', name: 'Feta', qty: '200 g', checked: false },
      { aisle: 'Dairy & eggs', name: 'Greek yogurt', qty: '500 g', checked: false },
      { aisle: 'Dairy & eggs', name: 'Butter', qty: '250 g', checked: false },
      { aisle: 'Dairy & eggs', name: 'Miso paste', qty: '1 tub', checked: false },
      { aisle: 'Frozen', name: 'Edamame', qty: '400 g', checked: false },
    ],
  };
}

/** Replan issued after a skipped/swapped log — only these days change. */
export function stubReplanOutput(): ReplanOutput {
  return {
    entries: [
      {
        dayIndex: 3,
        wasName: 'Turkey larb lettuce cups',
        recipe: recipe('Chicken souvlaki bowls', 25, 560),
        fit: 9,
        reason: "Adds back tonight's missed protein",
      },
      {
        dayIndex: 4,
        wasName: 'Sheet-pan harissa shrimp & peppers',
        recipe: recipe('Pork tenderloin with apples', 30, 600),
        fit: 8,
        reason: 'Higher-protein swap keeps the week in band',
      },
    ],
  };
}
