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
