import { expect, test, type Page } from '@playwright/test';
import { tap } from './helpers';
import { openService, probe, serveCorrect, stubSpeechNeverEnds, tapId, waitPhase } from './service';

// M3a (SPEC §14): the event log on disk, resume, per-skill settings. Long flows on the two iPads.
const FLOW_PROJECTS = ['chromium-ipad-pro-11', 'webkit-ipad-gen7'];
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(!FLOW_PROJECTS.includes(info.project.name), 'flows run on the two landscape iPad projects');
});

interface Stored {
  balance: number;
  count: number;
  kinds: string[];
  events: { k: string; svc?: string; partial?: boolean; tip?: number; served?: number }[];
  resume: { index: number; svc: string } | undefined;
}

const stored = (page: Page): Promise<Stored> =>
  page.evaluate(() => (window.__ncmc as unknown as { progress(): Promise<Stored> }).progress());

/** A reload is a fresh app launch: the hooks come back, the e2e fast-forward has to be set again. */
async function relaunch(page: Page): Promise<void> {
  await page.reload();
  await page.waitForFunction(() => !!window.__ncmc);
  await page.evaluate(() => window.__ncmc.setTimeScale(0.1));
  await tap(page, page.getByTestId('splash'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
}

async function serveTo(page: Page, index: number): Promise<void> {
  for (;;) {
    const s = await probe(page);
    if (s.index >= index) break;
    await serveCorrect(page);
    await expect.poll(async () => (await probe(page)).index, { timeout: 20_000 }).toBe(s.index + 1);
    await waitPhase(page, 'building');
  }
}

test('coins and the plan survive a reload: the service is offered back and continues the stored orders (SPEC §5.8, §11.6)', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openService(page, { skill: 'A1', stage: 3, ops: 'both', seed: 5 });
  await serveTo(page, 2);
  const at2 = await probe(page);
  // Each completed problem wrote attempt + coin with the resume row in the same transaction.
  await expect.poll(async () => (await stored(page)).balance).toBe(6);
  const before = await stored(page);
  expect(before.kinds.filter((k) => k === 'coin')).toHaveLength(2);
  expect(before.kinds.filter((k) => k === 'attempt')).toHaveLength(2);
  expect(before.resume?.index).toBe(2);

  // "Killed" mid-service: reload without closing the café.
  await relaunch(page);
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '6');
  await expect(page.getByTestId('resume-dialog')).toBeVisible();
  await expect(page.getByTestId('resume-dialog')).toContainText('Continue dinner service?');
  await tapId(page, 'resume-yes');
  await expect(page.getByTestId('screen-service')).toBeVisible();
  await waitPhase(page, 'building');
  const back = await probe(page);
  expect(back.index).toBe(2);
  expect(back.factKey).toBe(at2.factKey);
  expect(back.monster).toBe(at2.monster);
  expect(back.line).toBe(at2.line);

  // Finish: Results counts this service's coins from both sittings, plus the tip.
  for (;;) {
    const s = await probe(page);
    await serveCorrect(page);
    if (s.index === s.orders - 1) break;
    await expect.poll(async () => (await probe(page)).index, { timeout: 20_000 }).toBe(s.index + 1);
    await waitPhase(page, 'building');
  }
  await expect(page.getByTestId('screen-results')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '23');
  const after = await stored(page);
  expect(after.balance).toBe(23);
  const ends = after.events.filter((e) => e.k === 'serviceEnd');
  expect(ends).toHaveLength(1);
  expect(ends[0]).toMatchObject({ partial: false, tip: 5, served: 6 });
  expect(after.resume).toBeUndefined();

  // A finished service is not offered again.
  await relaunch(page);
  await page.waitForTimeout(800);
  await expect(page.getByTestId('resume-dialog')).toHaveCount(0);
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '23');
});

