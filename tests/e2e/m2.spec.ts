import { expect, test } from '@playwright/test';
import {
  followMe,
  openService,
  probe,
  ringBell,
  serveCorrect,
  serveWrong,
  tapId,
  waitPhase,
} from './service';

// M2 flows (SPEC §14 M2). Same projects as the M1 flows until the full M2 matrix lands.
const FLOW_PROJECTS = ['chromium-ipad-pro-11', 'webkit-ipad-gen7'];
test.beforeEach(({ browserName: _browser }, info) => {
  test.skip(!FLOW_PROJECTS.includes(info.project.name), 'flows run on the two landscape iPad projects');
});

test('A3 Perfect Ten: subtraction orders, with the taken-away row for 10 − ? = a (D30)', async ({ page }) => {
  test.setTimeout(90_000);
  await openService(page, { skill: 'A3', stage: 3, ops: 'sub', seed: 11 });
  let sawMissing = false;
  for (let i = 0; i < 6; i++) {
    await expect.poll(async () => (await probe(page)).index).toBe(i);
    await waitPhase(page, 'building');
    const s = await probe(page);
    expect(s.display).toContain('10');
    expect(s.mode).toBe('remove');
    expect(s.prefill).toBe(10);
    if (s.form === 'missingSub') {
      sawMissing = true;
      await expect(page.getByTestId('taken-away')).toBeVisible();
      await tapId(page, 'tray-cell-9');
      await tapId(page, 'tray-cell-8');
      // The two removed items sit in the taken-away row; tapping it puts one back.
      await expect(page.locator('[data-testid="taken-away"] .tf-cell.filled')).toHaveCount(2);
      await tapId(page, 'taken-away');
      expect((await probe(page)).filled).toBe(9);
    } else {
      await expect(page.getByTestId('taken-away')).toHaveCount(0);
    }
    await serveCorrect(page);
    await waitPhase(page, 'eating');
  }
  expect(sawMissing).toBe(true);
});

test('A3 make-ten help: wrong, wrong, yes → Pip flashes the gap to ten, then FollowMe (D98)', async ({ page }) => {
  test.setTimeout(90_000);
  await openService(page, { skill: 'A3', stage: 3, ops: 'add', seed: 4 });
  const s = await probe(page);
  expect(s.form).toBe('missingAddend');
  await serveWrong(page);
  await waitPhase(page, 'building');
  await serveWrong(page);
  await waitPhase(page, 'offerHelp');
  await tapId(page, 'offer-yes');
  await waitPhase(page, 'followMe', 40_000);
  const pip = await page.evaluate(() => window.__pipSpoken.slice());
  expect(pip.some((l) => /empty spots?\./.test(l))).toBe(true);
  expect(pip.some((l) => l.endsWith('more makes ten!'))).toBe(true);
  await followMe(page);
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).events[0]?.outcome).toBe('assisted');
});

test('an assisted order brings the same monster back later with more support; coins add up (SPEC §4.1 step 7)', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openService(page, { skill: 'A2', stage: 2, ops: 'add', seed: 21 });
  const first = await probe(page);
  expect(first.orders).toBe(6);
  expect(first.remaining).toBe(5);
  await serveWrong(page);
  await waitPhase(page, 'building');
  await serveWrong(page);
  await waitPhase(page, 'offerHelp');
  await tapId(page, 'offer-yes');
  await waitPhase(page, 'followMe', 40_000);
  await followMe(page);
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).orders).toBe(7);
  expect((await probe(page)).coins).toBe(3);

  // Play on until the monster comes back.
  for (let i = 1; i < 7; i++) {
    await expect.poll(async () => (await probe(page)).index).toBe(i);
    await waitPhase(page, 'building');
    const s = await probe(page);
    if (s.requeue) {
      expect(s.monster).toBe(first.monster);
      expect(s.factKey).toBe(first.factKey);
      expect(s.stage).toBe(3); // S2 → S3
      expect(i).toBeGreaterThanOrEqual(3); // 3–5 orders after the original at index 0
      await expect.poll(() => page.evaluate(() => window.__spoken.includes("I'm back! Still hungry!"))).toBe(true);
      await serveCorrect(page);
      await expect.poll(async () => (await probe(page)).coins).toBe(3 * (i + 1));
      return;
    }
    await serveCorrect(page);
  }
  throw new Error('the requeued monster never came back');
});
