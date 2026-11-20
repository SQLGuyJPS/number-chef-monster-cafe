import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { gateAnswer, holdGear, openGrownUps, startApp, tap, typeGate } from './helpers';
import { openService, probe, serveCorrect, tapId } from './service';

// M3b acceptance (SPEC §14, §12, §11.6; D134–D136): parent gate lockout and auto-lock; the parent
// area is not reachable during a service; export → reset → import round trip with the checksum
// verified; Reset touches only ncmc* data and keeps `snapshots`. Long flows run on the two iPads;
// the gate itself also runs in rotated portrait, where it must not be rotated.
const IPADS = ['chromium-ipad-pro-11', 'webkit-ipad-gen7'];
const onIpads = (name: string) => test.skip(!IPADS.includes(name), 'long flows on the two iPads');

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** The checksum as SPEC §11.6 defines it, recomputed outside the app (D136). */
function verify(json: string): { events: { id: string }[]; settings: Record<string, unknown> } {
  const f = JSON.parse(json) as {
    app: string;
    schemaVersion: number;
    events: { id: string }[];
    settings: Record<string, unknown>;
    checksum: string;
  };
  expect(Object.keys(f)).toEqual(['app', 'schemaVersion', 'deviceId', 'deviceLabel', 'exportedAt', 'events', 'settings', 'checksum']);
  expect(f.app).toBe('number-chef-monster-cafe');
  expect(f.schemaVersion).toBe(1);
  expect(f.checksum).toBe(sha256(JSON.stringify({ events: f.events, settings: f.settings })));
  return f;
}

/** Web Share stub: records the shared file; `accept` decides which MIME types canShare allows. */
async function stubShare(page: Page, accept: 'json' | 'text' | 'none'): Promise<void> {
  await page.addInitScript((mode) => {
    const w = window as unknown as { __shared: { name: string; type: string; text: string }[] };
    w.__shared = [];
    const nav = navigator as unknown as Record<string, unknown>;
    if (mode === 'none') {
      Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
      Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined, configurable: true });
      return;
    }
    nav['canShare'] = (d: { files?: File[] }) =>
      !!d.files?.every((f) => (mode === 'json' ? true : f.type === 'text/plain'));
    nav['share'] = async (d: { files: File[] }) => {
      for (const f of d.files) w.__shared.push({ name: f.name, type: f.type, text: await f.text() });
    };
  }, accept);
}

const shared = (page: Page) =>
  page.evaluate(() => (window as unknown as { __shared: { name: string; type: string; text: string }[] }).__shared);

async function wrong(page: Page, gate = 'parent-gate'): Promise<void> {
  const a = await gateAnswer(page);
  await typeGate(page, a + 1, gate);
}

test('the gate: wrong answers, a 30 s lockout with no countdown, then the right answer opens', async ({ page }, info) => {
  await startApp(page);
  await holdGear(page);
  // Not rotated, full screen (SPEC §2.2), and asks 6–9 × 7–9 (never spoken).
  const vp = page.viewportSize()!;
  const box = (await page.getByTestId('parent-gate').boundingBox())!;
  expect(box.width).toBeCloseTo(vp.width, 0);
  expect(box.height).toBeCloseTo(vp.height, 0);
  await expect(page.getByTestId('gate-question')).toHaveText(/^[6-9] × [7-9] = \?$/);
  await expect(page.getByTestId('stage')).toHaveCount(0);
  if (!IPADS.includes(info.project.name)) return;

  // A wrong answer gets a new question and a note.
  await wrong(page);
  await expect(page.getByTestId('gate-note')).toHaveText('Not quite. Try this one.');
  await expect(page.getByTestId('parent-screen')).toHaveCount(0);
  await wrong(page);
  await wrong(page);
  await expect(page.getByTestId('gate-locked')).toBeVisible();
  await expect(page.getByTestId('gate-locked')).not.toContainText(/\d/);
  await expect(page.getByTestId('gate-question')).toHaveCount(0);
  // The locked pad takes no touches, so no key can show a pressed colour (D137).
  await expect(page.getByTestId('gate-pad')).toHaveCSS('pointer-events', 'none');
  // Keys do nothing while locked; leaving and coming back does not clear the lockout.
  await tap(page, page.getByTestId('gate-key-5'));
  await tapId(page, 'gate-cancel');
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await holdGear(page);
  await expect(page.getByTestId('gate-locked')).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(page.getByTestId('gate-locked')).toBeVisible();
  // 30 s later (clock skewed through the e2e hook) the pad comes back with a fresh question.
  await page.evaluate(() => window.__ncmc.skewParentClock(30_000));
  await expect(page.getByTestId('gate-question')).toBeVisible({ timeout: 3000 });
  await typeGate(page, await gateAnswer(page));
  await expect(page.getByTestId('parent-screen')).toBeVisible();
});

