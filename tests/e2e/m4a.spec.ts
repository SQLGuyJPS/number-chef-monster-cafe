import { expect, test, type Page } from '@playwright/test';
import { MIN_BUTTON_CSS_PX, MIN_CELL_CSS_PX } from '../../src/app/metrics';
import { SVG_BUDGET } from '../../src/app/svgCount';
import { startApp, tap } from './helpers';
import { openService, tapId } from './service';

// M4a (SPEC §10, §10.1, §14): the coin shop end to end with stand-in art.

const shop = (page: Page) => page.evaluate(() => window.__ncmc.shop());
const kinds = async (page: Page) => (await page.evaluate(() => window.__ncmc.progress()))!.kinds;

async function openShop(page: Page) {
  await tapId(page, 'shop-button');
  await expect(page.getByTestId('screen-shop')).toBeVisible();
}

test('buy with confirm, live preview, equip; persists across a reload', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(50, 6));
  await openShop(page);
  await expect(page.getByTestId('screen-shop')).toHaveAttribute('data-slot', 'wallpaper');
  // Before: the café's own wall. Trying a colour on shows it in the café at once.
  await expect(page.locator('[data-decor="wallpaper"]')).toHaveCount(0);
  await tapId(page, 'shop-dot-wallpaper.plain.berry');
  await expect(page.locator('[data-decor="wallpaper"]')).toHaveCount(1);

  // Not yet: nothing is bought.
  await tapId(page, 'shop-buy');
  await expect(page.getByTestId('shop-confirm')).toBeVisible();
  await expect(page.getByTestId('shop-confirm')).toContainText('Plain Paint');
  await tapId(page, 'shop-not-yet');
  await expect(page.getByTestId('shop-confirm')).toHaveCount(0);
  expect(await kinds(page)).not.toContain('buy');

  // Yes!: bought once, equipped, 20 coins off.
  await tapId(page, 'shop-buy');
  await tapId(page, 'shop-yes');
  await expect(page.getByTestId('shop-buy')).toHaveCount(0);
  await expect(page.getByTestId('coin-jar')).toContainText('30');
  let s = (await shop(page))!;
  expect(s.bought).toEqual(['wallpaper.plain.berry']);
  expect(s.equipped['wallpaper']).toBe('wallpaper.plain.berry');

  // Re-equipping the free colour costs nothing; the purchase stays.
  await tapId(page, 'shop-dot-wallpaper.plain.sunny');
  s = (await shop(page))!;
  expect(s.equipped['wallpaper']).toBe('wallpaper.plain.sunny');
  expect(s.balance).toBe(30);
  await tapId(page, 'shop-dot-wallpaper.plain.berry');

  await tapId(page, 'shop-home');
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await expect(page.locator('[data-decor="wallpaper"]')).toHaveCount(1);

  await page.reload();
  await startApp(page);
  // Shown on Home after the reload, from the event log alone.
  await expect(page.locator('[data-decor="wallpaper"]')).toHaveCount(1);
  s = (await shop(page))!;
  expect(s.bought).toEqual(['wallpaper.plain.berry']);
  expect(s.equipped['wallpaper']).toBe('wallpaper.plain.berry');
  expect(s.balance).toBe(30);
  expect((await kinds(page)).filter((k) => k === 'buy')).toHaveLength(1);
});

test('below the price: Buy is dimmed and only gets Pip’s line', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(10, 3));
  await openShop(page);
  await tapId(page, 'shop-tab-lights');
  await expect(page.getByTestId('caption')).toHaveText('Lights!');
  await tapId(page, 'shop-tile-disco-ball');
  await expect(page.getByTestId('shop-buy')).toHaveClass(/short/);
  await tapId(page, 'shop-buy');
  await expect(page.getByTestId('shop-confirm')).toHaveCount(0);
  await expect(page.getByTestId('caption')).toHaveText('Keep cooking to save up!');
  expect(await kinds(page)).not.toContain('buy');
  // Leaving drops the try-on: the café shows what is equipped.
  await tapId(page, 'shop-home');
  await expect(page.locator('[data-decor="lights"]')).toHaveCount(0);
});

test('a crate: held at 6 unbought, then one per visit, recorded once', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(2000, 40));
  await openShop(page);
  // 18 unbought on the starter shelf: the hold applies.
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await tapId(page, 'shop-home');
  await page.evaluate(async () => {
    const s = (await window.__ncmc.shop())!;
    for (const k of s.unbought.slice(0, 12)) await window.__ncmc.buy(k);
  });
  expect((await shop(page))!.unbought).toHaveLength(6);
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await tapId(page, 'shop-home');
  await page.evaluate(async () => {
    const s = (await window.__ncmc.shop())!;
    await window.__ncmc.buy(s.unbought[0]!);
  });

  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toBeVisible();
  await expect(page.getByTestId('caption')).toHaveText('A delivery arrived!');
  await tap(page, page.getByTestId('shop-crate'));
  await expect(page.getByTestId('shop-delivery')).toHaveAttribute('data-phase', 'open');
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0, { timeout: 5_000 });
  const s = (await shop(page))!;
  expect(Object.keys(s.crates)).toEqual(['1']);
  expect(s.unbought).toHaveLength(7);
  // The new entries are starred, with their tab.
  await expect(page.getByTestId('shop-tab-wallpaper').locator('.shop-new')).toHaveCount(1);

  // The next visit, with no monster served since, brings nothing more; nor does a reload.
  await tapId(page, 'shop-home');
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await page.reload();
  await startApp(page);
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  expect((await kinds(page)).filter((k) => k === 'crate')).toHaveLength(1);
});

test('shop tap targets are big enough at 844×390, on every page of every slot', async ({ page }, info) => {
  test.skip(info.project.name !== 'webkit-iphone-13', 'tap sizes are asserted at 844×390');
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(50, 3));
  await openShop(page);
  for (const slot of ['wallpaper', 'floor', 'lights', 'window', 'counter', 'wallArt']) {
    await tapId(page, `shop-tab-${slot}`);
    const found = await page.evaluate(
      ({ cell, button }) =>
        [...document.querySelectorAll<HTMLElement>('[data-tap]')]
          .filter((el) => el.offsetParent !== null)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              id: el.dataset.testid,
              min: Math.min(r.width, r.height),
              need: el.dataset.tap === 'cell' ? cell : button,
            };
          }),
      { cell: MIN_CELL_CSS_PX, button: MIN_BUTTON_CSS_PX },
    );
    expect(found.length, slot).toBeGreaterThanOrEqual(9);
    expect(
      found.filter((f) => f.min < f.need - 0.01),
      slot,
    ).toEqual([]);
  }
});

test('purchases show on the Service screen, inside the SVG budget', async ({ page }) => {
  await startApp(page);
  await page.evaluate(async () => {
    await window.__ncmc.earn(400, 3);
    for (const k of [
      'wallpaper.polka-dots.berry',
      'floor.tiles.berry',
      'lights.string-lights.honey',
      'window.garden.classic',
      'counter.flower-vase.berry',
      'wallArt.neon-open.berry',
    ])
      await window.__ncmc.buy(k);
  });
  await openService(page, { skill: 'A1', stage: 3 });
  for (const slot of ['wallpaper', 'floor', 'lights', 'window', 'counter', 'wallArt'])
    await expect(page.locator(`[data-decor="${slot}"]`), slot).toHaveCount(1);
  const n = await page.evaluate(() => window.__ncmc.svgCounts());
  expect(n.total).toBeLessThanOrEqual(SVG_BUDGET.total);
  expect(n.moving).toBeLessThanOrEqual(SVG_BUDGET.moving);
});
