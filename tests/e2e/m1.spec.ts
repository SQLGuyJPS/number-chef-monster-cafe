import { expect, test } from '@playwright/test';
import {
  followMe,
  openService,
  phases,
  probe,
  ringBell,
  serveCorrect,
  serveWrong,
  tapId,
  trayTo,
  typeNumber,
  waitPhase,
} from './service';

// M1 acceptance (SPEC §14 M1, PLAN §4): tap flows in landscape on Chromium and one WebKit iPad
// project (D36). Speech is stubbed to never fire `end` in every test here, so each flow also
// shows that speech never blocks the game (SPEC §8.1).
const FLOW_PROJECTS = ['chromium-ipad-pro-11', 'webkit-ipad-gen7'];
test.beforeEach(({ browserName: _browser }, info) => {
  test.skip(!FLOW_PROJECTS.includes(info.project.name), 'M1 flows run on the two landscape iPad projects (D36)');
});

const filledCells = (page: import('@playwright/test').Page) => page.locator('[data-testid^="tray-cell-"][data-filled="true"]').count();

test('S3 add: fill order, tap an item to send it back, locked prefill shakes, then a first-try serve', async ({ page }) => {
  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3 });
  const s = await probe(page);
  expect(s.mode).toBe('add');
  expect(await filledCells(page)).toBe(s.prefill);

  // Bell is disabled at the start state (anti-mash): pressing it changes nothing.
  await ringBell(page);
  expect((await probe(page)).phase).toBe('building');
  expect((await probe(page)).events).toHaveLength(0);

  // A new item always takes the first empty cell.
  await tapId(page, 'bin');
  await expect(page.getByTestId(`tray-cell-${s.prefill}`)).toHaveAttribute('data-filled', 'true');
  await expect(page.getByTestId(`tray-cell-${s.prefill + 1}`)).not.toHaveAttribute('data-filled', 'true');

  // There is no "take one back" button in any mode (D82).
  await expect(page.getByTestId('take-back')).toHaveCount(0);

  // A locked (blue) item shakes and stays; tapping the child's item sends it back to the bin.
  await tapId(page, 'tray-cell-0');
  expect((await probe(page)).filled).toBe(s.prefill + 1);
  await tapId(page, `tray-cell-${s.prefill}`);
  expect((await probe(page)).filled).toBe(s.prefill);
  await tapId(page, `tray-cell-${s.prefill - 1}`);
  expect((await probe(page)).filled).toBe(s.prefill);
  await expect(page.getByTestId(`tray-cell-${s.prefill - 1}`)).toHaveAttribute('data-filled', 'true');

  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).events.map((e) => e.outcome ?? e.k)).toEqual(['first', 'coin']);
  // The next monster arrives.
  await expect.poll(async () => (await probe(page)).index).toBe(1);
});

test('tapping food while the order is read stops the order at once and counts the tap (D88)', async ({ page }) => {
  // Real time: the stubbed order line never ends, so it is still "talking" when the child taps.
  await openService(page, { skill: 'A2', stage: 3, ops: 'add', seed: 3, timeScale: 1 });
  const s = await probe(page);
  const before = await page.evaluate(() => ({ cancels: window.__cancels, spoken: window.__spoken.length }));
  await tapId(page, 'bin');
  expect((await probe(page)).filled).toBe(s.prefill + 1);
  const after = await page.evaluate(() => ({ cancels: window.__cancels, spoken: window.__spoken.slice() }));
  expect(after.cancels).toBeGreaterThan(before.cancels);
  // The count is spoken right away instead of being skipped behind the order.
  expect(after.spoken.length).toBeGreaterThan(before.spoken);
});

test('S3 remove: tapping any item removes the last one; the bin puts one back (D30, D42)', async ({ page }) => {
  await openService(page, { skill: 'A2', stage: 3, ops: 'sub', seed: 5 });
  const s = await probe(page);
  expect(s.mode).toBe('remove');
  await expect(page.getByTestId('take-back')).toHaveCount(0);

  await tapId(page, 'tray-cell-0'); // the first item is touched…
  await expect(page.getByTestId(`tray-cell-${s.prefill - 1}`)).not.toHaveAttribute('data-filled', 'true'); // …the last goes
  await expect(page.getByTestId('tray-cell-0')).toHaveAttribute('data-filled', 'true');
  await tapId(page, 'tray-cell-0');
  expect((await probe(page)).filled).toBe(s.prefill - 2);
  await tapId(page, 'bin'); // put back
  expect((await probe(page)).filled).toBe(s.prefill - 1);
  await tapId(page, 'bin');
  await tapId(page, 'bin'); // never above the start
  expect((await probe(page)).filled).toBe(s.prefill);

  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).events[0]?.outcome).toBe('first');
});

test('wrong → wrong → demo → follow-me: the bell pulses and only the child serves (no auto-serve)', async ({ page }) => {
  test.setTimeout(90_000);
  // Real time scale: speech is stubbed to never end, so every line waits for its timeout.
  await openService(page, { skill: 'A1', stage: 3, ops: 'add', seed: 7, timeScale: 1 });

  await serveWrong(page);
  await waitPhase(page, 'countTogether', 10_000);
  await expect(page.getByTestId('model-bubble')).toBeVisible();
  await waitPhase(page, 'building', 30_000);

  await serveWrong(page);
  await waitPhase(page, 'worked', 10_000);
  await waitPhase(page, 'followMe', 40_000);
  expect(await phases(page)).toEqual(['building', 'plateCount', 'countTogether', 'building', 'plateCount', 'worked', 'followMe']);

  await followMe(page);
  await expect(page.getByTestId('bell')).toHaveClass(/pulse/);
  // Nothing serves itself.
  await page.waitForTimeout(2500);
  expect((await probe(page)).phase).toBe('followMe');
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).events[0]?.outcome).toBe('assisted');
});

