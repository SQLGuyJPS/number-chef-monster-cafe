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
  // The main ask: monster full height vs to the waist, right- and left-handed.
  for (const m of ['full', 'waist'])
    for (const side of SIDES) await shot(`v=s3&monster=${m}&basket=${side}`, `s3-${m}-basket-${side}`);
  // Fit checks, right-handed, full height (the waist cut changes nothing in the counter band).
  for (const v of VARIANTS.slice(1)) await shot(`v=${v}`, `fit-${v}`);
  await shot('v=frames2&basket=left', 'fit-frames2-basket-left');

  // Measurements for the proposal (SVG node budget SPEC §2.4; smallest targets).
  await open(page, 'v=s3');
  const nodes = await page.evaluate(() => document.querySelectorAll('svg *').length);
  const lineNodes = await page.evaluate(() => document.querySelectorAll('[data-testid="queue"] svg *').length);
  const sizes = await measure(page);
  writeFileSync(
    `${dir}/measure-${tag}.json`,
    JSON.stringify({ svgNodes: nodes, lineSvgNodes: lineNodes, targets: sizes.map((s) => ({ ...s, w: +s.w.toFixed(1), h: +s.h.toFixed(1) })) }, null, 2),
  );
});
