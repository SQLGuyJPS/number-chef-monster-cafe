import { expect, test, type Page } from '@playwright/test';
import { MIN_BUTTON_CSS_PX, MIN_CELL_CSS_PX } from '../../src/app/metrics';
import { startApp } from './helpers';
import { openService, probe, serveCorrect, serveWrong, tapId, waitPhase } from './service';

// CLAUDE.md: primary tap targets ≥ 44 CSS px (cells) and ≥ 56 (buttons) at 844×390, measured on
// the live service screen in every layout the child can reach in M1.
test.beforeEach(({ browserName: _browser }, info) => {
  test.skip(info.project.name !== 'webkit-iphone-13', 'tap sizes are asserted at 844×390');
});

async function measure(page: Page): Promise<{ id: string; w: number; h: number; need: number }[]> {
  return page.evaluate(
    ({ cell, button }) =>
      [...document.querySelectorAll<HTMLElement>('[data-tap]')]
        .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
        .map((el, i) => {
          const r = el.getBoundingClientRect();
          const kind = el.dataset.tap;
          return {
            id: el.dataset.testid ?? `${kind}${i}`,
            w: r.width,
            h: r.height,
            need: kind === 'cell' ? cell : button,
          };
        }),
    { cell: MIN_CELL_CSS_PX, button: MIN_BUTTON_CSS_PX },
  );
}

async function expectAllBigEnough(page: Page, scene: string, atLeast = 4) {
  const found = await measure(page);
  expect(found.length, `${scene}: tap targets found`).toBeGreaterThanOrEqual(atLeast);
  const small = found.filter((f) => Math.min(f.w, f.h) < f.need - 0.01);
  expect(small, `${scene}: targets below the minimum`).toEqual([]);
}

/** Basket on the dominant side, Pip and the bell on the other (D115). */
async function expectBasketSide(page: Page, basket: 'left' | 'right') {
  const tray = (await page.getByTestId('tray-cell-0').boundingBox())!;
  const bin = (await page.getByTestId('bin').boundingBox())!;
  const bell = (await page.getByTestId('bell').boundingBox())!;
  const help = (await page.getByTestId('help').boundingBox())!;
  expect(bin.x > tray.x, 'basket side').toBe(basket === 'right');
  expect(bell.x > tray.x, 'bell side').toBe(basket === 'left');
  expect(help.x > tray.x, "Pip's hat side").toBe(basket === 'left');
}

for (const basket of ['right', 'left'] as const) {
  test.describe(`basket ${basket}`, () => {
    test('S3 add (tray cells, bin, bell, help, door)', async ({ page }) => {
      await openService(page, { skill: 'A2', stage: 3, ops: 'add', basket });
      await expectBasketSide(page, basket);
      await expectAllBigEnough(page, 'S3 add');
    });

    test('S3 remove', async ({ page }) => {
      await openService(page, { skill: 'A2', stage: 3, ops: 'sub', basket });
      await expectBasketSide(page, basket);
      await expectAllBigEnough(page, 'S3 remove');
    });

    test('CountTogether bubble up', async ({ page }) => {
      await openService(page, { skill: 'A1', stage: 3, timeScale: 1, basket });
      await tapId(page, 'help');
      await waitPhase(page, 'countTogether');
      await expect(page.getByTestId('model-bubble')).toBeVisible();
      await expect(page.getByTestId('pip')).toBeVisible(); // Pip counts (D90)
      await expectBasketSide(page, basket);
      await expectAllBigEnough(page, 'CountTogether');
    });

    test('help offer after the second miss (D89)', async ({ page }) => {
      await openService(page, { skill: 'A1', stage: 3, basket });
      await serveWrong(page);
      await waitPhase(page, 'building');
      await serveWrong(page);
      await waitPhase(page, 'offerHelp');
      await expectBasketSide(page, basket);
      await expectAllBigEnough(page, 'Help offer');
    });

    test('S0 number pad and the lifted cloche', async ({ page }) => {
      await openService(page, { skill: 'A2', stage: 0, basket });
      await expectAllBigEnough(page, 'S0 pad');
      await tapId(page, 'peek');
      await expect(page.getByTestId('cloche-lid')).toBeVisible();
      await expectBasketSide(page, basket);
      // The lifted lid stands between the tray and the basket on both sides (D114, D120).
      const lid = (await page.getByTestId('cloche-lid').boundingBox())!;
      const tray = (await page.getByTestId('tray-cell-0').boundingBox())!;
      const bin = (await page.getByTestId('bin').boundingBox())!;
      const [near, far] = basket === 'right' ? [tray.x, bin.x] : [bin.x, tray.x];
      expect(lid.x > near && lid.x < far, 'lid between tray and basket').toBe(true);
      await expectAllBigEnough(page, 'S0 cloche');
    });
  });
}

// Splash, Home, Menu and Results over the counter (D123). The grown-ups' gear is not a child
// target (D95) and is checked on its own in m0.
test('front screens: Splash, Home, Menu and Results', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('./');
  await page.getByTestId('splash').waitFor();
  await expectAllBigEnough(page, 'Splash', 1);
  await startApp(page);
  await expectAllBigEnough(page, 'Home', 1);
  await tapId(page, 'open-cafe');
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');
  await expectAllBigEnough(page, 'Menu', 4);
  await openService(page, { skill: 'A1', stage: 3, ops: 'add', seed: 6 });
  for (let i = 0; i < 6; i++) {
    await expect.poll(async () => (await probe(page))?.index, { timeout: 10_000 }).toBe(i);
    await waitPhase(page, 'building');
    await serveCorrect(page);
  }
  await expect(page.getByTestId('results-another')).toBeVisible({ timeout: 15_000 });
  await expectAllBigEnough(page, 'Results', 3);
});
