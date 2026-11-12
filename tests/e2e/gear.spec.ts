import { expect, test, type Page } from '@playwright/test';
import { startApp, tap } from './helpers';

// D94, D95: a tap on the Home gear opens the "For grown-ups" popup; a 2 s hold on its circle
// (a ring fills clockwise from the top) opens the playtest tools. Playwright can't hold a touch,
// so the hold is a mouse press, which takes the same pointer path.
async function pressCircle(page: Page): Promise<void> {
  const box = (await page.getByTestId('gear-hold').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
}

const ringOffset = (page: Page) =>
  page
    .getByTestId('gear-hold-ring')
    .evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset));

async function openTools(page: Page): Promise<void> {
  await tap(page, page.getByTestId('gear'));
  await pressCircle(page);
  await expect(page.getByTestId('parent-screen')).toBeVisible({ timeout: 5000 });
  await page.mouse.up();
}

test('a gear tap opens the popup at once; letting go early empties the ring and opens nothing', async ({
  page,
}) => {
  await startApp(page);
  await tap(page, page.getByTestId('gear'));
  await expect(page.getByTestId('gear-dialog')).toBeVisible();
  await expect(page.getByTestId('gear-dialog')).toContainText('Press and hold the circle');
  const full = await ringOffset(page);
  expect(full).toBeGreaterThan(0);

  await pressCircle(page);
  await page.waitForTimeout(900);
  const mid = await ringOffset(page);
  expect(mid).toBeLessThan(full * 0.8);
  expect(mid).toBeGreaterThan(0);
  await page.mouse.up();
  await expect.poll(() => ringOffset(page)).toBeCloseTo(full, 0);
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('parent-screen')).toHaveCount(0);
  await expect(page.getByTestId('gear-dialog')).toBeVisible();
});

test('holding the circle until the ring closes opens the playtest tools', async ({ page }) => {
  await startApp(page);
  await openTools(page);
  await expect(page.getByTestId('gear-dialog')).toHaveCount(0);
  await expect(page.getByTestId('debug-version')).toHaveText(/^\d+\.\d+\.\d+\+\w+$/);
  await expect(page.getByTestId('skill-picker')).toBeVisible();
  await expect(page.getByTestId('audio-test')).toBeVisible();
});

test('Close, a tap outside and the back gesture all close the popup without the break dialog', async ({
  page,
}) => {
  await startApp(page);
  await tap(page, page.getByTestId('gear'));
  await tap(page, page.getByTestId('gear-close'));
  await expect(page.getByTestId('gear-dialog')).toHaveCount(0);

  await tap(page, page.getByTestId('gear'));
  const scrim = (await page.getByTestId('gear-dialog').boundingBox())!;
  await page.touchscreen.tap(scrim.x + 10, scrim.y + 10);
  await expect(page.getByTestId('gear-dialog')).toHaveCount(0);

  await tap(page, page.getByTestId('gear'));
  await page.goBack();
  await expect(page.getByTestId('gear-dialog')).toHaveCount(0);
  await expect(page.getByTestId('break-dialog')).toHaveCount(0);
  await expect(page.getByTestId('screen-home')).toBeVisible();
});

test('a stage picked there persists; Back to the café and the back gesture return Home', async ({
  page,
}) => {
  await startApp(page);
  await openTools(page);
  await page.getByTestId('stage-A1').selectOption('0');
  await page.getByTestId('ops-A1').selectOption('sub');
  await tap(page, page.getByTestId('parent-back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();

  await openTools(page);
  await expect(page.getByTestId('stage-A1')).toHaveValue('0');
  await expect(page.getByTestId('ops-A1')).toHaveValue('sub');

  // Never trapped (SPEC §2.3): back leaves the grown-ups' screen for Home, with no break dialog.
  await page.goBack();
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await expect(page.getByTestId('break-dialog')).toHaveCount(0);
  // The back guard is still in place for the child afterwards.
  await tap(page, page.getByTestId('open-cafe'));
  await page.goBack();
  await expect(page.getByTestId('break-dialog')).toBeVisible();
});

// D102: on iOS the native picker of a <select> swallows the finger's lift, so the single-pointer
// guard used to hold that pointer forever and every later tap in the app did nothing. The lost
// lift is reproduced with a lone pointerdown on the select.
test('a stage picker whose lift is lost does not freeze later taps', async ({ page }) => {
  await startApp(page);
  await openTools(page);
  const stage = page.getByTestId('stage-A3');
  await stage.dispatchEvent('pointerdown', {
    pointerId: 77,
    pointerType: 'touch',
    isPrimary: true,
  });
  await stage.selectOption('1');
  await tap(page, page.getByTestId('parent-back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await tap(page, page.getByTestId('open-cafe'));
  await expect(page.getByTestId('open-cafe')).toHaveCount(0);
});

test('the playtest tools behind the gear open the speed test (D112)', async ({ page }) => {
  await startApp(page);
  await openTools(page);
  await page.getByTestId('open-speedtest').scrollIntoViewIfNeeded();
  await tap(page, page.getByTestId('open-speedtest'));
  await expect(page.getByTestId('st-start')).toBeVisible();
});
