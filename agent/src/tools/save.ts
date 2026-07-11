// The write boundary: the agent's only way to deliver output. Zod validates
// shape at the tool layer; these handlers add the semantic checks schemas
// can't express and return precise errors so the agent self-corrects.

import { tool } from '@anthropic-ai/claude-agent-sdk';
import {
  PlannerOutputSchema,
  ReplanOutputSchema,
  type PlannerOutput,
  type ReplanOutput,
} from '@skilletfresh/contracts';
import { applyPlannerOutput, createReplanProposal, prisma } from '@skilletfresh/db';

const ok = (message: string) => ({ content: [{ type: 'text' as const, text: message }] });
const reject = (message: string) => ({
  content: [{ type: 'text' as const, text: `REJECTED: ${message}` }],
  isError: true,
});

/** Dinner's share of the daily protein target — "roughly right" band. */
const DINNER_PROTEIN_SHARE = { min: 0.2, max: 0.65 };

function semanticPlanErrors(
  output: PlannerOutput,
  profile: { timeCeilingMin: number; proteinTargetG: number },
): string[] {
  const errors: string[] = [];

  const days = output.meals.map((m) => m.dayIndex);
  if (new Set(days).size !== 7) errors.push('meals must cover all 7 distinct dayIndex values 0–6.');

  for (const meal of output.meals) {
    const label = `Day ${meal.dayIndex} (${meal.recipe.name})`;
    if (meal.recipe.timeMin > profile.timeCeilingMin) {
      errors.push(`${label} takes ${meal.recipe.timeMin} min — over the ${profile.timeCeilingMin}-minute ceiling. Swap or re-portion that day only.`);
    }
    if (meal.recipe.proteinG === undefined) {
      errors.push(`${label} is missing proteinG — every dinner needs its protein estimate.`);
    } else {
      const share = meal.recipe.proteinG / profile.proteinTargetG;
      if (share < DINNER_PROTEIN_SHARE.min || share > DINNER_PROTEIN_SHARE.max) {
        errors.push(
          `${label} has ${meal.recipe.proteinG}g protein — outside the plausible dinner share (${Math.round(DINNER_PROTEIN_SHARE.min * 100)}–${Math.round(DINNER_PROTEIN_SHARE.max * 100)}% of the ${profile.proteinTargetG}g/day target). Fix that day only.`,
        );
      }
    }
  }

  if (output.shoppingItems.length < output.meals.length) {
    errors.push('Shopping list looks too thin — every dinner must be coverable from it.');
  }
  return errors;
}

export function saveTools(context: {
  profileId: string;
  weekStart: string;
  todayIndex?: number;
  onSaved?: (kind: 'plan' | 'replan', id: string) => void;
}) {
  const saveWeekPlan = tool(
    'save_week_plan',
    'Deliver the finished week plan. This is the ONLY way to output the plan — never print it as text. Validates and persists; on rejection, fix exactly what the error names and call again.',
    PlannerOutputSchema.shape,
    async (args) => {
      const output = PlannerOutputSchema.parse(args);
      if (output.weekStart !== context.weekStart) {
        return reject(`weekStart must be ${context.weekStart}, got ${output.weekStart}.`);
      }
      const profile = await prisma.profile.findUniqueOrThrow({ where: { id: context.profileId } });
      const errors = semanticPlanErrors(output, profile);
      if (errors.length) return reject(errors.join('\n'));

      const planId = await applyPlannerOutput(context.profileId, output);
      context.onSaved?.('plan', planId);
      return ok(`Saved plan ${planId} for week of ${output.weekStart}. You are done — reply with a one-line confirmation.`);
    },
  );

  const saveReplanDiff = tool(
    'save_replan_diff',
    'Deliver a mid-week re-plan as a diff of changed future days only. This is the ONLY way to output the re-plan. The user accepts or dismisses it — never mutate the plan directly.',
    ReplanOutputSchema.shape,
    async (args) => {
      const output: ReplanOutput = ReplanOutputSchema.parse(args);
      const todayIndex = context.todayIndex ?? -1;
      const profile = await prisma.profile.findUniqueOrThrow({ where: { id: context.profileId } });

      const errors: string[] = [];
      for (const entry of output.entries) {
        if (entry.dayIndex <= todayIndex) {
          errors.push(`Entry for day ${entry.dayIndex} is not in the future (today is day ${todayIndex}). Never touch past days or today.`);
        }
        if (entry.recipe.timeMin > profile.timeCeilingMin) {
          errors.push(`${entry.recipe.name} takes ${entry.recipe.timeMin} min — over the ${profile.timeCeilingMin}-minute ceiling.`);
        }
      }
      if (errors.length) return reject(errors.join('\n'));

      const weekStart = new Date(`${context.weekStart}T00:00:00.000Z`);
      const plan = await prisma.plan.findUniqueOrThrow({
        where: { profileId_weekStart: { profileId: context.profileId, weekStart } },
      });
      const proposalId = await createReplanProposal(plan.id, output);
      context.onSaved?.('replan', proposalId);
      return ok(`Saved re-plan proposal ${proposalId} (${output.entries.length} day(s) changed). You are done — reply with a one-line confirmation.`);
    },
  );

  return { saveWeekPlan, saveReplanDiff };
}
