import { expect, test, type Page } from '@playwright/test';
import { startApp, tap } from './helpers';

// D94: before M3a a 2 s hold on the Home gear opens the playtest tools (the installed app can't
// open `?debug`). Playwright can't hold a touch, so the hold is a mouse press (same pointer path).
async function holdGear(page: Page, ms: number): Promise<void> {
  const box = (await page.getByTestId('gear').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test('a short tap on the gear does nothing; a 2 s hold opens the playtest tools', async ({ page }) => {
  await startApp(page);
  await tap(page, page.getByTestId('gear'));
  await holdGear(page, 800);
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('parent-screen')).toHaveCount(0);
  await expect(page.getByTestId('screen-home')).toBeVisible();

  await holdGear(page, 2300);
  await expect(page.getByTestId('parent-screen')).toBeVisible();
  await expect(page.getByTestId('debug-version')).toHaveText(/^\d+\.\d+\.\d+\+\w+$/);
  await expect(page.getByTestId('skill-picker')).toBeVisible();
  await expect(page.getByTestId('audio-test')).toBeVisible();
});

test('a stage picked there persists; Back to the café and the back gesture return Home', async ({ page }) => {
  await startApp(page);
  await holdGear(page, 2300);
  await page.getByTestId('stage-A1').selectOption('0');
  await page.getByTestId('ops-A1').selectOption('sub');
  await tap(page, page.getByTestId('parent-back'));
  await expect(page.getByTestId('screen-home')).toBeVisible();

  await holdGear(page, 2300);
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
