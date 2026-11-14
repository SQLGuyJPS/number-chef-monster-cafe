import { expect, test } from '@playwright/test';
import { isRotated, startApp, tap, watchNetwork } from './helpers';

const ORIGIN = 'http://localhost:4173';

test.beforeEach(async ({ page }) => {
  // Collect CSP violations from the page itself as well as the console (WebKit words them differently).
  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: string[] };
    w.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });
});

test('splash → home → menu → home with zero external requests and no CSP violations', async ({ page }) => {
  const net = watchNetwork(page, ORIGIN);
  await startApp(page);
  await tap(page, page.getByTestId('open-cafe'));
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');
  await tap(page, page.getByTestId('menu-home'));
  await expect(page.getByTestId('screen-home')).toBeVisible();

  // SPEC §2: CSP meta is present in the production build.
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("default-src 'self'");
  const violations = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
  expect(violations).toEqual([]);
  expect(net.csp).toEqual([]);
  expect(net.external).toEqual([]);
});

test('stage rotates in portrait, taps land on rotated controls, rotating back keeps state', async ({ page }) => {
  const vp = page.viewportSize()!;
  const startsPortrait = vp.height > vp.width;
  await startApp(page);
  expect(await isRotated(page)).toBe(startsPortrait);
  if (startsPortrait) await expect(page.getByTestId('turn-cue')).toBeVisible();

  await tap(page, page.getByTestId('open-cafe'));
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');

  // Turn the device: swap the viewport. Same screen, no remount, transform flips.
  await page.setViewportSize({ width: vp.height, height: vp.width });
  await expect.poll(() => isRotated(page)).toBe(!startsPortrait);
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');
  if (startsPortrait) await expect(page.getByTestId('turn-cue')).toHaveCount(0);

  await tap(page, page.getByTestId('menu-home'));
  await expect(page.getByTestId('screen-home')).toBeVisible();

  // The stage fills the screen: its screen rect covers the whole viewport in both orientations.
  const box = (await page.getByTestId('stage').boundingBox())!;
  expect(Math.round(box.x)).toBe(0);
  expect(Math.round(box.y)).toBe(0);
  expect(Math.round(box.width)).toBe(vp.height);
  expect(Math.round(box.height)).toBe(vp.width);
});

test('?rotate=off keeps a portrait viewport unrotated', async ({ page }) => {
  await page.goto('./?rotate=off');
  expect(await isRotated(page)).toBe(false);
});

test('back gesture shows the break dialog instead of leaving (SPEC §2.3)', async ({ page }) => {
  await startApp(page);
  const url = page.url();
  await page.goBack();
  await expect(page.getByTestId('break-dialog')).toBeVisible();
  expect(page.url()).toBe(url);
  // Outside a service only Keep cooking is offered (D46).
  await expect(page.getByTestId('close-cafe')).toHaveCount(0);
  await tap(page, page.getByTestId('keep-cooking'));
  await expect(page.getByTestId('break-dialog')).toHaveCount(0);
  await expect(page.getByTestId('screen-home')).toBeVisible();

  // The guard is re-armed: a second back is caught too, also after an in-app navigation.
  await tap(page, page.getByTestId('open-cafe'));
  await page.goBack();
  await expect(page.getByTestId('break-dialog')).toBeVisible();
  await expect(page.getByTestId('screen-menu')).toHaveAttribute('data-ready', 'true');
  expect(page.url()).toBe(url);
});

test('no zoom, scroll, selection or long-press menu on the play surface (SPEC §2.3)', async ({ page }) => {
  await startApp(page);
  const surface = page.getByTestId('screen-home');
  const box = (await surface.boundingBox())!;
  const x = box.x + 20;
  const y = box.y + box.height / 2;
  await page.touchscreen.tap(x, y);
  await page.touchscreen.tap(x, y);

  const state = await page.evaluate(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(document.body);
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    document.querySelector('[data-testid="screen-home"]')!.dispatchEvent(menu);
    const move = new Event('touchmove', { bubbles: true, cancelable: true });
    document.querySelector('[data-testid="screen-home"]')!.dispatchEvent(move);
    return {
      scale: window.visualViewport?.scale ?? 1,
      scrollW: root.scrollWidth,
      scrollH: root.scrollHeight,
      w: window.innerWidth,
      h: window.innerHeight,
      scrollY: window.scrollY,
      overflow: cs.overflow,
      // Playwright's Windows WebKit port lacks overscroll-behavior (Safari 16+ has it).
      overscroll: CSS.supports('overscroll-behavior', 'none')
        ? cs.overscrollBehavior || cs.getPropertyValue('overscroll-behavior')
        : 'none (unsupported)',
      userSelect: cs.userSelect || cs.getPropertyValue('-webkit-user-select'),
      menuBlocked: menu.defaultPrevented,
      moveBlocked: move.defaultPrevented,
      viewportMeta: document.querySelector('meta[name="viewport"]')!.getAttribute('content'),
    };
  });
  expect(state.scale).toBe(1);
  expect(state.scrollW).toBeLessThanOrEqual(state.w);
  expect(state.scrollH).toBeLessThanOrEqual(state.h);
  expect(state.scrollY).toBe(0);
  expect(state.overflow).toBe('hidden');
  expect(state.overscroll).toContain('none');
  expect(state.userSelect).toBe('none');
  expect(state.menuBlocked).toBe(true);
  expect(state.moveBlocked).toBe(true);
  expect(state.viewportMeta).toContain('user-scalable=no');
  expect(state.viewportMeta).toContain('maximum-scale=1');
});

test('tap targets meet the minimum sizes (CLAUDE.md: buttons ≥ 56 CSS px)', async ({ page }) => {
  await startApp(page);
  for (const id of ['open-cafe']) {
    const b = (await page.getByTestId(id).boundingBox())!;
    expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(56);
  }
  // D95: the grown-ups' gear is big enough to know it was hit.
  const g = (await page.getByTestId('gear').boundingBox())!;
  expect(Math.min(g.width, g.height)).toBeGreaterThanOrEqual(44);
  await page.goBack();
  const k = (await page.getByTestId('keep-cooking').boundingBox())!;
  expect(Math.min(k.width, k.height)).toBeGreaterThanOrEqual(56);
});

test('debug screen shows the version; test hooks exist only in the e2e build', async ({ page }) => {
  await page.goto('./?debug');
  await expect(page.getByTestId('debug-screen')).toBeVisible();
  await expect(page.getByTestId('debug-version')).toHaveText(/^\d+\.\d+\.\d+\+\w+$/);
  await expect(page.getByTestId('debug-storage')).toHaveText('idb');
  await expect(page.getByTestId('debug-schema-version')).toHaveText('1');
  expect(await page.evaluate(() => typeof (window as unknown as { __ncmc?: unknown }).__ncmc)).toBe('object');
});

test('offline reload works once the service worker controls the page', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'offline reload is checked on Chromium (PLAN §4 M0 step 11)');
  await page.goto('./');
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('splash')).toBeVisible();
  await tap(page, page.getByTestId('splash'));
  await expect(page.getByTestId('screen-home')).toBeVisible();
  await context.setOffline(false);
});
