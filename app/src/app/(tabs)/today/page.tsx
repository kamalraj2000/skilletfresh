import { requireProfile } from '@/lib/session';
import { currentPlan, dayVMs, logsByDay } from '@/lib/queries';
import { dayLabel, mealVM, stripStatuses, todayIndexOf } from '@/lib/view';
import { TodayView } from '@/components/TodayView';
import { EmptyWeek } from '@/components/EmptyWeek';

export default async function TodayPage() {
  const { profileId } = await requireProfile();
  const plan = await currentPlan(profileId);
  if (!plan) return <EmptyWeek />;

  const todayIndex = todayIndexOf(plan.weekStart);
  const days = dayVMs(plan);
  const today = days.find((d) => d.dayIndex === todayIndex);
  if (!today) return <EmptyWeek />;

  const logs = logsByDay(plan);
  const todayMeal = plan.meals.find((m) => m.dayIndex === todayIndex);
  const pending = plan.replans[0];

  return (
    <TodayView
      today={today}
      todayIndex={todayIndex}
      todayLabel={dayLabel(plan.weekStart, todayIndex)}
      portionLabel={todayMeal?.recipe.portionLabel ?? null}
      statuses={stripStatuses(logs, todayIndex)}
      logged={logs.get(todayIndex) ?? null}
      proposal={
        pending
          ? {
              id: pending.id,
              entries: pending.entries.map((e) => ({
                dayIndex: e.dayIndex,
                was: e.wasName,
                meal: mealVM(e.newRecipe, e.fitScore, e.reason),
              })),
            }
          : null
      }
    />
  );
}
