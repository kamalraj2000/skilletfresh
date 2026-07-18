// View models: the serialized shapes the client components render. Direct
// descendants of the prototype's data.ts interfaces, now built from Prisma
// rows server-side.

import { photoColors } from '@skilletfresh/contracts';

export interface MealVM {
  name: string;
  time: number;
  cal: number;
  fit: number;
  reason: string;
  p1: string;
  p2: string;
}

export interface DayPlanVM extends MealVM {
  day: string;
  dayIndex: number;
  plannedMealId: string;
}

export interface AlternateVM extends MealVM {
  id: string;
}

export interface ShoppingItemVM {
  id: string;
  name: string;
  qty: string;
  checked: boolean;
}

export interface AisleVM {
  name: string;
  items: ShoppingItemVM[];
}

export interface RecipeDetailVM {
  portion: string;
  ingredientsLabel: string;
  ingredients: { n: string; q: string }[];
  steps: string[];
}

export interface ReplanEntryVM {
  dayIndex: number;
  was: string;
  meal: MealVM;
}

export type DayStatus = 'band' | 'today' | 'skip' | 'up';
export type LogChoice = 'cooked' | 'swapped' | 'skipped';

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface RecipeRow {
  name: string;
  timeMin: number;
  calories: number;
  photoColor1: string | null;
  photoColor2: string | null;
}

export function mealVM(recipe: RecipeRow, fitScore: number, reason: string): MealVM {
  const fallback = photoColors(recipe.name);
  return {
    name: recipe.name,
    time: recipe.timeMin,
    cal: recipe.calories,
    fit: fitScore,
    reason,
    p1: recipe.photoColor1 ?? fallback.p1,
    p2: recipe.photoColor2 ?? fallback.p2,
  };
}

/** "Mon Jul 13 – Sun Jul 19" from the plan's weekStart. */
export function weekLabel(weekStart: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const end = new Date(weekStart.getTime() + 6 * 86400000);
  return `Mon ${fmt(weekStart)} – Sun ${fmt(end)}`;
}

/** "Wednesday, July 15" for the given day of the plan week. */
export function dayLabel(weekStart: Date, dayIndex: number): string {
  const d = new Date(weekStart.getTime() + dayIndex * 86400000);
  return `${DAY_NAMES[dayIndex]}, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`;
}

/** Index of local-today within the plan week, clamped to 0..6. */
export function todayIndexOf(weekStart: Date, now = new Date()): number {
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(
    weekStart.getUTCFullYear(),
    weekStart.getUTCMonth(),
    weekStart.getUTCDate(),
  );
  const diff = Math.floor((local.getTime() - start.getTime()) / 86400000);
  return Math.min(6, Math.max(0, diff));
}

export function formatCents(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

/** Week-strip dots derived from what's actually been logged. */
export function stripStatuses(
  logsByDay: Map<number, LogChoice>,
  todayIndex: number,
): DayStatus[] {
  return DAY_LETTERS.map((_, i) => {
    const log = logsByDay.get(i);
    if (i === todayIndex) return log ? (log === 'cooked' ? 'band' : 'skip') : 'today';
    if (log) return log === 'cooked' ? 'band' : 'skip';
    return 'up';
  });
}
