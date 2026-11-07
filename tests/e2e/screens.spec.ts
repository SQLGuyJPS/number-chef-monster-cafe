import { mkdirSync } from 'node:fs';
import { test } from '@playwright/test';
import { startApp, tap } from './helpers';
import { openService, serveWrong, tapId, waitPhase } from './service';

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

// M1 service screens (SPEC §13.5 "as built so far"): iPad 1194×834 and iPhone 844×390.
const SERVICE_SHOTS = ['chromium-ipad-pro-11', 'webkit-iphone-13'];

test('service screenshots', async ({ page }, info) => {
  test.skip(!SERVICE_SHOTS.includes(info.project.name), 'service shots at 1194×834 and 844×390');
  test.setTimeout(120_000);
  const dir = `docs/screens/${milestone}`;
  mkdirSync(dir, { recursive: true });
  const vp = page.viewportSize()!;
  const tag = `${vp.width}x${vp.height}`;
  const shot = async (name: string) => {
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }).catch(() => undefined);
    await page.screenshot({ path: `${dir}/${name}-${tag}.png` });
  };

  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3 });
  await tapId(page, 'bin');
  await tapId(page, 'bin');
  await page.waitForTimeout(300);
  await shot('service-s3-add');

  await openService(page, { skill: 'A2', stage: 3, ops: 'sub', seed: 5 });
  await tapId(page, 'tray-cell-0');
  await page.waitForTimeout(500);
  await shot('service-s3-remove');

  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3, timeScale: 1 });
  await tapId(page, 'help');
  await waitPhase(page, 'countTogether');
  await page.waitForTimeout(5000);
  await shot('service-count-together');

  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3 });
  await serveWrong(page);
  await waitPhase(page, 'building');
  await serveWrong(page);
  await waitPhase(page, 'offerHelp');
  await page.waitForTimeout(300);
  await shot('service-offer-help');

  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 12, timeScale: 1 });
  await tapId(page, 'help');
  await waitPhase(page, 'building', 30_000);
  await serveWrong(page);
  await waitPhase(page, 'worked');
  await page.waitForTimeout(3500);
  await shot('service-worked');
  await waitPhase(page, 'followMe', 40_000);
  await page.waitForTimeout(300);
  await shot('service-followme');

  await openService(page, { skill: 'A2', stage: 1, seed: 4 });
  await tapId(page, 'bin');
  await tapId(page, 'bin');
  await tapId(page, 'bin');
  await page.waitForTimeout(300);
  await shot('service-s1');

  await openService(page, { skill: 'A2', stage: 0, seed: 9 });
  await tapId(page, 'digit-7');
  await shot('service-s0-pad');
  await tapId(page, 'peek');
  await tapId(page, 'bin');
  await page.waitForTimeout(300);
  await shot('service-s0-cloche');
});
