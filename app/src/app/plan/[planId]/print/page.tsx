// Print-friendly week plan + shopping list. Reached two ways:
// - a signed-in user (their own plans only)
// - the agent's PDF renderer, with ?token=<PRINT_TOKEN> (no session)
import { notFound } from 'next/navigation';
import { prisma } from '@skilletfresh/db';
import { auth } from '@/auth';
import { DAY_NAMES, formatCents, weekLabel } from '@/lib/view';
import { AISLES } from '@skilletfresh/contracts';

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { planId } = await params;
  const { token } = await searchParams;

  const tokenOk = !!process.env.PRINT_TOKEN && token === process.env.PRINT_TOKEN;
  const session = tokenOk ? null : await auth();
  if (!tokenOk && !session?.profileId) notFound();

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      profile: true,
      meals: { include: { recipe: true }, orderBy: { dayIndex: 'asc' } },
      shoppingList: { include: { items: { orderBy: { sortOrder: 'asc' } } } },
    },
  });
  if (!plan) notFound();
  if (!tokenOk && plan.profileId !== session?.profileId) notFound();

  const items = plan.shoppingList?.items ?? [];

  return (
    <div style={{ fontFamily: 'var(--font-ui)', color: 'var(--ink)', padding: '28px 32px', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="brand" style={{ fontSize: 22 }}>
          Skillet<em>Fresh</em>
        </span>
        <span style={{ font: '400 13px var(--font-data)', color: 'var(--ink-soft)' }}>
          {plan.profile.displayName} · {weekLabel(plan.weekStart)}
        </span>
      </div>

      <h1 style={{ font: '700 20px var(--font-ui)', margin: '10px 0 12px' }}>This week&rsquo;s dinners</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <tbody>
          {plan.meals.map((m) => (
            <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '7px 10px 7px 0', font: '700 12px var(--font-data)', color: 'var(--ink-faint)', width: 90, verticalAlign: 'top' }}>
                {DAY_NAMES[m.dayIndex].toUpperCase()}
              </td>
              <td style={{ padding: '7px 0' }}>
                <div style={{ font: '600 14px var(--font-ui)' }}>{m.recipe.name}</div>
                <div style={{ font: '400 12px var(--font-ui)', color: 'var(--ink-soft)' }}>
                  {m.recipe.timeMin} min · ≈{m.recipe.calories} cal
                  {m.recipe.proteinG ? ` · ${m.recipe.proteinG}g protein` : ''} · fit {m.fitScore}/10 — {m.reason}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ font: '700 17px var(--font-ui)', margin: '0 0 4px' }}>
        Shopping list <span style={{ font: '400 13px var(--font-data)', color: 'var(--ink-soft)' }}>· est. {formatCents(plan.estGroceriesCents)}</span>
      </h2>
      <div style={{ columns: 2, columnGap: 28 }}>
        {AISLES.map((aisle) => {
          const aisleItems = items.filter((i) => i.aisle === aisle);
          if (!aisleItems.length) return null;
          return (
            <div key={aisle} style={{ breakInside: 'avoid', marginBottom: 14 }}>
              <div style={{ font: '700 11px var(--font-data)', color: 'var(--ink-faint)', letterSpacing: 0.6, textTransform: 'uppercase', margin: '6px 0 4px' }}>
                {aisle}
              </div>
              {aisleItems.map((i) => (
                <div key={i.id} style={{ font: '400 13px var(--font-ui)', padding: '2px 0', color: i.checked ? 'var(--ink-mute)' : 'var(--ink)' }}>
                  ▢ {i.name} — {i.qty}
                  {i.checked && !i.qty.toLowerCase().includes('have') ? ' (have)' : ''}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
