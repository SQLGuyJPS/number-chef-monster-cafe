import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { startApp, tap, watchNetwork } from './helpers';

// Device speed test (SPEC §2.4, §14 M2b, D112). Quick mode only: frame times in CI say nothing
// about the iPad; this checks the test runs, ramps, reports and sends nothing anywhere.
// NCMC_SCREENS=M2b also saves the milestone screenshots.
const shots = process.env.NCMC_SCREENS === 'M2b';

test('quick speed test ramps both kinds and reports budgets', async ({ page, baseURL }, info) => {
  test.skip(
    !/ipad-pro-11|ipad-gen7|iphone-13$/.test(info.project.name),
    'landscape tablets + phone',
  );
  test.setTimeout(90_000);
  const net = watchNetwork(page, new URL(baseURL!).origin);
  const tag = `${page.viewportSize()!.width}x${page.viewportSize()!.height}`;
  const shot = async (name: string) => {
    if (!shots) return;
    mkdirSync('docs/screens/M2b', { recursive: true });
    await page.screenshot({ path: `docs/screens/M2b/${name}-${tag}.png` });
  };

  await page.goto('./?speedtest=quick');
  await expect(page.getByTestId('st-start')).toBeVisible();
  await shot('speedtest-intro');
  await page.getByTestId('st-start').click();
  await expect(page.getByTestId('st-hud')).toBeVisible();
  // Mid-run: the café, the live monster and the copies are on the real stage.
  await expect(page.getByTestId('st-copies')).toBeVisible({ timeout: 20_000 });
  await shot('speedtest-running');

  const report = page.getByTestId('st-report');
  await expect(report).toBeVisible({ timeout: 60_000 });
  const text = await report.inputValue();
  expect(text).toContain('Number Chef speed test');
  expect(text).toContain('QUICK');
  expect(text).toMatch(/Base scene: \d+ elements/);
  expect(text).toMatch(/Still elements: /);
  expect(text).toMatch(/Moving elements: /);
  await expect(page.getByTestId('st-row-base')).toHaveCount(1);
  expect(await page.getByTestId('st-row-still').count()).toBeGreaterThan(0);
  expect(await page.getByTestId('st-row-moving').count()).toBeGreaterThan(0);
  // Each still step shows more elements than the base scene.
  const base = Number(await page.getByTestId('st-row-base').locator('td').nth(1).innerText());
  const still = Number(
    await page.getByTestId('st-row-still').first().locator('td').nth(1).innerText(),
  );
  expect(still).toBeGreaterThan(base + 150);
  await shot('speedtest-results');
  expect(net.external).toEqual([]);
});

test('Stop ends the run early and still reports', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-ipad-pro-11', 'one project is enough');
  await page.goto('./?speedtest');
  await page.getByTestId('st-start').click();
  await page.getByTestId('st-stop').click();
  await expect(page.getByTestId('st-report')).toHaveValue(/Stopped early: stopped by you/, {
    timeout: 20_000,
  });
});

test('the grown-ups tools open the speed test; the child UI does not link to it', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'chromium-ipad-pro-11', 'one project is enough');
  await startApp(page);
  await expect(page.getByTestId('open-speedtest')).toHaveCount(0);
  await page.goto('./?debug');
  await page.getByTestId('open-speedtest').click();
  await expect(page.getByTestId('st-start')).toBeVisible();
  await page.getByText('Back to the café').click();
  await tap(page, page.getByTestId('splash'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
});
