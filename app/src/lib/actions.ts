'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma, applyReplan, dismissReplan as dbDismissReplan, createReplanProposal } from '@skilletfresh/db';
import { stubReplanOutput } from '@skilletfresh/db/stub';
import { signOut } from '@/auth';
import { requireProfile } from '@/lib/session';

async function ownedPlan(planId: string, profileId: string) {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || plan.profileId !== profileId) throw new Error('Plan not found');
  return plan;
}

export async function swapMeal(planId: string, dayIndex: number, alternateId: string) {
  const { profileId } = await requireProfile();
  const plan = await ownedPlan(planId, profileId);
  if (plan.status !== 'DRAFT') throw new Error('Plan is locked');

  const alternate = await prisma.planAlternate.findUnique({ where: { id: alternateId } });
  if (!alternate || alternate.planId !== plan.id) throw new Error('Alternate not found');

  await prisma.plannedMeal.update({
    where: { planId_dayIndex: { planId: plan.id, dayIndex } },
    data: { recipeId: alternate.recipeId, fitScore: alternate.fitScore, reason: alternate.reason },
  });
  revalidatePath('/plan');
  revalidatePath('/today');
}

export async function lockPlan(planId: string) {
  const { profileId } = await requireProfile();
  await ownedPlan(planId, profileId);
  await prisma.plan.update({ where: { id: planId }, data: { status: 'LOCKED' } });
  revalidatePath('/plan');
  redirect('/list');
}

export async function toggleItem(itemId: string) {
  const { profileId } = await requireProfile();
  const item = await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    include: { list: { include: { plan: true } } },
  });
  if (!item || item.list.plan.profileId !== profileId) throw new Error('Item not found');
  await prisma.shoppingItem.update({ where: { id: itemId }, data: { checked: !item.checked } });
  revalidatePath('/list');
}

export async function closeReceipt(listId: string, totalCents: number | null) {
  const { profileId } = await requireProfile();
  const list = await prisma.shoppingList.findUnique({ where: { id: listId }, include: { plan: true } });
  if (!list || list.plan.profileId !== profileId) throw new Error('List not found');
  await prisma.shoppingList.update({
    where: { id: listId },
    data: { receiptClosedAt: new Date(), receiptTotalCents: totalCents },
  });
  revalidatePath('/list');
}

export async function logTonight(plannedMealId: string, choice: 'cooked' | 'swapped' | 'skipped') {
  const { profileId } = await requireProfile();
  const meal = await prisma.plannedMeal.findUnique({
    where: { id: plannedMealId },
    include: { plan: { include: { meals: { include: { recipe: true } } } } },
  });
  if (!meal || meal.plan.profileId !== profileId) throw new Error('Meal not found');

  const dbChoice = choice.toUpperCase() as 'COOKED' | 'SWAPPED' | 'SKIPPED';
  await prisma.mealLog.upsert({
    where: { plannedMealId },
    update: { choice: dbChoice },
    create: { plannedMealId, profileId, choice: dbChoice },
  });

  if (choice !== 'cooked') {
    // a skip or swap triggers the agent re-plan, delivered as a diff
    const queued = await prisma.agentJob.findFirst({
      where: { type: 'REPLAN', profileId, status: { in: ['QUEUED', 'RUNNING'] } },
    });
    if (!queued) {
      await prisma.agentJob.create({
        data: {
          type: 'REPLAN',
          profileId,
          payload: { planId: meal.planId, dayIndex: meal.dayIndex, choice },
        },
      });
    }

    // Interim: the deterministic stub proposes the diff until the agent
    // worker (Phase 6) takes over AgentJob processing.
    const pending = await prisma.replanProposal.findFirst({
      where: { planId: meal.planId, status: 'PENDING' },
    });
    if (!pending) {
      const output = stubReplanOutput(
        meal.plan.meals.map((m) => ({ dayIndex: m.dayIndex, name: m.recipe.name })),
        meal.dayIndex,
      );
      if (output) await createReplanProposal(meal.planId, output);
    }
  }
  revalidatePath('/today');
}

export async function acceptReplan(proposalId: string) {
  const { profileId } = await requireProfile();
  const proposal = await prisma.replanProposal.findUnique({
    where: { id: proposalId },
    include: { plan: true },
  });
  if (!proposal || proposal.plan.profileId !== profileId) throw new Error('Proposal not found');
  await applyReplan(proposalId);
  revalidatePath('/today');
  revalidatePath('/plan');
}

export async function dismissReplan(proposalId: string) {
  const { profileId } = await requireProfile();
  const proposal = await prisma.replanProposal.findUnique({
    where: { id: proposalId },
    include: { plan: true },
  });
  if (!proposal || proposal.plan.profileId !== profileId) throw new Error('Proposal not found');
  await dbDismissReplan(proposalId);
  revalidatePath('/today');
}

export async function logout() {
  await signOut({ redirectTo: '/signin' });
}
