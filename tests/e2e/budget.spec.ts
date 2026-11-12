import { expect, test } from '@playwright/test';
import { SVG_BUDGET } from '../../src/app/svgCount';
import { probe, openService, serveCorrect, serveWrong, tapId, waitPhase } from './service';

// SPEC §2.4, D113: every screen stays inside the budget measured on the iPad 7th gen. A sampler
// counts every 40 ms through Home, the menu, a whole real-time service (a miss, six eat sequences
// with reactions and coin flights) and Results, and keeps the peak per screen.
declare global {
  interface Window {
    __peaks: Record<string, { total: number; moving: number }>;
  }
}

test('SVG element budget: total and moving, on every screen of a service', async ({
  page,
}, info) => {
  test.skip(
    !/ipad-pro-11|ipad-gen7/.test(info.project.name),
    'element counts do not depend on the device',
  );
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    window.__peaks = {};
    setInterval(() => {
      const h = (
        window as unknown as {
          __ncmc?: { screen(): string; svgCounts(): { total: number; moving: number } };
        }
      ).__ncmc;
      if (!h) return;
      const c = h.svgCounts();
      const p = (window.__peaks[h.screen()] ??= { total: 0, moving: 0 });
      p.total = Math.max(p.total, c.total);
      p.moving = Math.max(p.moving, c.moving);
    }, 40);
  });
  await openService(page, { skill: 'A2', stage: 3, ops: 'both', seed: 7, timeScale: 1 });
  await serveWrong(page);
  for (let i = 0; i < 6; i++) {
    await expect.poll(async () => (await probe(page))?.index, { timeout: 30_000 }).toBe(i);
    await waitPhase(page, 'building', 30_000);
    await serveCorrect(page);
  }
  await expect(page.getByTestId('screen-results')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(6000); // the coin count-up and its tings
  await tapId(page, 'results-change');
  await page.waitForTimeout(500);
  const peaks = await page.evaluate(() => window.__peaks);
  console.log(`SVG peaks (${info.project.name}):`, JSON.stringify(peaks));
  for (const s of ['home', 'menu', 'service', 'results']) expect(Object.keys(peaks)).toContain(s);
  for (const [screen, p] of Object.entries(peaks)) {
    expect.soft(p.total, `${screen}: total`).toBeLessThanOrEqual(SVG_BUDGET.total);
    expect.soft(p.moving, `${screen}: moving`).toBeLessThanOrEqual(SVG_BUDGET.moving);
  }
});
