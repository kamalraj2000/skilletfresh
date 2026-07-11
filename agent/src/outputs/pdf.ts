// Print-to-PDF of the app's /plan/<id>/print route: one layout, owned by the
// app, always matching what the user sees. Requires the app to be running.

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { AGENT_DIR } from '../env';

export async function renderPlanPdf(planId: string): Promise<string | null> {
  const base = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  const token = process.env.PRINT_TOKEN;
  if (!token) {
    console.warn('[pdf] PRINT_TOKEN not set — skipping PDF render');
    return null;
  }

  const outDir = path.join(AGENT_DIR, 'output');
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `plan-${planId}.pdf`);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const res = await page.goto(`${base}/plan/${planId}/print?token=${token}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    if (!res?.ok()) throw new Error(`print route returned ${res?.status()}`);
    await page.pdf({ path: outPath, format: 'A4', margin: { top: '12mm', bottom: '12mm' } });
    return outPath;
  } finally {
    await browser.close();
  }
}