test('in a short browser window the gate scrolls and its title is never cut off at the top (D138)', async ({ page }, info) => {
  onIpads(info.project.name);
  // Safari in landscape with its tab bar leaves about 330 px of an 844 px-wide phone screen.
  await page.setViewportSize({ width: 844, height: 280 });
  await startApp(page);
  await holdGear(page);
  const title = page.getByTestId('parent-gate').locator('h1');
  const top = (await title.boundingBox())!.y;
  expect(top).toBeGreaterThanOrEqual(0);
  // The rest stays reachable by scrolling.
  await page.getByTestId('gate-key-ok').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('gate-key-ok')).toBeInViewport();
});

test('the parent area locks after 1 minute idle and on leaving; every visit asks again', async ({ page }, info) => {
  onIpads(info.project.name);
  await startApp(page);
  await openGrownUps(page);
  // 45 seconds is not enough; input restarts the count (D137).
  await page.evaluate(() => window.__ncmc.skewParentClock(45_000));
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('parent-screen')).toBeVisible();
  await page.getByTestId('setting-orders').selectOption('4');
  await page.evaluate(() => window.__ncmc.skewParentClock(45_000));
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('parent-screen')).toBeVisible();
  await page.evaluate(() => window.__ncmc.skewParentClock(15_000 + 1000));
  await expect(page.getByTestId('screen-home')).toBeVisible({ timeout: 3000 });
  await expect(page.getByTestId('parent-screen')).toHaveCount(0);
  // Back in: the gate again. Leave by the button, then by the back gesture: both lock.
  await holdGear(page);
  await typeGate(page, await gateAnswer(page));
  await tapId(page, 'parent-back');
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await holdGear(page);
  await expect(page.getByTestId('parent-gate')).toBeVisible();
  await typeGate(page, await gateAnswer(page));
  await page.goBack();
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await expect(page.getByTestId('break-dialog')).toHaveCount(0);
  await holdGear(page);
  await expect(page.getByTestId('parent-gate')).toBeVisible();
});

test('the parent area cannot be reached during a service; orders per service applies', async ({ page }, info) => {
  onIpads(info.project.name);
  await openService(page, { skill: 'A1', stage: 3 });
  // The gear lives only on Home (SPEC §12): not on the service screen, and back gives the break dialog.
  await expect(page.getByTestId('gear')).toHaveCount(0);
  await page.goBack();
  await expect(page.getByTestId('break-dialog')).toBeVisible();
  await expect(page.getByTestId('parent-gate')).toHaveCount(0);
  await tapId(page, 'close-cafe');
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await openGrownUps(page);
  await page.getByTestId('setting-orders').selectOption('4');
  await tapId(page, 'parent-back');
  await tapId(page, 'open-cafe');
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');
  await tapId(page, 'tile-A1');
  await expect.poll(async () => (await probe(page))?.orders, { timeout: 10_000 }).toBe(4);
  await expect(page.getByTestId('gear')).toHaveCount(0);
});

