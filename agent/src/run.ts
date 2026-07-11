// One agent run = one query() with the in-process skilletfresh MCP server.
// Three enforcement layers guarantee the contract: zod at the tool boundary,
// semantic validation in the save handlers, and the post-run assertion here.

import { createSdkMcpServer, query } from '@anthropic-ai/claude-agent-sdk';
import { prisma } from '@skilletfresh/db';
import { AGENT_DIR, AGENT_MODEL, RECIPE_SOURCE } from './env';
import { PLANNER_SYSTEM_PROMPT, planPrompt, replanPrompt } from './prompts';
import {
  constraintTools,
  fdcGetNutrients,
  fdcSearchFoods,
  fetchRecipe,
  searchRecipeCorpus,
} from './tools/sources';
import { saveTools } from './tools/save';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface RunResult {
  savedId: string | null;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  turns: number;
  durationMs: number;
}

async function runAgent(opts: {
  profileId: string;
  weekStart: string;
  todayIndex?: number;
  prompt: string;
  kind: 'weekly_plan' | 'replan';
  jobId?: string;
  verbose?: boolean;
}): Promise<RunResult> {
  let savedId: string | null = null;
  const save = saveTools({
    profileId: opts.profileId,
    weekStart: opts.weekStart,
    todayIndex: opts.todayIndex,
    onSaved: (_kind, id) => {
      savedId = id;
    },
  });

  const skilletfresh = createSdkMcpServer({
    name: 'skilletfresh',
    version: '0.1.0',
    tools: [
      ...constraintTools(opts.profileId),
      searchRecipeCorpus,
      ...(RECIPE_SOURCE === 'live' ? [fetchRecipe] : []),
      fdcSearchFoods,
      fdcGetNutrients,
      opts.kind === 'weekly_plan' ? save.saveWeekPlan : save.saveReplanDiff,
    ],
  });

  const mcpTools = [
    'mcp__skilletfresh__get_constraints',
    'mcp__skilletfresh__get_pantry',
    'mcp__skilletfresh__search_recipe_corpus',
    'mcp__skilletfresh__fdc_search_foods',
    'mcp__skilletfresh__fdc_get_nutrients',
    ...(RECIPE_SOURCE === 'live' ? ['mcp__skilletfresh__fetch_recipe', 'WebSearch', 'WebFetch'] : []),
    opts.kind === 'weekly_plan' ? 'mcp__skilletfresh__save_week_plan' : 'mcp__skilletfresh__save_replan_diff',
  ];

  const result: RunResult = { savedId: null, costUsd: 0, inputTokens: 0, outputTokens: 0, turns: 0, durationMs: 0 };
  const started = Date.now();

  const stream = query({
    prompt: opts.prompt,
    options: {
      model: AGENT_MODEL,
      systemPrompt: PLANNER_SYSTEM_PROMPT,
      cwd: AGENT_DIR, // .claude/skills/ lives here
      settingSources: ['project'],
      skills: 'all',
      mcpServers: { skilletfresh },
      tools: mcpTools,
      allowedTools: mcpTools,
      permissionMode: 'bypassPermissions',
      maxTurns: 80,
    },
  });

  for await (const message of stream) {
    if (opts.verbose) {
      if (message.type === 'assistant') {
        for (const block of message.message.content) {
          if (block.type === 'text' && block.text.trim()) console.log(`  [agent] ${block.text.slice(0, 200)}`);
          if (block.type === 'tool_use') console.log(`  [tool] ${block.name}`);
        }
      }
    }
    if (message.type === 'result') {
      result.costUsd = 'total_cost_usd' in message ? message.total_cost_usd : 0;
      result.turns = message.num_turns;
      result.durationMs = message.duration_ms;
      if ('usage' in message && message.usage) {
        result.inputTokens = message.usage.input_tokens ?? 0;
        result.outputTokens = message.usage.output_tokens ?? 0;
      }
    }
  }

  result.durationMs ||= Date.now() - started;
  result.savedId = savedId;

  await prisma.agentRunLog.create({
    data: {
      jobId: opts.jobId,
      profileId: opts.profileId,
      kind: opts.kind,
      model: AGENT_MODEL,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd: result.costUsd,
      durationMs: result.durationMs,
    },
  });

  return result;
}

