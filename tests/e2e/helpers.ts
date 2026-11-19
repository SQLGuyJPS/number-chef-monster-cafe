import { expect, type Locator, type Page } from '@playwright/test';

/** Taps the centre of an element by touch. boundingBox is the screen rect, exact under the 90° stage rotation. */
export async function tap(page: Page, locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error('no bounding box');
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/** Records every request that leaves the app's origin, and every CSP violation. */
export function watchNetwork(page: Page, origin: string): { external: string[]; csp: string[] } {
  const external: string[] = [];
  const csp: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (!url.startsWith(origin)) external.push(url);
  });
  page.on('console', (m) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) csp.push(m.text());
  });
  return { external, csp };
}

export async function startApp(page: Page, query = ''): Promise<void> {
  await page.goto(`./${query}`);
  await tap(page, page.getByTestId('splash'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
}

export async function isRotated(page: Page): Promise<boolean> {
  return (await page.getByTestId('stage').getAttribute('data-rotated')) === 'true';
}

/**
 * Gear tap, then the 2 s hold on the popup's circle (D95). Playwright can't hold a touch, so the
 * hold is a mouse press, which takes the same pointer path. Leaves the parent gate showing.
 */
export async function holdGear(page: Page): Promise<void> {
  await tap(page, page.getByTestId('gear'));
  const box = (await page.getByTestId('gear-hold').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.getByTestId('parent-gate')).toBeVisible({ timeout: 5000 });
  await page.mouse.up();
}

/** Types an answer on the gate's number pad and presses OK (SPEC §12). */
export async function typeGate(page: Page, answer: number | string, gate = 'parent-gate'): Promise<void> {
  const root = page.getByTestId(gate);
  for (const d of String(answer)) await tap(page, root.getByTestId(`gate-key-${d}`));
  await tap(page, root.getByTestId('gate-key-ok'));
}

/** The question is never spoken; e2e reads its answer from the `__ncmc` hook (D134). */
export async function gateAnswer(page: Page): Promise<number> {
  const n = await page.evaluate(() => (window as unknown as { __ncmc: { gateAnswer(): number | null } }).__ncmc.gateAnswer());
  if (n === null) throw new Error('no gate question on screen');
  return n;
}

/** Gear → hold → the right answer → the parent area. */
export async function openGrownUps(page: Page): Promise<void> {
  await page.waitForFunction(() => !!(window as unknown as { __ncmc?: unknown }).__ncmc);
  await holdGear(page);
  await typeGate(page, await gateAnswer(page));
  await expect(page.getByTestId('parent-screen')).toBeVisible();
}