test('export (share sheet) → reset → replace import round trip, checksum verified (SPEC §11.6)', async ({ page }, info) => {
  onIpads(info.project.name);
  test.setTimeout(120_000);
  await stubShare(page, 'json');
  await openService(page, { skill: 'A1', stage: 3 });
  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).index, { timeout: 20_000 }).toBe(1);
  await tapId(page, 'door');
  await tapId(page, 'close-cafe');
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await openGrownUps(page);
  await page.getByTestId('setting-orders').selectOption('8');
  await page.getByTestId('setting-reduced-motion').check();
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  const before = (await page.evaluate(() => window.__ncmc.progress()))!;
  expect(before.balance).toBe(3);

  // Export: the share sheet gets a .json file whose checksum matches.
  await expect(page.getByTestId('export')).toBeEnabled();
  await page.getByTestId('export').click();
  await expect(page.getByTestId('export-result')).toHaveText('Backup shared.');
  await expect(page.getByTestId('last-backup')).toHaveText('today');
  const [file] = await shared(page);
  expect(file!.name).toMatch(/^number-chef-backup-\d{4}-\d{2}-\d{2}\.json$/);
  expect(file!.type).toBe('application/json');
  const exported = verify(file!.text);
  expect(exported.events.map((e) => e.id).sort()).toEqual(before.events.map((e) => e.id).sort());
  expect(exported.settings).toMatchObject({ ordersPerService: 8, reducedMotion: true });

  // Reset: confirm, then a second multiplication question; the app restarts empty.
  await page.getByTestId('reset').click();
  await expect(page.getByTestId('reset-confirm')).toContainText('Coins go from 3 to 0');
  await page.getByTestId('reset-yes').click();
  await expect(page.getByTestId('confirm-gate')).toBeVisible();
  await typeGate(page, await gateAnswer(page), 'confirm-gate');
  await expect(page.getByTestId('splash')).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(() => !!window.__ncmc);
  const afterReset = (await page.evaluate(() => window.__ncmc.stores()))!;
  expect(afterReset.counts['events']).toBe(0);
  expect(afterReset.counts['settings']).toBe(0);
  expect(afterReset.snapshot?.reason).toBe('reset');
  expect(afterReset.snapshot?.events).toHaveLength(before.count);
  await expect(page.locator('html')).not.toHaveClass(/reduce-motion/);
  await tap(page, page.getByTestId('splash'));
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '0');

  // Replace import: the summary, a second question, then the same log and settings are back.
  await openGrownUps(page);
  await page.getByTestId('import-file').setInputFiles({ name: file!.name, mimeType: 'application/json', buffer: Buffer.from(file!.text) });
  await expect(page.getByTestId('import-summary')).toBeVisible();
  await expect(page.getByTestId('import-coins')).toHaveText('3');
  await page.getByTestId('import-confirm').click();
  await typeGate(page, await gateAnswer(page), 'confirm-gate');
  await expect(page.getByTestId('splash')).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(() => !!window.__ncmc);
  const restored = (await page.evaluate(() => window.__ncmc.progress()))!;
  expect(restored.events.map((e) => e.id).sort()).toEqual(before.events.map((e) => e.id).sort());
  expect(restored.balance).toBe(3);
  const st = (await page.evaluate(() => window.__ncmc.stores()))!;
  expect(st.snapshot?.reason).toBe('replace');
  await expect(page.locator('html')).toHaveClass(/reduce-motion/);
  await tap(page, page.getByTestId('splash'));
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '3');
  await openGrownUps(page);
  await expect(page.getByTestId('setting-orders')).toHaveValue('8');
});

