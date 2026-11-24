import { expect, test, type Page } from '@playwright/test';
import { MIN_BUTTON_CSS_PX, MIN_CELL_CSS_PX } from '../../src/app/metrics';
import { SVG_BUDGET } from '../../src/app/svgCount';
import { openGrownUps, startApp, tap } from './helpers';
import { finishDelivery, openService, tapId } from './service';

// M4a (SPEC §10, §10.1, §14): the coin shop end to end with stand-in art.

const shop = (page: Page) => page.evaluate(() => window.__ncmc.shop());
const kinds = async (page: Page) => (await page.evaluate(() => window.__ncmc.progress()))!.kinds;

/**
 * Opens the shop. With `settle`, a delivery (the first visit always brings crate 1, D176) is
 * opened and waited out, so the shelf takes taps.
 */
async function openShop(page: Page, settle = true) {
  await tapId(page, 'shop-button');
  await expect(page.getByTestId('screen-shop')).toBeVisible();
  if (settle && (await page.getByTestId('shop-delivery').count()) > 0) {
    await finishDelivery(page);
  }
}

test('buy with confirm, live preview, equip; persists across a reload', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(50, 6));
  await openShop(page);
  await expect(page.getByTestId('screen-shop')).toHaveAttribute('data-slot', 'wallpaper');
  // Before: the café's own wall. Trying a colour on shows it in the café at once.
  await expect(page.locator('svg.cafe-scene [data-decor="wallpaper"]')).toHaveCount(0);
  await tapId(page, 'shop-dot-wallpaper.plain.berry');
  await expect(page.locator('svg.cafe-scene [data-decor="wallpaper"]')).toHaveCount(1);

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
  await expect(page.locator('svg.cafe-scene [data-decor="wallpaper"]')).toHaveCount(1);

  await page.reload();
  await startApp(page);
  // Shown on Home after the reload, from the event log alone.
  await expect(page.locator('svg.cafe-scene [data-decor="wallpaper"]')).toHaveCount(1);
  s = (await shop(page))!;
  expect(s.bought).toEqual(['wallpaper.plain.berry']);
  expect(s.equipped['wallpaper']).toBe('wallpaper.plain.berry');
  expect(s.balance).toBe(30);
  expect((await kinds(page)).filter((k) => k === 'buy')).toHaveLength(1);
});

test('shop pictures are the real drawings, still; items not drawn yet keep a swatch', async ({ page }) => {
  await startApp(page);
  await openShop(page);
  const pic = (item: string) => page.locator(`[data-testid="shop-tile-${item}"] .decor-pic`);
  // The free default is the café's own wall; a bought paper is its own drawing.
  await expect(pic('plain')).toHaveCount(1);
  await expect(pic('polka-dots')).toHaveCount(1);
  for (const [tab, item] of [
    ['floor', 'checkerboard'],
    ['lights', 'string-lights'],
    ['window', 'street'],
    ['window', 'garden'],
  ] as const) {
    await tapId(page, `shop-tab-${tab}`);
    await expect(pic(item), item).toHaveCount(1);
  }
  await tapId(page, 'shop-tab-counter');
  await expect(page.getByTestId('shop-tile-flower-vase').locator('svg')).toHaveCount(1);
  await expect(pic('flower-vase')).toHaveCount(0);
  // Still pictures: nothing inside a tile counts against the moving budget.
  await tapId(page, 'shop-tab-lights');
  const moving = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.effect instanceof KeyframeEffect && a.effect.target?.closest('.decor-pic')).length,
  );
  expect(moving).toBe(0);
});

