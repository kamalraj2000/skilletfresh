import bcrypt from 'bcryptjs';
import { prisma, applyPlannerOutput } from '@skilletfresh/db';
import { DESIGNED_PHOTO_COLORS, stubPlannerOutput } from '@skilletfresh/db/stub';

/** Monday of the local week containing `d`, as an ISO date string. */
function mondayOf(d: Date): string {
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

const FOUNDING_USERS = [
  {
    email: 'priya@skilletfresh.local',
    name: 'Priya',
    profile: {
      displayName: 'Priya',
      proteinTargetG: 120,
      timeCeilingMin: 30,
      skillLevel: 4,
      varietyPreference: 2,
      planShape: 'daily',
      dietTags: [],
      budgetCents: 11000,
    },
  },
  {
    email: 'maya@skilletfresh.local',
    name: 'Maya',
    profile: {
      displayName: 'Maya',
      proteinTargetG: 110,
      timeCeilingMin: 40,
      skillLevel: 3,
      varietyPreference: 5,
      planShape: 'daily',
      dietTags: [],
      budgetCents: 8000,
    },
  },
  {
    email: 'ethan@skilletfresh.local',
    name: 'Ethan',
    profile: {
      displayName: 'Ethan',
      proteinTargetG: 150,
      timeCeilingMin: 45,
      skillLevel: 1,
      varietyPreference: 1,
      planShape: 'batch',
      dietTags: [],
      budgetCents: 9000,
    },
  },
];

const PANTRY_STAPLES = ['Olive oil', 'Salt', 'Black pepper', 'Lemons', 'Yellow onions', 'Garlic'];

async function main() {
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD ?? 'skillet-dev', 10);
  const weekStart = mondayOf(new Date());

  for (const founder of FOUNDING_USERS) {
    const user = await prisma.user.upsert({
      where: { email: founder.email },
      update: {},
      create: {
        email: founder.email,
        name: founder.name,
        passwordHash,
        profile: { create: founder.profile },
      },
      include: { profile: true },
    });
    const profile =
      user.profile ?? (await prisma.profile.findUniqueOrThrow({ where: { userId: user.id } }));

    for (const name of PANTRY_STAPLES) {
      await prisma.pantryItem.upsert({
        where: { profileId_name: { profileId: profile.id, name } },
        update: {},
        create: { profileId: profile.id, name },
      });
    }

    // Same write path the agent will use — the seed doubles as a contract test.
    await applyPlannerOutput(profile.id, stubPlannerOutput(weekStart));
    console.log(`Seeded ${founder.name} with a DRAFT plan for week of ${weekStart}`);
  }

  for (const [name, [p1, p2]] of Object.entries(DESIGNED_PHOTO_COLORS)) {
    await prisma.recipe.updateMany({
      where: { name },
      data: { photoColor1: p1, photoColor2: p2 },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
