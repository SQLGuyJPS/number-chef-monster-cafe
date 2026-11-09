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

test('first-ever service: the warm-up order, ghost hand on the bin then the bell; shown once (SPEC §5.4, D26)', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openService(page, { skill: 'A2', stage: 1, ops: 'both', seed: 3, warmUp: true });
  let s = await probe(page);
  expect(s.warmUp).toBe(true);
  expect(s.display).toBe('2 + 1 = ?');
  expect(s.stage).toBe(3); // S3 whatever the skill's stage
  expect(s.orders).toBe(7);

  // No touch for 4 s: the ghost taps the bin. It only points; nothing is placed.
  await expect(page.getByTestId('ghost-hand')).toHaveAttribute('data-target', 'bin', { timeout: 8000 });
  expect((await probe(page)).filled).toBe(2);
  await tapId(page, 'bin');
  await expect(page.getByTestId('ghost-hand')).toHaveCount(0);

  // Item on the tray and 4 more idle seconds: the ghost hovers over the bell and Pip says what to do.
  await expect(page.getByTestId('ghost-hand')).toHaveAttribute('data-target', 'bell', { timeout: 8000 });
  await expect(page.getByTestId('pip')).toBeVisible();
  expect(await page.evaluate(() => window.__pipSpoken.includes('Ring the bell to serve!'))).toBe(true);
  // Nothing serves itself.
  await page.waitForTimeout(1500);
  expect((await probe(page)).phase).toBe('building');
  await ringBell(page);

  // Coins, but no attempt event; then the chosen skill begins.
  await expect.poll(async () => (await probe(page)).index).toBe(1);
  s = await probe(page);
  expect(s.events.map((e) => e.k)).toEqual(['coin']);
  expect(s.coins).toBe(3);
  expect(s.warmUp).toBe(false);
  expect(s.stage).toBe(1);

  // Shown once per device: the next service starts straight on the skill.
  await tapId(page, 'door');
  await tapId(page, 'close-cafe');
  await tapId(page, 'open-cafe');
  await page.waitForTimeout(150);
  await tapId(page, 'tile-A2');
  await waitPhase(page, 'building');
  expect((await probe(page)).warmUp).toBe(false);
});

test('every monster draws all five expressions and its reaction; reduced motion keeps still poses (SPEC §7.2, D100)', async ({
  browser,
}) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const page = await browser.newPage({ reducedMotion });
    await page.goto('./?gallery');
    const ids = ['blobbo', 'gruffles', 'zibbit', 'mimsy', 'chompers', 'wobbleton'];
    for (const id of ids) {
      const row = page.getByTestId(`gallery-${id}`);
      const shown = await row
        .locator('.monster-art')
        .evaluateAll((els) => els.map((e) => `${e.getAttribute('data-monster')}:${e.getAttribute('data-expression')}`));
      expect(shown).toEqual(['idle', 'delight', 'eat', 'puzzled', 'sleepy', 'delight'].map((x) => `${id}:${x}`));
      // Something is actually drawn: the figure has a real size.
      const box = await row.locator('.monster-art .m-figure').first().boundingBox();
      expect(box!.width).toBeGreaterThan(60);
    }
    const anims = await page
      .locator('.monster-art .m-figure')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).animationName));
    if (reducedMotion === 'reduce') expect(anims.every((a) => a === 'none')).toBe(true);
    else expect(anims.some((a) => a !== 'none')).toBe(true);
    await page.close();
  }
});

test('eat sequence: fly, chew, react within 4 s, then 3 coins land in the jar; a tap skips (SPEC §5.6, D101)', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 5, timeScale: 1 });
  await waitPhase(page, 'building');
  // Record each eat step with its time, from the moment the bell is pressed.
  await page.evaluate(() => {
    const w = window as unknown as { __eat: [string, number][] };
    w.__eat = [];
    setInterval(() => {
      const e = window.__ncmc.service()?.eat;
      const last = w.__eat.at(-1)?.[0];
      if (e && e.step !== last) w.__eat.push([e.step, performance.now()]);
    }, 20);
  });
  const t0 = await page.evaluate(() => performance.now());
  await serveCorrect(page);
  await expect(page.getByTestId('service-jar')).toHaveAttribute('data-count', '3', { timeout: 10_000 });
  const steps = await page.evaluate(() => (window as unknown as { __eat: [string, number][] }).__eat);
  expect(steps.map((s) => s[0])).toEqual(['fly', 'chew', 'react', 'coins']);
  const coinsAt = steps.find((s) => s[0] === 'coins')![1];
  // Bell lead (0.5 s) + eat and react ≤ 4 s; a little slack for the 20 ms sampling and the tap.
  expect(coinsAt - t0).toBeLessThan(500 + 4000 + 300);
  expect((await probe(page)).landed).toBe(3);

  // Second order: tap during the flight and it goes straight to the coins.
  await expect.poll(async () => (await probe(page)).index, { timeout: 10_000 }).toBe(1);
  await waitPhase(page, 'building');
  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).eat?.step).toBe('fly');
  await tapId(page, 'skip');
  await expect.poll(async () => (await probe(page)).eat?.step ?? 'gone', { timeout: 1500 }).toMatch(/coins|gone/);
  await expect(page.getByTestId('service-jar')).toHaveAttribute('data-count', '6', { timeout: 3000 });
});
