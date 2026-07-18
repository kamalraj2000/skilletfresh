import { requireProfile } from '@/lib/session';
import { aisleVMs, currentPlan } from '@/lib/queries';
import { formatCents } from '@/lib/view';
import { ShoppingList } from '@/components/ShoppingList';
import { EmptyWeek } from '@/components/EmptyWeek';

export default async function ListPage() {
  const { profileId } = await requireProfile();
  const plan = await currentPlan(profileId);
  if (!plan?.shoppingList) return <EmptyWeek />;

  return (
    <ShoppingList
      listId={plan.shoppingList.id}
      estGroceries={formatCents(plan.estGroceriesCents)}
      aisles={aisleVMs(plan)}
      receiptDone={plan.shoppingList.receiptClosedAt !== null}
    />
  );
}