test('Close the café writes a partial serviceEnd with no tip; the offer comes on the next launch; Not now clears it', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openService(page, { skill: 'A2', stage: 3, seed: 9 });
  await serveTo(page, 1);
  await tapId(page, 'door');
  await tapId(page, 'close-cafe');
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '3');
  // Not offered in the same launch, right after the child chose to close.
  await page.waitForTimeout(500);
  await expect(page.getByTestId('resume-dialog')).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).kinds.at(-1)).toBe('serviceEnd');
  const s = await stored(page);
  expect(s.events.at(-1)).toMatchObject({ k: 'serviceEnd', partial: true, tip: 0, served: 1 });
  expect(s.resume?.index).toBe(1);

  await relaunch(page);
  await expect(page.getByTestId('resume-dialog')).toBeVisible();
  await tapId(page, 'resume-no');
  await expect(page.getByTestId('resume-dialog')).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).resume).toBeUndefined();
  await relaunch(page);
  await page.waitForTimeout(800);
  await expect(page.getByTestId('resume-dialog')).toHaveCount(0);
  await expect(page.getByTestId('coin-jar')).toHaveAttribute('data-count', '3');
});

test('a killed service declined with Not now still gets its partial serviceEnd and counts as a service (D125)', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await openService(page, { skill: 'A1', stage: 3, seed: 3 });
  await serveTo(page, 1);
  await expect.poll(async () => (await stored(page)).resume?.index).toBe(1);
  await relaunch(page);
  await tapId(page, 'resume-no');
  await expect.poll(async () => (await stored(page)).resume).toBeUndefined();
  const s = await stored(page);
  const ends = s.events.filter((e) => e.k === 'serviceEnd');
  expect(ends).toHaveLength(1);
  expect(ends[0]).toMatchObject({ partial: true, tip: 0, served: 1 });
  expect(s.balance).toBe(3);
});

async function openGrownUps(page: Page): Promise<void> {
  await tap(page, page.getByTestId('gear'));
  const box = (await page.getByTestId('gear-hold').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.getByTestId('parent-screen')).toBeVisible({ timeout: 5000 });
  await page.mouse.up();
}

test('the Skills list behind the gear changes the next service; progress and storage are shown (SPEC §12 M3a)', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await stubSpeechNeverEnds(page);
  await page.goto('./');
  await page.waitForFunction(() => !!window.__ncmc);
  await page.evaluate(async () => {
    await window.__ncmc.setWarmupShown(true);
    window.__ncmc.setTimeScale(0.1);
  });
  await tap(page, page.getByTestId('splash'));
  await openGrownUps(page);
  await expect(page.getByTestId('stage-A2')).toHaveValue('3');
  await page.getByTestId('stage-A2').selectOption('0');
  await page.getByTestId('ops-A2').selectOption('sub');
  await expect.poll(async () => (await stored(page)).kinds.filter((k) => k === 'skillConfig').length).toBe(2);
  // Storage status (feature-detected): filled in, not left on "Checking".
  await expect(page.getByTestId('storage-kind')).toHaveText('saved on this device');
  await expect(page.getByTestId('storage-persisted')).not.toBeEmpty();
  await expect(page.getByTestId('storage-usage')).toHaveText(/MB of|not available on this device/);
  await expect(page.getByTestId('progress-A2-services')).toHaveText('0');

  await tapId(page, 'parent-back');
  await tapId(page, 'open-cafe');
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');
  await tapId(page, 'tile-A2');
  await waitPhase(page, 'building');
  const s = await probe(page);
  expect(s.stage).toBe(0);
  expect(s.form).toBe('sub');
  await serveCorrect(page);
  await expect.poll(async () => (await probe(page)).index, { timeout: 20_000 }).toBe(1);
  await tapId(page, 'door');
  await tapId(page, 'close-cafe');
  await expect.poll(async () => (await stored(page)).kinds.at(-1)).toBe('serviceEnd');

  // The settings are events, so they survive a relaunch; the progress list counts the service.
  await relaunch(page);
  await tapId(page, 'resume-no');
  await openGrownUps(page);
  await expect(page.getByTestId('stage-A2')).toHaveValue('0');
  await expect(page.getByTestId('ops-A2')).toHaveValue('sub');
  await expect(page.getByTestId('progress-A2-services')).toHaveText('1');
  await expect(page.getByTestId('progress-A2-problems')).toHaveText('1');
  await expect(page.getByTestId('progress-coins')).toContainText('3 in the jar');
});
