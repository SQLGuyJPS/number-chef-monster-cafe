import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { MIN_BUTTON_CSS_PX, MIN_CELL_CSS_PX } from '../../src/app/metrics';

// Over-the-counter layout mock (`?mock`, owner request before M3a). Tap sizes are asserted at
// 844×390 for every variant on both basket sides; screenshots only when NCMC_SCREENS is set:
//   npx cross-env NCMC_SCREENS=counter-mock playwright test counterMock --project=chromium-ipad-pro-11 --project=webkit-iphone-13
const VARIANTS = ['s3', 'taken', 'frames2', 's0', 'cloche', 'offer', 'count'] as const;
const SIDES = ['right', 'left'] as const;

async function open(page: Page, q: string) {
  await page.goto(`./?mock&clean&${q}`);
  await page.getByTestId('counter-mock').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

async function measure(page: Page) {
  return page.evaluate(
    ({ cell, button }) =>
      [...document.querySelectorAll<HTMLElement>('[data-tap]')].map((el, i) => {
        const r = el.getBoundingClientRect();
        const kind = el.dataset.tap;
        return { id: el.dataset.testid ?? `${kind}${i}`, w: r.width, h: r.height, need: kind === 'cell' ? cell : button };
      }),
    { cell: MIN_CELL_CSS_PX, button: MIN_BUTTON_CSS_PX },
  );
}

test('every mock variant keeps the 844×390 tap minimums on both basket sides', async ({ page }, info) => {
  test.skip(info.project.name !== 'webkit-iphone-13', 'tap sizes are asserted at 844×390');
  for (const v of VARIANTS)
    for (const side of SIDES) {
      await open(page, `v=${v}&basket=${side}`);
      const found = await measure(page);
      expect(found.length, `${v}/${side}: tap targets`).toBeGreaterThan(3);
      const small = found.filter((f) => Math.min(f.w, f.h) < f.need - 0.01);
      expect(small, `${v}/${side}: below the minimum`).toEqual([]);
    }
});

test('the two-frame crate holds its whole heap, tilt included, on both sides', async ({ page }, info) => {
  // Measured along the screen's x axis, which is the stage's only when the stage is not rotated.
  test.skip(info.project.name.includes('portrait'), 'landscape only: the rotated stage swaps the axes');
  for (const side of SIDES) {
    await open(page, `v=frames2&basket=${side}`);
    const worst = await page.evaluate(() => {
      const crate = document.querySelector('.bin.tall .bin-crate')!.getBoundingClientRect();
      return Math.min(
        ...[...document.querySelectorAll('.bin.tall .heap-row span')].flatMap((el) => {
          const g = el.getBoundingClientRect();
          return [g.left - crate.left, crate.right - g.right];
        }),
      );
    });
    expect(worst, `${side}: food past the crate's sides`).toBeGreaterThanOrEqual(0);
  }
});

const milestone = process.env.NCMC_SCREENS;
const SHOT_PROJECTS = ['chromium-ipad-pro-11', 'webkit-iphone-13'];

test('counter mock screenshots', async ({ page }, info) => {
  test.skip(!milestone || !SHOT_PROJECTS.includes(info.project.name), 'set NCMC_SCREENS to capture');
  test.setTimeout(120_000);
  const dir = `docs/screens/${milestone}`;
  mkdirSync(dir, { recursive: true });
  const vp = page.viewportSize()!;
  const tag = `${vp.width}x${vp.height}`;
  const shot = async (q: string, name: string) => {
    await open(page, q);
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
    await page.screenshot({ path: `${dir}/${name}-${tag}.png` });
  };
  // Monsters at full height (owner's choice), window by the door, both basket sides.
  for (const side of SIDES) await shot(`v=s3&basket=${side}`, `s3-basket-${side}`);
  // Two-frame tray (owner's pick, A with a two-row heap), both basket sides.
  for (const side of SIDES) await shot(`v=frames2&basket=${side}`, `two-frames-basket-${side}`);
  // The other fit checks, and the longest line (8 orders, two requeues).
  for (const v of ['taken', 's0', 'cloche', 'offer', 'count']) await shot(`v=${v}`, `fit-${v}`);
  await shot('v=s3&line=9', 'line-of-nine');
  for (const side of SIDES) await shot(`v=cloche&basket=${side}`, `cloche-basket-${side}`);

  // Measurements for the proposal against the D113 budget (4,800 on screen, 650 moving), with
  // animations running: the longest line of real mini monsters, all idling.
  type Hooks = { svgCounts: () => { total: number; moving: number } };
  const counts: Record<string, { total: number; moving: number }> = {};
  for (const q of ['v=s3', 'v=s3&line=9', 'v=count&line=9', 'v=frames2&line=9']) {
    await open(page, q);
    await page.waitForTimeout(300);
    counts[q] = await page.evaluate(() => (window as unknown as { __ncmc: Hooks }).__ncmc.svgCounts());
  }
  await open(page, 'v=s3');
  const sizes = await measure(page);
  writeFileSync(
    `${dir}/measure-${tag}.json`,
    JSON.stringify({ svgCounts: counts, targets: sizes.map((s) => ({ ...s, w: +s.w.toFixed(1), h: +s.h.toFixed(1) })) }, null, 2),
  );
  for (const c of Object.values(counts)) {
    expect(c.total).toBeLessThanOrEqual(4800);
    expect(c.moving).toBeLessThanOrEqual(650);
  }
});