test('Help at attempt 1 then a wrong serve goes straight to Worked (D29)', async ({ page }) => {
  await openService(page, { skill: 'A2', stage: 3, seed: 11 });
  await tapId(page, 'help');
  await waitPhase(page, 'building');
  await serveWrong(page);
  await waitPhase(page, 'followMe');
  expect(await phases(page)).toEqual(['building', 'countTogether', 'building', 'plateCount', 'worked', 'followMe']);
  await followMe(page);
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).events[0]?.outcome).toBe('assisted');
});

test('wrong then right is "fixed"; Help then right is "afterHint"', async ({ page }) => {
  await openService(page, { skill: 'A1', stage: 2, seed: 2 });
  await expect(page.locator('.tf-cell .pop')).toHaveCount(0); // S2: no counting pops
  await serveWrong(page);
  await waitPhase(page, 'building');
  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).index).toBe(1);
  await tapId(page, 'help');
  await waitPhase(page, 'building');
  await serveCorrect(page);
  await expect
    .poll(async () => (await probe(page)).events.filter((e) => e.k === 'attempt').map((e) => e.outcome))
    .toEqual(['fixed', 'afterHint']);
});

test('S1: the tray starts empty and the child builds only the answer', async ({ page }) => {
  await openService(page, { skill: 'A2', stage: 1, ops: 'sub', seed: 4 });
  const s = await probe(page);
  expect(s).toMatchObject({ prefill: 0, filled: 0, mode: 'add' });
  expect(s.expectedCells).toBe(s.answer);
  await trayTo(page, s.answer);
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).events[0]).toMatchObject({ outcome: 'first', stage: 1 });
});

test('S0: one digit row, a two-digit display, bell disabled while empty, Peek counts as Help', async ({ page }) => {
  await openService(page, { skill: 'A2', stage: 0, seed: 9 });
  for (let d = 0; d <= 9; d++) await expect(page.getByTestId(`digit-${d}`)).toBeVisible();
  await expect(page.getByTestId('tray')).toHaveCount(0);

  await ringBell(page); // empty display: nothing happens
  expect((await probe(page)).phase).toBe('building');

  await typeNumber(page, 123);
  await expect(page.getByTestId('answer-value')).toHaveText('12'); // up to two digits
  await tapId(page, 'backspace');
  await tapId(page, 'backspace');
  await expect(page.getByTestId('answer-value')).toHaveText('');

  // Peek lifts the cloche on the S3 model; the lid brings the digits back.
  await tapId(page, 'peek');
  await expect(page.getByTestId('tray')).toBeVisible();
  await expect(page.getByTestId('cloche-lid')).toBeVisible();
  await tapId(page, 'cloche-lid');
  await expect(page.getByTestId('digit-0')).toBeVisible();

  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).events[0]).toMatchObject({ outcome: 'afterHint', stage: 0 });
});

test('S0 help path: wrong, wrong → Worked and FollowMe on the cloche tray → type → bell (D41)', async ({ page }) => {
  await openService(page, { skill: 'A1', stage: 0, seed: 6 });
  await serveWrong(page);
  await waitPhase(page, 'building');
  await serveWrong(page);
  await waitPhase(page, 'worked');
  await expect(page.getByTestId('tray')).toBeVisible(); // the cloche lifted
  await waitPhase(page, 'followMe');
  await followMe(page); // tray steps, then the digits return
  await expect.poll(async () => (await probe(page)).s0Typing).toBe(true);
  await expect(page.getByTestId('digit-0')).toBeVisible();
  await followMe(page); // type the number
  await expect(page.getByTestId('bell')).toHaveClass(/pulse/);
  await ringBell(page);
  await expect.poll(async () => (await probe(page)).events[0]?.outcome).toBe('assisted');
});

test('a whole service of six orders ends back on the menu board', async ({ page }) => {
  test.setTimeout(60_000);
  await openService(page, { skill: 'A1', stage: 3, seed: 8 });
  for (let i = 0; i < 6; i++) {
    await expect.poll(async () => (await probe(page))?.index).toBe(i);
    await waitPhase(page, 'building');
    await serveCorrect(page);
  }
  await expect(page.getByTestId('screen-menu')).toBeVisible({ timeout: 10_000 });
});

test('the door opens "Take a break?" with Close the café, which goes Home', async ({ page }) => {
  await openService(page, { skill: 'A1' });
  await tapId(page, 'door');
  await expect(page.getByTestId('break-dialog')).toBeVisible();
  await tapId(page, 'keep-cooking');
  await expect(page.getByTestId('screen-service')).toBeVisible();
  await tapId(page, 'door');
  await tapId(page, 'close-cafe');
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('drag from the bin onto the tray places an item (CDP touch, Chromium only)', async ({ page, browserName }) => {
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
  for (let i = 1; i <= 10; i++) await touch('touchMove', from.x + ((to.x - from.x) * i) / 10, from.y + ((to.y - from.y) * i) / 10);
  await expect(page.locator('.drag-ghost')).toBeVisible();
  await touch('touchEnd', to.x, to.y);
  // Dropped on the last cell, but it lands in the first empty one (SPEC §3.3).
  await expect.poll(async () => (await probe(page)).filled).toBe(before + 1);
  await expect(page.getByTestId(`tray-cell-${before}`)).toHaveAttribute('data-filled', 'true');
});
