// End-to-end drive of the SkilletFresh weekly loop against the dev server.
import { chromium, type Page } from 'playwright';
import { prisma } from '../packages/db/src/index';

const BASE = 'http://localhost:3111';
const results: string[] = [];
const ok = (label: string) => {
  results.push(`✓ ${label}`);
  console.log(`✓ ${label}`);
};
const fail = (label: string, detail?: string) => {
  console.log(`✗ ${label}${detail ? ` — ${detail}` : ''}`);
  process.exitCode = 1;
};

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/signin`);
  await page.fill('input[name=email]', email);
  await page.fill('input[name=password]', 'skillet-dev');
  await page.click('button[type=submit]');
  await page.waitForURL(`${BASE}/plan`, { timeout: 15000 });
}

const browser = await chromium.launch();
try {
  // --- Priya drives the full loop ---
  const priya = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await priya.newPage();
  page.on('pageerror', (e) => fail('page error', e.message));

  await login(page, 'priya@skilletfresh.local');
  ok('login lands on /plan');

  await page.waitForSelector('.day-card');
  const cards = await page.locator('.day-card').count();
  cards === 7 ? ok('7 day cards render from DB') : fail('day cards', String(cards));

  // swap Saturday (index 5) for the first alternate
  const before = await page.locator('.day-card__name').nth(5).innerText();
  await page.locator('.day-card').nth(5).getByRole('button', { name: 'Swap' }).click();
  await page.waitForSelector('.sheet .alt-card');
  const altName = await page.locator('.alt-card').first().locator('div >> nth=1').innerText();
  await page.locator('.alt-card').first().click();
  await page.waitForTimeout(900);
  const after = await page.locator('.day-card__name').nth(5).innerText();
  after !== before && altName.includes(after)
    ? ok(`swap persists a different meal (${before} → ${after})`)
    : fail('swap', `${before} → ${after}`);

  await page.reload();
  const afterReload = await page.locator('.day-card__name').nth(5).innerText();
  afterReload === after ? ok('swap survives hard reload') : fail('swap reload', afterReload);

  // lock plan → /list
  await page.getByRole('button', { name: 'Lock plan & build list' }).click();
  await page.waitForURL(`${BASE}/list`, { timeout: 15000 });
  ok('lock plan redirects to /list');

  await page.goto(`${BASE}/plan`);
  (await page.locator('.locked-pill').count()) === 1
    ? ok('plan shows Locked after lock')
    : fail('locked pill');

  // shopping list: check everything off
  await page.goto(`${BASE}/list`);
  await page.waitForSelector('.aisle, .aisle-done');
  // expand collapsed aisles first
  while (true) {
    const collapsed = page.locator('.aisle--collapsed .aisle__head');
    if ((await collapsed.count()) === 0) break;
    await collapsed.first().click();
  }
  for (let i = 0; i < 40; i++) {
    const row = page.locator('.item-row:not(.item-row--done)').first();
    if ((await row.count()) === 0) break;
    await row.click();
    await page.waitForTimeout(280);
  }
  await page.waitForSelector('.trip-done', { timeout: 10000 });
  ok('all items checked → trip-done card');

  await page.fill('.receipt-input input', '92.50');
  await page.getByRole('button', { name: 'Save total' }).click();
  await page.waitForSelector('text=Go to tonight');
  ok('receipt saved → continue CTA');

  // today: log skipped → diff banner → accept
  await page.goto(`${BASE}/today`);
  await page.waitForSelector('.log-zone');
  await page.getByRole('button', { name: 'Skipped' }).click();
  await page.waitForSelector('.diff-banner', { timeout: 15000 });
  const bannerText = await page.locator('.diff-banner__title').innerText();
  ok(`skip → replan diff banner ("${bannerText}")`);

  const diffDays = await page.locator('.day-card').count();
  diffDays >= 1 && diffDays <= 2 ? ok('diff touches only future days') : fail('diff size', String(diffDays));

  await page.getByRole('button', { name: 'Looks good' }).click();
  await page.waitForSelector('text=Skip logged', { timeout: 15000 });
  ok('accept replan → quiet logged state');

  await page.reload();
  await page.waitForSelector('text=Skip logged');
  ok('logged state survives reload');

  // plan tab shows the replanned meals
  await page.goto(`${BASE}/plan`);
  await page.waitForSelector('.day-card');

  // --- Maya sees her own untouched plan (no cross-profile bleed) ---
  const maya = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await maya.newPage();
  await login(mpage, 'maya@skilletfresh.local');
  await mpage.waitForSelector('.day-card');
  const mayaLocked = await mpage.locator('.locked-pill').count();
  const mayaSat = await mpage.locator('.day-card__name').nth(5).innerText();
  mayaLocked === 0 && mayaSat === before
    ? ok('maya: plan still DRAFT with original Saturday meal (no bleed)')
    : fail('cross-profile bleed', `locked=${mayaLocked} sat=${mayaSat}`);

  // --- DB assertions ---
  const priyaProfile = await prisma.profile.findFirstOrThrow({ where: { displayName: 'Priya' } });
  const plan = await prisma.plan.findFirstOrThrow({
    where: { profileId: priyaProfile.id },
    include: {
      shoppingList: true,
      meals: { include: { log: true, recipe: true } },
      replans: true,
    },
  });
  plan.status === 'LOCKED' ? ok('DB: plan LOCKED') : fail('DB plan status', plan.status);
  plan.shoppingList?.receiptTotalCents === 9250
    ? ok('DB: receipt total 9250 cents')
    : fail('DB receipt', String(plan.shoppingList?.receiptTotalCents));
  const log = plan.meals.find((m) => m.log)?.log;
  log?.choice === 'SKIPPED' ? ok('DB: MealLog SKIPPED') : fail('DB log', JSON.stringify(log));
  plan.replans[0]?.status === 'ACCEPTED'
    ? ok('DB: replan proposal ACCEPTED')
    : fail('DB replan', plan.replans[0]?.status);
  const job = await prisma.agentJob.findFirst({ where: { profileId: priyaProfile.id } });
  job?.type === 'REPLAN' ? ok('DB: AgentJob REPLAN queued') : fail('DB agent job', JSON.stringify(job));

  console.log(`\n${results.length} checks passed${process.exitCode ? ' (with failures above)' : ''}`);
} finally {
  await browser.close();
  await prisma.$disconnect();
}
