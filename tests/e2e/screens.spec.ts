import { mkdirSync } from 'node:fs';
import { test } from '@playwright/test';
import { startApp, tap } from './helpers';

// Milestone screenshots (SPEC §13.5) into docs/screens/<milestone>/. Runs only when asked:
//   npx cross-env NCMC_SCREENS=M0 playwright test screens --project=chromium-ipad-pro-11 --project=webkit-iphone-13 --project=chromium-ipad-portrait
const milestone = process.env.NCMC_SCREENS;

test.skip(!milestone, 'set NCMC_SCREENS=M<n> to capture milestone screenshots');

test('milestone screenshots', async ({ page }, info) => {
  const dir = `docs/screens/${milestone}`;
  mkdirSync(dir, { recursive: true });
  const vp = page.viewportSize()!;
  const tag = `${vp.width}x${vp.height}`;
  const shot = (name: string) => page.screenshot({ path: `${dir}/${name}-${tag}.png` });

  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  await shot('splash');
  await startApp(page);
  await shot('home');
  await tap(page, page.getByTestId('open-cafe'));
  await shot('menu');
  await page.goBack();
  await shot('break-dialog');
  if (info.project.name === 'chromium-ipad-pro-11') {
    await page.goto('./?debug');
    await page.getByTestId('debug-version').waitFor();
    await shot('debug');
  }
});