test('export falls back to a text/plain share, then to a download; a changed file needs two confirmations', async ({ page }, info) => {
  onIpads(info.project.name);
  await stubShare(page, 'text');
  await startApp(page);
  await openGrownUps(page);
  await page.getByTestId('export').click();
  await expect(page.getByTestId('export-result')).toHaveText('Backup shared.');
  const [file] = await shared(page);
  expect(file!.type).toBe('text/plain');
  expect(file!.name).toMatch(/\.json$/);
  verify(file!.text);

  // A file changed after export: warned twice before the summary; Cancel leaves everything alone.
  const f = JSON.parse(file!.text) as { settings: Record<string, unknown> };
  f.settings['ordersPerService'] = 4;
  await page.getByTestId('import-file').setInputFiles({ name: 'x.json', mimeType: 'text/plain', buffer: Buffer.from(JSON.stringify(f)) });
  await expect(page.getByTestId('checksum-warning')).toContainText("doesn't match");
  await page.getByTestId('checksum-continue').click();
  await expect(page.getByTestId('checksum-warning')).toContainText('Are you sure?');
  await page.getByTestId('checksum-continue').click();
  await expect(page.getByTestId('import-summary')).toBeVisible();
  await page.getByTestId('import-cancel').click();
  await expect(page.getByTestId('import-summary')).toHaveCount(0);
  // Not a backup at all.
  await page.getByTestId('import-file').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.getByTestId('import-error')).toHaveText("This file isn't a Number Chef backup.");
});

test('with no Web Share the backup downloads as a .json file', async ({ page }, info) => {
  onIpads(info.project.name);
  await stubShare(page, 'none');
  await startApp(page);
  await openGrownUps(page);
  await expect(page.getByTestId('export')).toBeEnabled();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
  expect(download.suggestedFilename()).toMatch(/^number-chef-backup-.*\.json$/);
  verify(readFileSync((await download.path())!, 'utf8'));
  await expect(page.getByTestId('export-link')).toBeVisible();
});

test('without IndexedDB, Back up still works but Restore is off (the restart would lose it)', async ({ page }, info) => {
  onIpads(info.project.name);
  await page.addInitScript(() => {
    IDBFactory.prototype.open = () => {
      throw new Error('blocked for the test');
    };
  });
  await startApp(page);
  await openGrownUps(page);
  await expect(page.getByTestId('import-unavailable')).toBeVisible();
  await expect(page.getByTestId('import')).toBeDisabled();
  await expect(page.getByTestId('export')).toBeEnabled();
  await expect(page.getByTestId('reset')).toBeEnabled();
});

test('Reset keeps the snapshot and touches only ncmc* data (SPEC §11.5)', async ({ page }, info) => {
  onIpads(info.project.name);
  await startApp(page);
  // Another app on the same github.io origin.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        localStorage.setItem('other-app-key', 'keep me');
        const r = indexedDB.open('other-app', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('things', { keyPath: 'id' });
        r.onsuccess = () => {
          const tx = r.result.transaction('things', 'readwrite');
          tx.objectStore('things').put({ id: 1, v: 'keep me' });
          tx.oncomplete = () => {
            r.result.close();
            resolve();
          };
        };
        r.onerror = () => reject(new Error('open failed'));
      }),
  );
  const dev = (await page.evaluate(() => window.__ncmc.stores()))!.deviceId;
  await openGrownUps(page);
  await page.getByTestId('reset').click();
  await page.getByTestId('reset-yes').click();
  // Cancel on the second question changes nothing.
  await tapId(page, 'gate-cancel');
  await expect(page.getByTestId('parent-screen')).toBeVisible();
  await page.getByTestId('reset').click();
  await page.getByTestId('reset-yes').click();
  await typeGate(page, await gateAnswer(page), 'confirm-gate');
  await expect(page.getByTestId('splash')).toBeVisible({ timeout: 10_000 });
  await page.waitForFunction(() => !!window.__ncmc);
  const st = (await page.evaluate(() => window.__ncmc.stores()))!;
  expect(st.snapshot?.reason).toBe('reset');
  expect(st.deviceId).not.toBe(dev);
  const other = await page.evaluate(
    () =>
      new Promise<{ key: string | null; row: unknown }>((resolve) => {
        const r = indexedDB.open('other-app', 1);
        r.onsuccess = () => {
          const g = r.result.transaction('things').objectStore('things').get(1);
          g.onsuccess = () => resolve({ key: localStorage.getItem('other-app-key'), row: g.result });
        };
      }),
  );
  expect(other).toEqual({ key: 'keep me', row: { id: 1, v: 'keep me' } });
});