test('below the price: Buy is dimmed and only gets Pip’s line', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(10, 3));
  await openShop(page);
  await tapId(page, 'shop-tab-lights');
  await expect(page.getByTestId('caption')).toHaveText('Lights!');
  await tapId(page, 'shop-tile-string-lights');
  await expect(page.getByTestId('shop-buy')).toHaveClass(/short/);
  await tapId(page, 'shop-buy');
  await expect(page.getByTestId('shop-confirm')).toHaveCount(0);
  await expect(page.getByTestId('caption')).toHaveText('Keep cooking to save up!');
  expect(await kinds(page)).not.toContain('buy');
  // Leaving drops the try-on: the café shows what is equipped.
  await tapId(page, 'shop-home');
  await expect(page.locator('svg.cafe-scene [data-decor="lights"]')).toHaveCount(0);
});

test('a crate: the first on the first visit, then held at 6 unbought, one per visit, recorded once', async ({
  page,
}) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(2000, 0));
  // The very first visit brings crate 1 though 10 starter entries are unbought (D176, D182).
  await openShop(page, false);
  await expect(page.getByTestId('shop-delivery')).toBeVisible();
  // Untouched, it opens by itself after 2 s and holds the open box 8 s (D164, D181).
  await expect(page.getByTestId('shop-delivery')).toHaveAttribute('data-phase', 'open', { timeout: 5_000 });
  await page.waitForTimeout(6_000);
  await expect(page.getByTestId('shop-delivery')).toHaveAttribute('data-phase', 'open');
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0, { timeout: 4_000 });
  expect((await shop(page))!.unbought).toHaveLength(12);
  await tapId(page, 'shop-home');
  // 40 monsters later crate 2 is due, but 12 unbought hold it.
  await page.evaluate(() => window.__ncmc.earn(0, 40));
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await tapId(page, 'shop-home');
  await page.evaluate(async () => {
    const s = (await window.__ncmc.shop())!;
    for (const k of s.unbought.slice(0, 6)) await window.__ncmc.buy(k);
  });
  expect((await shop(page))!.unbought).toHaveLength(6);
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await tapId(page, 'shop-home');
  await page.evaluate(async () => {
    const s = (await window.__ncmc.shop())!;
    await window.__ncmc.buy(s.unbought[0]!);
  });

  await openShop(page, false);
  await expect(page.getByTestId('shop-delivery')).toBeVisible();
  await expect(page.getByTestId('caption')).toHaveText('A delivery arrived!');
  await tap(page, page.getByTestId('shop-crate'));
  await expect(page.getByTestId('shop-delivery')).toHaveAttribute('data-phase', 'open');
  // An immediate second tap does not skip the rise (D181).
  await tap(page, page.getByTestId('shop-crate'));
  await expect(page.getByTestId('shop-delivery')).toHaveAttribute('data-phase', 'open');
  await finishDelivery(page);
  const s = (await shop(page))!;
  expect(Object.keys(s.crates)).toEqual(['1', '2']);
  expect(s.unbought).toHaveLength(7);
  // The new entries are starred, with their tab.
  await expect(page.locator('.shop-tab .shop-new').first()).toBeVisible();

  // The next visit, with no monster served since, brings nothing more; nor does a reload.
  await tapId(page, 'shop-home');
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await page.reload();
  await startApp(page);
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  expect((await kinds(page)).filter((k) => k === 'crate')).toHaveLength(2);
});

