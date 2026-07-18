// Sunday digest + failure alerts via Resend. No-ops (with a log line) when
// RESEND_API_KEY isn't configured, so the pipeline runs without it.

import { readFile } from 'node:fs/promises';
import { prisma } from '@skilletfresh/db';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function send(to: string, subject: string, html: string, pdfPath?: string | null) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM;
  if (!key || !from) {
    console.warn(`[email] RESEND_API_KEY/DIGEST_FROM not set — skipping "${subject}" to ${to}`);
    return;
  }
  const attachments = pdfPath
    ? [{ filename: 'skilletfresh-week.pdf', content: (await readFile(pdfPath)).toString('base64') }]
    : undefined;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, attachments }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

export async function sendPlanDigest(planId: string, pdfPath: string | null) {
  const plan = await prisma.plan.findUniqueOrThrow({
    where: { id: planId },
    include: {
      profile: { include: { user: true } },
      meals: { include: { recipe: true }, orderBy: { dayIndex: 'asc' } },
    },
  });
  const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const rows = plan.meals
    .map(
      (m) =>
        `<tr><td style="padding:4px 10px 4px 0;color:#8a7f6c;font-size:12px">${DAY_NAMES[m.dayIndex]}</td>` +
        `<td style="padding:4px 0"><strong>${m.recipe.name}</strong><br/><span style="color:#6f6557;font-size:12px">${m.recipe.timeMin} min · fit ${m.fitScore}/10 — ${m.reason}</span></td></tr>`,
    )
    .join('');
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
    <h2 style="color:#2e5528">Your week is ready, ${plan.profile.displayName}</h2>
    <table>${rows}</table>
    <p><a href="${base}/plan" style="color:#3b6a34">Review &amp; lock your plan →</a></p>
  </div>`;
  await send(plan.profile.user.email, 'Your SkilletFresh week is ready', html, pdfPath);
}

export async function sendFailureAlert(context: string, error: unknown) {
  const to = process.env.ALERT_EMAIL ?? process.env.DIGEST_FROM;
  if (!to) return;
  await send(
    to,
    `SkilletFresh agent failure: ${context}`,
    `<pre>${String(error).slice(0, 4000)}</pre>`,
  ).catch((e) => console.error('[email] failure alert failed too:', e));
}
