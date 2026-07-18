import { requireProfile } from '@/lib/session';
import { currentPlan, dayVMs } from '@/lib/queries';
import { todayIndexOf } from '@/lib/view';
import { RecipeDetail } from '@/components/TodayView';
import { EmptyWeek } from '@/components/EmptyWeek';

export default async function RecipePage() {
  const { profileId } = await requireProfile();
  const plan = await currentPlan(profileId);
  if (!plan) return <EmptyWeek />;

  const todayIndex = todayIndexOf(plan.weekStart);
  const meal = dayVMs(plan).find((d) => d.dayIndex === todayIndex);
  const row = plan.meals.find((m) => m.dayIndex === todayIndex);
  if (!meal || !row) return <EmptyWeek />;

  const ingredients = (row.recipe.ingredients as { n: string; q: string }[]) ?? [];
  return (
    <RecipeDetail
      meal={meal}
      recipe={{
        portion: row.recipe.portionLabel ?? '',
        ingredientsLabel: row.recipe.portionLabel
          ? `Ingredients · your portion (${row.recipe.portionLabel.split('· ')[1] ?? ''})`
          : 'Ingredients',
        ingredients,
        steps: row.recipe.steps,
      }}
    />
  );
}
