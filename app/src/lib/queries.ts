import { prisma } from '@skilletfresh/db';
import { AISLES } from '@skilletfresh/contracts';
import {
  type AisleVM,
  type DayPlanVM,
  type LogChoice,
  DAY_NAMES,
  mealVM,
} from '@/lib/view';

/** The profile's most recent plan with everything the three tabs render. */
export async function currentPlan(profileId: string) {
  return prisma.plan.findFirst({
    where: { profileId },
    orderBy: { weekStart: 'desc' },
    include: {
      meals: { include: { recipe: true, log: true }, orderBy: { dayIndex: 'asc' } },
      alternates: { include: { recipe: true } },
      shoppingList: { include: { items: { orderBy: { sortOrder: 'asc' } } } },
      replans: {
        where: { status: 'PENDING' },
        include: { entries: { include: { newRecipe: true }, orderBy: { dayIndex: 'asc' } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export type CurrentPlan = NonNullable<Awaited<ReturnType<typeof currentPlan>>>;

export function dayVMs(plan: CurrentPlan): DayPlanVM[] {
  return plan.meals.map((m) => ({
    ...mealVM(m.recipe, m.fitScore, m.reason),
    day: DAY_NAMES[m.dayIndex],
    dayIndex: m.dayIndex,
    plannedMealId: m.id,
  }));
}

export function aisleVMs(plan: CurrentPlan): AisleVM[] {
  const items = plan.shoppingList?.items ?? [];
  return AISLES.map((name) => ({
    name,
    items: items
      .filter((i) => i.aisle === name)
      .map((i) => ({ id: i.id, name: i.name, qty: i.qty, checked: i.checked })),
  })).filter((a) => a.items.length > 0);
}

export function logsByDay(plan: CurrentPlan): Map<number, LogChoice> {
  const map = new Map<number, LogChoice>();
  for (const m of plan.meals) {
    if (m.log) map.set(m.dayIndex, m.log.choice.toLowerCase() as LogChoice);
  }
  return map;
}