test('grown-ups shop playtest: set the coins, send a crate, replay it, deliver all (D179, D180)', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => window.__ncmc.earn(50, 0));
  await openShop(page); // crate 1 (D176)
  await tapId(page, 'shop-home');

  await openGrownUps(page);
  await page.getByTestId('playtest-coins').fill('777');
  await page.getByTestId('playtest-coins-set').click();
  await expect(page.getByTestId('playtest-note')).toContainText('777');
  // Crate 2 is not due (no monsters served, 12 unbought), so only the request brings it.
  await page.getByTestId('playtest-crate').click();
  await expect(page.getByTestId('playtest-crate')).toContainText('waiting');
  await page.getByTestId('parent-back').click();

  await openShop(page, false);
  await expect(page.getByTestId('shop-delivery')).toBeVisible();
  await expect(page.getByTestId('coin-jar')).toContainText('777');
  await finishDelivery(page);
  let s = (await shop(page))!;
  expect(Object.keys(s.crates)).toEqual(['1', '2']);
  expect(s.balance).toBe(777);
  await tapId(page, 'shop-home');
  // Used once: the next visit brings nothing.
  await openShop(page);
  await expect(page.getByTestId('shop-delivery')).toHaveCount(0);
  await tapId(page, 'shop-home');

  // A replay shows crate 2 arriving again and records nothing.
  await openGrownUps(page);
  await page.getByTestId('playtest-replay').click();
  await page.getByTestId('parent-back').click();
  await openShop(page, false);
  await expect(page.getByTestId('shop-delivery')).toBeVisible();
  // Untouched, it opens by itself after 2 s and holds the open box 8 s (D164, D181).
  await finishDelivery(page);
  expect(Object.keys((await shop(page))!.crates)).toEqual(['1', '2']);
  await tapId(page, 'shop-home');

  // Deliver every crate: two taps.
  await openGrownUps(page);
  await page.getByTestId('playtest-crate-all').click();
  await expect(page.getByTestId('playtest-crate-all')).toContainText('Tap again');
  await page.getByTestId('playtest-crate-all').click();
  await expect(page.getByTestId('playtest-crate-status')).toContainText('0 left');
  await expect(page.getByTestId('playtest-crate')).toBeDisabled();
  s = (await shop(page))!;
  expect(s.unbought.length).toBeGreaterThan(20);
  expect((await kinds(page)).filter((k) => k === 'coinAdjust')).toHaveLength(1);
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
    // The busiest drawn piece per slot so far (M4b batch 1: Starry Night's twinkling stars;
    // batch 2: Paper Lanterns, twelve swaying groups, and Snowy's drifting snow).
    for (const k of [
      'wallpaper.starry-night.classic',
      'floor.tiles.berry',
      'lights.paper-lanterns.berry',
      'window.snowy.classic',
      'counter.flower-vase.berry',
      'wallArt.neon-open.berry',
    ])
      await window.__ncmc.buy(k);
  });
  await openService(page, { skill: 'A1', stage: 3 });
  for (const slot of ['wallpaper', 'floor', 'lights', 'window', 'counter', 'wallArt'])
    await expect(page.locator(`svg.cafe-scene [data-decor="${slot}"]`), slot).toHaveCount(1);
  const n = await page.evaluate(() => window.__ncmc.svgCounts());
  expect(n.total).toBeLessThanOrEqual(SVG_BUDGET.total);
  expect(n.moving).toBeLessThanOrEqual(SVG_BUDGET.moving);
});

test('every item name fits inside its shelf tile, on every page of every slot', async ({ page }) => {
  await startApp(page);
  await openGrownUps(page);
  await page.getByTestId('playtest-crate-all').click();
  await page.getByTestId('playtest-crate-all').click();
  await expect(page.getByTestId('playtest-crate-status')).toContainText('0 left');
  await page.getByTestId('parent-back').click();
  await openShop(page);
  let names = 0;
  for (const slot of ['wallpaper', 'floor', 'lights', 'window', 'counter', 'wallArt']) {
    await tapId(page, `shop-tab-${slot}`);
    for (let p = 0; p < 6; p++) {
      const over = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.shop-tile')].map((tile) => {
          const name = tile.querySelector<HTMLElement>('.shop-tile-name')!;
          const t = tile.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(name);
          const n = range.getBoundingClientRect();
          return { name: name.textContent, out: n.left < t.left + 4 || n.right > t.right - 4 };
        }),
      );
      names += over.length;
      expect(over.filter((o) => o.out).map((o) => o.name), `${slot} page ${p + 1}`).toEqual([]);
      const next = page.getByTestId('shop-next');
      if ((await next.count()) === 0 || (await next.getAttribute('class'))?.includes('off')) break;
      await tapId(page, 'shop-next');
    }
  }
  expect(names).toBeGreaterThanOrEqual(30);
});
