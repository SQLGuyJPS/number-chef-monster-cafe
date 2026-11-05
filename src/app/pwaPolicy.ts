// D12, D54: a waiting service worker is activated (with reload) only on cold launch (Splash still
// showing) or after Home has been idle for 30 s. Never anywhere else, above all not mid-service.
export const HOME_IDLE_ACTIVATE_MS = 30_000;

export type ScreenId = 'splash' | 'home' | 'menu' | 'service' | 'results' | 'shop' | 'parent';

export function shouldActivateWaitingWorker(screen: ScreenId, idleMs: number): boolean {
  if (screen === 'splash') return true;
  if (screen === 'home') return idleMs >= HOME_IDLE_ACTIVATE_MS;
  return false;
}
