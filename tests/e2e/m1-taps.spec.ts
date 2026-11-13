import { expect, test, type Page } from '@playwright/test';
import { MIN_BUTTON_CSS_PX, MIN_CELL_CSS_PX } from '../../src/app/metrics';
import { openService, serveWrong, tapId, waitPhase } from './service';

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

async function expectAllBigEnough(page: Page, scene: string) {
  const found = await measure(page);
  expect(found.length, `${scene}: tap targets found`).toBeGreaterThan(3);
  const small = found.filter((f) => Math.min(f.w, f.h) < f.need - 0.01);
  expect(small, `${scene}: targets below the minimum`).toEqual([]);
}

/** Basket on the dominant side, Pip and the bell on the other (D115). */
async function expectBasketSide(page: Page, basket: 'left' | 'right') {
  const tray = (await page.getByTestId('tray-cell-0').boundingBox())!;
  const bin = (await page.getByTestId('bin').boundingBox())!;
  const bell = (await page.getByTestId('bell').boundingBox())!;
  expect(bin.x > tray.x, 'basket side').toBe(basket === 'right');
  expect(bell.x > tray.x, 'bell side').toBe(basket === 'left');
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
      await expectAllBigEnough(page, 'S3 remove');
    });

    test('CountTogether bubble up', async ({ page }) => {
      await openService(page, { skill: 'A1', stage: 3, timeScale: 1, basket });
      await tapId(page, 'help');
      await waitPhase(page, 'countTogether');
      await expect(page.getByTestId('model-bubble')).toBeVisible();
      await expect(page.getByTestId('pip')).toBeVisible(); // Pip counts (D90)
      await expectAllBigEnough(page, 'CountTogether');
    });

    test('help offer after the second miss (D89)', async ({ page }) => {
      await openService(page, { skill: 'A1', stage: 3, basket });
      await serveWrong(page);
      await waitPhase(page, 'building');
      await serveWrong(page);
      await waitPhase(page, 'offerHelp');
      await expectAllBigEnough(page, 'Help offer');
    });

    test('S0 number pad and the lifted cloche', async ({ page }) => {
      await openService(page, { skill: 'A2', stage: 0, basket });
      await expectAllBigEnough(page, 'S0 pad');
      await tapId(page, 'peek');
      await expect(page.getByTestId('cloche-lid')).toBeVisible();
      await expectAllBigEnough(page, 'S0 cloche');
    });
  });
}
