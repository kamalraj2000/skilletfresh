// Manual entrypoint: npx tsx agent/src/cli.ts plan --profile priya [--week 2026-07-13]
import './env';
import { prisma } from '@skilletfresh/db';
import { runPlan, runReplan } from './run';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** Monday of the local week containing `d`, as an ISO date string. */
function mondayOf(d: Date, weeksAhead = 0): string {
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + weeksAhead * 7);
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

async function resolveProfile(handle: string) {
  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        { displayName: { equals: handle, mode: 'insensitive' } },
        { user: { email: { equals: handle, mode: 'insensitive' } } },
        { id: handle },
      ],
    },
  });
  if (!profile) throw new Error(`No profile matches "${handle}"`);
  return profile;
}

const command = process.argv[2];
const handle = arg('profile');
if (!command || !handle) {
  console.error('Usage: cli.ts <plan|replan> --profile <name|email|id> [--week YYYY-MM-DD] [--verbose]');
  process.exit(1);
}
const verbose = process.argv.includes('--verbose');

try {
  const profile = await resolveProfile(handle);
  if (command === 'plan') {
    const week = arg('week') ?? mondayOf(new Date());
    console.log(`Planning week of ${week} for ${profile.displayName}…`);
    const result = await runPlan(profile.id, week, { verbose });
    console.log(
      `Saved plan ${result.savedId} — ${result.turns} turns, $${result.costUsd.toFixed(2)}, ${(result.durationMs / 1000).toFixed(0)}s`,
    );
  } else if (command === 'replan') {
    console.log(`Re-planning for ${profile.displayName}…`);
    const result = await runReplan(profile.id, { verbose });
    if (!result) console.log('Nothing to re-plan (no skipped/swapped log, no future days, or a proposal is already pending).');
    else
      console.log(
        `Saved proposal ${result.savedId} — ${result.turns} turns, $${result.costUsd.toFixed(2)}, ${(result.durationMs / 1000).toFixed(0)}s`,
      );
  } else {
    throw new Error(`Unknown command ${command}`);
  }
} finally {
  await prisma.$disconnect();
}
