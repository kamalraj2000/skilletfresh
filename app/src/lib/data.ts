// Seed data for the core weekly loop, lifted from the Claude Design
// prototype "SkilletFresh Weekly Loop.dc.html". In the real build this
// comes from the planner agent; shapes here are the handoff contract.

export interface Meal {
  name: string;
  time: number;
  cal: number;
  fit: number;
  reason: string;
  /** warm gradient placeholder standing in for the recipe photo */
  p1: string;
  p2: string;
}

export interface DayPlan extends Meal {
  day: string;
}

export const WEEK_LABEL = 'Mon Jul 13 – Sun Jul 19';
export const EST_GROCERIES = '$87';
export const TODAY_INDEX = 2; // Wednesday
export const TODAY_LABEL = 'Wednesday, July 15';

export const initialDays: DayPlan[] = [
  { day: 'Monday', name: 'Skillet lemon chicken & orzo', time: 25, cal: 610, fit: 9, reason: 'High protein; uses the chicken already in your pantry', p1: '#E8C878', p2: '#C08F42' },
  { day: 'Tuesday', name: 'Ginger-scallion salmon bowls', time: 20, cal: 580, fit: 9, reason: 'Omega-rich; the rice cooks while the salmon roasts', p1: '#E8A48C', p2: '#C4714F' },
  { day: 'Wednesday', name: 'Smoky chickpea & spinach skillet', time: 30, cal: 540, fit: 8, reason: 'Meat-free night; protein still lands in band', p1: '#C8763F', p2: '#96491E' },
  { day: 'Thursday', name: 'Turkey larb lettuce cups', time: 25, cal: 520, fit: 8, reason: "Lightest night; balances Friday's richer dinner", p1: '#A8BC7E', p2: '#75904B' },
  { day: 'Friday', name: 'Sheet-pan harissa shrimp & peppers', time: 20, cal: 590, fit: 9, reason: 'Fastest cook of the week; highest-protein night', p1: '#E08A5A', p2: '#AC532A' },
  { day: 'Saturday', name: 'Miso-butter steak & greens', time: 30, cal: 680, fit: 8, reason: 'Weekend treat — still inside every band', p1: '#A57B5B', p2: '#714A2E' },
  { day: 'Sunday', name: 'White bean & sausage ragout', time: 30, cal: 640, fit: 9, reason: 'One pot; leftovers cover Monday lunch', p1: '#D9A560', p2: '#A67232' },
];

export const alternates: Meal[] = [
  { name: 'Chicken souvlaki bowls', time: 25, cal: 560, fit: 9, reason: "Same protein band; reuses Monday's lemon and herbs", p1: '#DFB36A', p2: '#AC7F35' },
  { name: 'Seared tofu & green bean stir-fry', time: 20, cal: 510, fit: 8, reason: "Keeps Thursday meat-free and the week's carbs in band", p1: '#9FB877', p2: '#6C8B45' },
  { name: 'Pork tenderloin with apples', time: 30, cal: 600, fit: 8, reason: 'Right at your 30-minute ceiling; protein in band', p1: '#D19A72', p2: '#9C6440' },
];

/** re-plan issued after a skipped/swapped log — only these days change */
export const replanDiff = [
  { dayIndex: 3, was: 'Turkey larb lettuce cups', meal: { name: 'Chicken souvlaki bowls', time: 25, cal: 560, fit: 9, reason: "Adds back tonight's missed protein", p1: '#DFB36A', p2: '#AC7F35' } },
  { dayIndex: 4, was: 'Sheet-pan harissa shrimp & peppers', meal: { name: 'Pork tenderloin with apples', time: 30, cal: 600, fit: 8, reason: 'Higher-protein swap keeps the week in band', p1: '#D19A72', p2: '#9C6440' } },
];

export interface ShoppingItem {
  id: string;
  name: string;
  qty: string;
  /** checked before the session opens (design state 1d: 5 in the cart) */
  checked: boolean;
}

export interface Aisle {
  name: string;
  items: ShoppingItem[];
}

const item = (name: string, qty: string, checked = false): ShoppingItem => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  qty,
  checked,
});

export const initialAisles: Aisle[] = [
  {
    name: 'Produce',
    items: [
      item('Bell peppers', '3'),
      item('Baby spinach', '320 g'),
      item('Butter lettuce', '1 head'),
      item('Green beans', '300 g'),
      item('Scallions', '2 bunches'),
      item('Lemons', '4', true),
      item('Yellow onions', '2', true),
      item('Garlic', '1 head', true),
    ],
  },
  {
    name: 'Meat & fish',
    items: [
      item('Ground turkey', '500 g'),
      item('Shrimp, peeled', '600 g'),
      item('Sirloin steak', '450 g'),
      item('Italian sausage', '400 g'),
      item('Chicken thighs', '1.2 kg', true),
      item('Salmon fillets', '700 g', true),
    ],
  },
  {
    name: 'Pantry',
    items: [
      item('Chickpeas', '2 cans'),
      item('White beans', '2 cans'),
      item('Orzo', '250 g'),
      item('Jasmine rice', '500 g'),
      item('Harissa paste', '1 jar'),
      item('Smoked paprika', '1 tin'),
    ],
  },
  {
    name: 'Dairy & eggs',
    items: [
      item('Feta', '200 g'),
      item('Greek yogurt', '500 g'),
      item('Butter', '250 g'),
      item('Miso paste', '1 tub'),
    ],
  },
  {
    name: 'Frozen',
    items: [item('Edamame', '400 g')],
  },
];

export const todayRecipe = {
  portion: 'Your portion · 1½ servings',
  ingredientsLabel: 'Ingredients · your portion (1½ servings)',
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
};

export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
