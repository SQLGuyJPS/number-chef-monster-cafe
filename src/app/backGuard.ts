// SPEC §2.3, D19, D37: the Android back gesture and the iOS edge-swipe would leave the app. A guard
// history entry is pushed from inside a tap (Chrome skips entries pushed without user activation)
// and again after each in-app navigation; popstate opens "Take a break?" instead of leaving.

const GUARD = 'ncmcGuard';

function onGuardEntry(): boolean {
  const s: unknown = history.state;
  return typeof s === 'object' && s !== null && (s as Record<string, unknown>)[GUARD] === true;
}

/** Call only from a tap handler. Keeps the URL (and so `?debug`, `?rotate=off`) unchanged. */
export function pushGuard(): void {
  if (onGuardEntry()) return;
  history.pushState({ [GUARD]: true }, '', location.href);
}

export function onBack(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener('popstate', handler);
  return () => window.removeEventListener('popstate', handler);
}
