import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { startApp, tap } from './helpers';
import { followMe, openService, probe, ringBell, serveCorrect, serveWrong, tapId, waitPhase } from './service';

// Milestone screenshots (SPEC §13.5) into docs/screens/<milestone>/. Runs only when asked:
//   npx cross-env NCMC_SCREENS=M0 playwright test screens --project=chromium-ipad-pro-11 --project=webkit-iphone-13 --project=chromium-ipad-portrait
const milestone = process.env.NCMC_SCREENS;

test.skip(!milestone, 'set NCMC_SCREENS=M<n> to capture milestone screenshots');


/**
 * Freezing animations mid-flight leaves the flying copies where they started (two burgers both on
 * the tray and in the taken-away row), so a frozen shot waits for item flights to land first.
 */
async function landFlights(page: Page) {
  await expect(page.locator('.flight')).toHaveCount(0, { timeout: 5_000 });
}
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
  // D94, D95: the gear popup part-way through a hold, then the playtest tools (not rotated).
  await startApp(page);
  await tap(page, page.getByTestId('gear'));
  const g = (await page.getByTestId('gear-hold').boundingBox())!;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1200);
  await shot('gear-hold');
  await page.getByTestId('parent-screen').waitFor({ timeout: 5000 });
  await page.mouse.up();
  await page.getByTestId('debug-version').waitFor();
  await shot('parent-tools');
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
    await landFlights(page);
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

// M2 additions (SPEC §13.5 "as built so far"): A3, the eat reaction, the warm-up ghost, Results,
// and the monster grid (every monster × expression; iPad only, it is one sheet).
test('M2 screenshots', async ({ page }, info) => {
  test.skip(!SERVICE_SHOTS.includes(info.project.name), 'service shots at 1194×834 and 844×390');
  test.setTimeout(120_000);
  const dir = `docs/screens/${milestone}`;
  mkdirSync(dir, { recursive: true });
  const vp = page.viewportSize()!;
  const tag = `${vp.width}x${vp.height}`;
  const still = () =>
    page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }).catch(() => undefined);
  const shot = async (name: string, freeze = true) => {
    if (freeze) {
      await landFlights(page);
      await still();
    }
    await page.screenshot({ path: `${dir}/${name}-${tag}.png` });
  };

  if (info.project.name === 'chromium-ipad-pro-11') {
    await page.setViewportSize({ width: 1000, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./?gallery');
    await page.getByTestId('gallery').waitFor();
    await page.screenshot({ path: `${dir}/monster-grid.png`, fullPage: true });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize(vp);
  }

  await openService(page, { skill: 'A3', stage: 3, ops: 'add', seed: 4 });
  await tapId(page, 'bin');
  await page.waitForTimeout(300);
  await shot('service-a3-make-ten');

  await openService(page, { skill: 'A3', stage: 3, ops: 'sub', seed: 11 });
  for (let i = 0; i < 6 && (await probe(page)).form !== 'missingSub'; i++) {
    await serveCorrect(page);
    await expect.poll(async () => (await probe(page)).index, { timeout: 10_000 }).toBe(i + 1);
    await waitPhase(page, 'building');
  }
  await tapId(page, 'tray-cell-9');
  await tapId(page, 'tray-cell-8');
  await page.waitForTimeout(300);
  await shot('service-a3-taken-away');

  // A3 at S1: Pip's make-ten story in the model bubble; the child's tray stays empty (D105).
  await openService(page, { skill: 'A3', stage: 1, ops: 'add', seed: 4 });
  await serveWrong(page);
  await waitPhase(page, 'building');
  await tapId(page, 'help');
  await waitPhase(page, 'followMe', 40_000);
  await page.waitForTimeout(300);
  await shot('service-a3-s1-help');

  // The reaction after a first-try serve, with the answer in green on the ticket (D96, D101).
  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 5, timeScale: 1 });
  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).eat?.step, { timeout: 8000 }).toBe('react');
  await page.waitForTimeout(500);
  await shot('service-eat-react', false);

  await openService(page, { skill: 'A2', stage: 1, ops: 'both', seed: 3, warmUp: true, timeScale: 1 });
  // Real time: greeting and order are read first, then 4 s without a touch.
  await expect(page.getByTestId('ghost-hand')).toBeVisible({ timeout: 15_000 });
  await shot('service-warmup-ghost');

  await openService(page, { skill: 'A1', stage: 3, ops: 'add', seed: 8 });
  for (let i = 0; i < 6; i++) {
    await expect.poll(async () => (await probe(page))?.index, { timeout: 10_000 }).toBe(i);
    await waitPhase(page, 'building');
    await serveCorrect(page);
  }
  await expect(page.getByTestId('results-count')).toHaveText('23', { timeout: 15_000 });
  await expect(page.getByTestId('results-tally')).toHaveAttribute('data-done', 'true');
  await shot('results');
});

// Counter layout build (D114–D118): the left-handed counter row and the waiting line with a
// returning monster at its real place.
test('counter layout screenshots', async ({ page }, info) => {
  test.skip(!SERVICE_SHOTS.includes(info.project.name), 'service shots at 1194×834 and 844×390');
  test.setTimeout(180_000);
  const dir = `docs/screens/${milestone}`;
  mkdirSync(dir, { recursive: true });
  const vp = page.viewportSize()!;
  const tag = `${vp.width}x${vp.height}`;
  const shot = async (name: string) => {
    await landFlights(page);
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' }).catch(() => undefined);
    await page.screenshot({ path: `${dir}/${name}-${tag}.png` });
  };

  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3, basket: 'left' });
  await tapId(page, 'bin');
  await tapId(page, 'bin');
  await page.waitForTimeout(300);
  await shot('left-s3-add');

  await openService(page, { skill: 'A2', stage: 0, seed: 9, basket: 'left' });
  await tapId(page, 'digit-7');
  await shot('left-s0-pad');
  await tapId(page, 'peek');
  await page.waitForTimeout(300);
  await shot('left-s0-cloche');

  await openService(page, { skill: 'A3', stage: 3, ops: 'sub', seed: 11, basket: 'left' });
  for (let i = 0; i < 6 && (await probe(page)).form !== 'missingSub'; i++) {
    await serveCorrect(page);
    await expect.poll(async () => (await probe(page)).index, { timeout: 10_000 }).toBe(i + 1);
    await waitPhase(page, 'building');
  }
  await tapId(page, 'tray-cell-9');
  await tapId(page, 'tray-cell-8');
  await page.waitForTimeout(300);
  await shot('left-a3-taken-away');

  // An assisted order: its monster comes back 3–5 orders later and waits at that place (D118).
  await openService(page, { skill: 'A2', stage: 2, ops: 'add', seed: 21 });
  await serveWrong(page);
  await waitPhase(page, 'building');
  await serveWrong(page);
  await waitPhase(page, 'offerHelp');
  await tapId(page, 'offer-yes');
  await waitPhase(page, 'followMe', 40_000);
  await followMe(page);
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).index, { timeout: 15_000 }).toBe(1);
  await waitPhase(page, 'building');
  await page.waitForTimeout(1200);
  await shot('line-returning-monster');
});
