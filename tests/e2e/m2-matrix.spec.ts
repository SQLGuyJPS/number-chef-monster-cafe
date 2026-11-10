import { expect, test } from '@playwright/test';
import { isRotated, tap } from './helpers';
import { openService, probe, serveCorrect, stubSpeechNeverEnds, tapId, waitPhase } from './service';

// M2 full matrix (SPEC §13.5, §14 M2): every project, landscape and rotated portrait.

test('first run reaches the first order in ≤ 2 taps after Splash: Open the Café, then a tile (SPEC §14 M2)', async ({
  page,
}) => {
  await stubSpeechNeverEnds(page);
  await page.goto('./');
  await tap(page, page.getByTestId('splash'));
  let taps = 0;
  await tap(page, page.getByTestId('open-cafe'));
  taps++;
  await expect(page.getByTestId('screen-menu')).toBeVisible();
  await page.waitForTimeout(150); // the menu reads the device's settings on open
  await tap(page, page.getByTestId('tile-A1'));
  taps++;
  await expect(page.getByTestId('screen-service')).toBeVisible();
  await waitPhase(page, 'building');
  expect(taps).toBeLessThanOrEqual(2);
  // A fresh device starts with the warm-up order (SPEC §5.4).
  expect((await probe(page)).warmUp).toBe(true);
});

test('serve an order by tap; the monster eats and the next one arrives (taps land rotated too)', async ({
  page,
}, info) => {
  await openService(page, { skill: 'A1', stage: 3, ops: 'add', seed: 2 });
  expect(await isRotated(page)).toBe(/portrait/.test(info.project.name));
  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).index, { timeout: 10_000 }).toBe(1);
  await expect(page.getByTestId('service-jar')).toHaveAttribute('data-count', '3');
  await expect(page.getByTestId('monster').locator('.monster-art')).toHaveCount(1);
});

test('drag from the bin onto the tray places an item, in landscape and rotated portrait (CDP touch)', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Playwright has no touch drag; CDP is Chromium-only (SPEC §13.5)');
  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3 });
  const before = (await probe(page)).filled;
  const bin = (await page.getByTestId('bin').boundingBox())!;
  const cell = (await page.getByTestId('tray-cell-9').boundingBox())!;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const from = { x: bin.x + bin.width / 2, y: bin.y + bin.height / 2 };
  const to = { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 };
  await touch('touchStart', from.x, from.y);
  for (let i = 1; i <= 10; i++)
    await touch('touchMove', from.x + ((to.x - from.x) * i) / 10, from.y + ((to.y - from.y) * i) / 10);
  await expect(page.locator('.drag-ghost')).toBeVisible();
  await touch('touchEnd', to.x, to.y);
  await expect.poll(async () => (await probe(page)).filled).toBe(before + 1);

  // And back: drag the last item off onto the bin (add mode), which returns it.
  const last = (await page.getByTestId(`tray-cell-${before}`).boundingBox())!;
  const a = { x: last.x + last.width / 2, y: last.y + last.height / 2 };
  await touch('touchStart', a.x, a.y);
  for (let i = 1; i <= 10; i++)
    await touch('touchMove', a.x + ((from.x - a.x) * i) / 10, a.y + ((from.y - a.y) * i) / 10);
  await touch('touchEnd', from.x, from.y);
  await expect.poll(async () => (await probe(page)).filled).toBe(before);
});

test('Results after a short service: Another service and Change dish are tappable on every device', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await openService(page, { skill: 'A1', stage: 3, ops: 'add', seed: 6 });
  for (let i = 0; i < 6; i++) {
    await expect.poll(async () => (await probe(page))?.index, { timeout: 10_000 }).toBe(i);
    await waitPhase(page, 'building');
    await serveCorrect(page);
  }
  await expect(page.getByTestId('screen-results')).toBeVisible({ timeout: 10_000 });
  await tapId(page, 'results-change');
  await expect(page.getByTestId('screen-menu')).toBeVisible();
});
