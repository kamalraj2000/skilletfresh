import { prisma } from '@skilletfresh/db';
import { requireProfile } from '@/lib/session';
import { currentPlan, dayVMs } from '@/lib/queries';
import { formatCents, mealVM, weekLabel } from '@/lib/view';
import { SundayReview } from '@/components/SundayReview';
import { EmptyWeek } from '@/components/EmptyWeek';

export default async function PlanPage() {
  const { profileId } = await requireProfile();
  const [plan, profile] = await Promise.all([
    currentPlan(profileId),
    prisma.profile.findUniqueOrThrow({ where: { id: profileId } }),
  ]);
  if (!plan) return <EmptyWeek />;

  const alternates = plan.alternates.map((a) => ({
    ...mealVM(a.recipe, a.fitScore, a.reason),
    id: a.id,
  }));

  return (
    <SundayReview
      planId={plan.id}
      weekLabel={weekLabel(plan.weekStart)}
      estGroceries={formatCents(plan.estGroceriesCents)}
      days={dayVMs(plan)}
      alternates={alternates}
      locked={plan.status === 'LOCKED'}
      avatarInitial={profile.displayName[0] ?? '?'}
    />
  );
}
