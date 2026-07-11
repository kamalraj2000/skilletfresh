// The single write path for planner output. Both the deterministic stub and
// the Claude agent's save tools funnel through these functions, so the
// handoff contract is enforced in exactly one place.

import type { PlannerOutput, RecipeSpec, ReplanOutput } from '@skilletfresh/contracts';
import { PlannerOutputSchema, ReplanOutputSchema } from '@skilletfresh/contracts';
import { prisma } from './client';
import type { PrismaClient } from '../generated/prisma/client';

type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

async function upsertRecipe(tx: Tx, spec: RecipeSpec, parsedVia: 'SEED' | 'JSONLD' | 'LLM' = 'LLM') {
  const existing = spec.sourceUrl
    ? await tx.recipe.findUnique({ where: { sourceUrl: spec.sourceUrl } })
    : await tx.recipe.findFirst({ where: { name: spec.name } });
  if (existing) return existing;
  return tx.recipe.create({
    data: {
      name: spec.name,
      timeMin: spec.timeMin,
      calories: spec.calories,
      proteinG: spec.proteinG,
      portionLabel: spec.portionLabel,
      ingredients: spec.ingredients,
      steps: spec.steps,
      sourceUrl: spec.sourceUrl,
      parsedVia,
    },
  });
}

/** Create or replace the plan for (profileId, weekStart). Returns the plan id. */
export async function applyPlannerOutput(profileId: string, raw: unknown): Promise<string> {
  const output: PlannerOutput = PlannerOutputSchema.parse(raw);
  const weekStart = new Date(`${output.weekStart}T00:00:00.000Z`);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.plan.findUnique({
      where: { profileId_weekStart: { profileId, weekStart } },
    });
    if (existing) await tx.plan.delete({ where: { id: existing.id } });

    const plan = await tx.plan.create({
      data: { profileId, weekStart, estGroceriesCents: output.estGroceriesCents },
    });

    for (const meal of output.meals) {
      const recipe = await upsertRecipe(tx, meal.recipe);
      await tx.plannedMeal.create({
        data: {
          planId: plan.id,
          dayIndex: meal.dayIndex,
          recipeId: recipe.id,
          fitScore: meal.fit,
          reason: meal.reason,
        },
      });
    }

    for (const alt of output.alternates) {
      const recipe = await upsertRecipe(tx, alt.recipe);
      await tx.planAlternate.create({
        data: { planId: plan.id, recipeId: recipe.id, fitScore: alt.fit, reason: alt.reason },
      });
    }

    await tx.shoppingList.create({
      data: {
        planId: plan.id,
        items: {
          create: output.shoppingItems.map((item, i) => ({
            aisle: item.aisle,
            name: item.name,
            qty: item.qty,
            checked: item.checked,
            sortOrder: i,
          })),
        },
      },
    });

    return plan.id;
  });
}

/** Store an agent-proposed diff as PENDING. The user's tap commits it. */
export async function createReplanProposal(planId: string, raw: unknown): Promise<string> {
  const output: ReplanOutput = ReplanOutputSchema.parse(raw);

  return prisma.$transaction(async (tx) => {
    const proposal = await tx.replanProposal.create({ data: { planId } });
    for (const entry of output.entries) {
      const recipe = await upsertRecipe(tx, entry.recipe);
      await tx.replanEntry.create({
        data: {
          proposalId: proposal.id,
          dayIndex: entry.dayIndex,
          wasName: entry.wasName,
          newRecipeId: recipe.id,
          fitScore: entry.fit,
          reason: entry.reason,
        },
      });
    }
    return proposal.id;
  });
}

/** Apply an accepted proposal to its plan's meals, transactionally. */
export async function applyReplan(proposalId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const proposal = await tx.replanProposal.findUniqueOrThrow({
      where: { id: proposalId },
      include: { entries: true },
    });
    if (proposal.status !== 'PENDING') throw new Error(`Proposal ${proposalId} is ${proposal.status}`);

    for (const entry of proposal.entries) {
      await tx.plannedMeal.update({
        where: { planId_dayIndex: { planId: proposal.planId, dayIndex: entry.dayIndex } },
        data: { recipeId: entry.newRecipeId, fitScore: entry.fitScore, reason: entry.reason },
      });
    }
    await tx.replanProposal.update({ where: { id: proposalId }, data: { status: 'ACCEPTED' } });
  });
}

export async function dismissReplan(proposalId: string): Promise<void> {
  await prisma.replanProposal.update({ where: { id: proposalId }, data: { status: 'DISMISSED' } });
}
