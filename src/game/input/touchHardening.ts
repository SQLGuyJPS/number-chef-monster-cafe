// SPEC §2.3 touch hardening. CSS does most of it (src/app/global.css); these listeners cover what
// CSS cannot: iOS ignores user-scalable=no and still fires gesture events, long-press menus, and
// rubber-band scrolling via touchmove.

const SCROLL_OK = '[data-scroll-ok], input, textarea, select';
const MENU_OK = 'input, textarea, [data-allow-contextmenu]';

function closest(target: EventTarget | null, selector: string): boolean {
  return target instanceof Element && target.closest(selector) !== null;
}

export function installTouchHardening(doc: Document): () => void {
  const prevent = (e: Event) => {
    if (e.cancelable) e.preventDefault();
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!closest(e.target, SCROLL_OK)) prevent(e);
  };
  const onTouchStart = (e: TouchEvent) => {
    // A second finger would start a pinch; the play surface is single-pointer anyway.
    if (e.touches.length > 1 && !closest(e.target, SCROLL_OK)) prevent(e);
  };
  const onContextMenu = (e: Event) => {
    if (!closest(e.target, MENU_OK)) prevent(e);
  };
  const onSelectStart = (e: Event) => {
    if (!closest(e.target, MENU_OK)) prevent(e);
  };

  const nonPassive = { passive: false } as const;
  const gestures = ['gesturestart', 'gesturechange', 'gestureend'];
  gestures.forEach((g) => doc.addEventListener(g, prevent, nonPassive));
  doc.addEventListener('touchmove', onTouchMove, nonPassive);
  doc.addEventListener('touchstart', onTouchStart, nonPassive);
  doc.addEventListener('contextmenu', onContextMenu);
  doc.addEventListener('selectstart', onSelectStart);
  doc.addEventListener('dblclick', prevent, nonPassive);

  return () => {
    gestures.forEach((g) => doc.removeEventListener(g, prevent));
    doc.removeEventListener('touchmove', onTouchMove);
    doc.removeEventListener('touchstart', onTouchStart);
    doc.removeEventListener('contextmenu', onContextMenu);
    doc.removeEventListener('selectstart', onSelectStart);
    doc.removeEventListener('dblclick', prevent);
  };
}
