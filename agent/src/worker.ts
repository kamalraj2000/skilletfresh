// The long-lived worker: owns the Sunday-evening plan cron, the idempotent
// catch-up check, and the AgentJob queue (re-plans + missed weeklies).
// Run: npm run -w agent worker

import './env';
import { Cron } from 'croner';
import { prisma } from '@skilletfresh/db';
import { runPlan, runReplan } from './run';
import { renderPlanPdf } from './outputs/pdf';
import { sendFailureAlert, sendPlanDigest } from './outputs/email';

const PLAN_CRON = process.env.PLAN_CRON ?? '0 18 * * 0'; // Sunday 6 PM local
const POLL_MS = 30_000;

/** Monday of the local week containing `d` (+ optional weeks), ISO date. */
function mondayOf(d: Date, weeksAhead = 0): string {
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + weeksAhead * 7);
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

/** The week each profile should currently have: next week once we're past Sunday 18:00. */
function targetWeek(now = new Date()): string {
  const isSundayEvening = now.getDay() === 0 && now.getHours() >= 18;
  return mondayOf(now, isSundayEvening ? 1 : 0);
}

async function enqueueWeekly(weekStart: string) {
  const profiles = await prisma.profile.findMany();
  for (const profile of profiles) {
    const existing = await prisma.plan.findUnique({
      where: { profileId_weekStart: { profileId: profile.id, weekStart: new Date(`${weekStart}T00:00:00.000Z`) } },
    });
    if (existing) continue;
    const queued = await prisma.agentJob.findFirst({
      where: { type: 'WEEKLY_PLAN', profileId: profile.id, status: { in: ['QUEUED', 'RUNNING'] } },
    });
    if (queued) continue;
    await prisma.agentJob.create({
      data: { type: 'WEEKLY_PLAN', profileId: profile.id, payload: { weekStart } },
    });
    console.log(`[worker] queued weekly plan for ${profile.displayName} (week of ${weekStart})`);
  }
}

async function processJob(job: { id: string; type: string; profileId: string; payload: unknown }) {
  await prisma.agentJob.update({ where: { id: job.id }, data: { status: 'RUNNING' } });
  try {
    if (job.type === 'WEEKLY_PLAN') {
      const weekStart = (job.payload as { weekStart?: string })?.weekStart ?? targetWeek();
      const result = await runPlan(job.profileId, weekStart, { jobId: job.id });
      console.log(`[worker] plan ${result.savedId} saved ($${result.costUsd.toFixed(2)}, ${result.turns} turns)`);
      await onPlanSaved(job.profileId, result.savedId!);
    } else {
      const result = await runReplan(job.profileId, { jobId: job.id });
      console.log(
        result
          ? `[worker] replan proposal ${result.savedId} saved ($${result.costUsd.toFixed(2)})`
          : '[worker] replan skipped (nothing to do or proposal already pending)',
      );
    }
    await prisma.agentJob.update({ where: { id: job.id }, data: { status: 'DONE' } });
  } catch (error) {
    console.error(`[worker] job ${job.id} failed:`, error);
    await prisma.agentJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', error: String(error).slice(0, 2000) },
    });
    await sendFailureAlert(`${job.type} job ${job.id}`, error);
  }
}

/** Post-plan outputs: plan saved → PDF rendered → digest sent. */
async function onPlanSaved(_profileId: string, planId: string) {
  try {
    const pdfPath = await renderPlanPdf(planId);
    if (pdfPath) console.log(`[worker] PDF rendered: ${pdfPath}`);
    await sendPlanDigest(planId, pdfPath);
  } catch (error) {
    // outputs failing must never fail the plan itself
    console.error('[worker] output pipeline failed:', error);
    await sendFailureAlert(`outputs for plan ${planId}`, error);
  }
}

let draining = false;
async function drainJobs() {
  if (draining) return;
  draining = true;
  try {
    // catch-up: the Sunday guarantee is a state check, not a fire-and-forget event
    await enqueueWeekly(targetWeek());
    while (true) {
      const job = await prisma.agentJob.findFirst({
        where: { status: 'QUEUED' },
        orderBy: { createdAt: 'asc' },
      });
      if (!job) break;
      await processJob(job);
    }
  } catch (error) {
    console.error('[worker] drain error:', error);
  } finally {
    draining = false;
  }
}

console.log(`[worker] up — cron "${PLAN_CRON}" (TZ=${process.env.TZ ?? 'system'}), polling every ${POLL_MS / 1000}s`);
new Cron(PLAN_CRON, () => void drainJobs());
setInterval(() => void drainJobs(), POLL_MS);
void drainJobs();