/** Generate (or regenerate) the week plan for a profile. Retries once. */
export async function runPlan(
  profileId: string,
  weekStart: string,
  opts: { jobId?: string; verbose?: boolean } = {},
): Promise<RunResult> {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const weekLabel = `Mon ${weekStart} onward`;
  let prompt = planPrompt({ displayName: profile.displayName, weekStart, weekLabel });

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await runAgent({
      profileId,
      weekStart,
      prompt,
      kind: 'weekly_plan',
      jobId: opts.jobId,
      verbose: opts.verbose,
    });

    // Post-run assertion: the plan row must exist, regardless of what the agent said.
    const plan = await prisma.plan.findUnique({
      where: { profileId_weekStart: { profileId, weekStart: new Date(`${weekStart}T00:00:00.000Z`) } },
      include: { meals: true, shoppingList: { include: { items: true } } },
    });
    if (plan && plan.meals.length === 7 && (plan.shoppingList?.items.length ?? 0) > 0) {
      return { ...result, savedId: plan.id };
    }
    prompt += `\n\nIMPORTANT: your previous attempt ended WITHOUT a successful save_week_plan call. The plan does not exist. Complete the steps and call save_week_plan.`;
  }
  throw new Error(`Plan run failed for profile ${profileId}: no valid plan saved after 2 attempts`);
}

/** Generate a re-plan diff after a skipped/swapped log. Retries once. */
export async function runReplan(
  profileId: string,
  opts: { jobId?: string; verbose?: boolean } = {},
): Promise<RunResult | null> {
  const plan = await prisma.plan.findFirst({
    where: { profileId },
    orderBy: { weekStart: 'desc' },
    include: { meals: { include: { recipe: true, log: true }, orderBy: { dayIndex: 'asc' } } },
  });
  if (!plan) throw new Error(`No plan to re-plan for profile ${profileId}`);

  const logged = plan.meals
    .filter((m) => m.log && m.log.choice !== 'COOKED')
    .sort((a, b) => b.dayIndex - a.dayIndex)[0];
  if (!logged) return null; // nothing to react to
  if (logged.dayIndex >= 6) return null; // no future days left

  const existing = await prisma.replanProposal.findFirst({
    where: { planId: plan.id, status: 'PENDING' },
  });
  if (existing) return null; // one pending proposal at a time

  const profile = await prisma.profile.findUniqueOrThrow({ where: { id: profileId } });
  const weekStart = plan.weekStart.toISOString().slice(0, 10);
  let prompt = replanPrompt({
    displayName: profile.displayName,
    weekStart,
    todayIndex: logged.dayIndex,
    todayName: DAY_NAMES[logged.dayIndex],
    loggedChoice: logged.log!.choice.toLowerCase(),
    currentPlan: plan.meals.map((m) => ({
      dayIndex: m.dayIndex,
      day: DAY_NAMES[m.dayIndex],
      name: m.recipe.name,
      proteinG: m.recipe.proteinG,
      logged: m.log?.choice.toLowerCase(),
    })),
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await runAgent({
      profileId,
      weekStart,
      todayIndex: logged.dayIndex,
      prompt,
      kind: 'replan',
      jobId: opts.jobId,
      verbose: opts.verbose,
    });

    const proposal = await prisma.replanProposal.findFirst({
      where: { planId: plan.id, status: 'PENDING' },
      include: { entries: true },
    });
    if (proposal && proposal.entries.length > 0) return { ...result, savedId: proposal.id };
    prompt += `\n\nIMPORTANT: your previous attempt ended WITHOUT a successful save_replan_diff call. Complete the re-plan and call save_replan_diff.`;
  }
  throw new Error(`Replan run failed for profile ${profileId}: no proposal saved after 2 attempts`);
}
