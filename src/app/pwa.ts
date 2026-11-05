import { registerSW } from 'virtual:pwa-register';
import { shouldActivateWaitingWorker, type ScreenId } from './pwaPolicy';

export type SwStatus = 'unsupported' | 'registering' | 'ready' | 'offline-ready' | 'waiting' | 'error';

let status: SwStatus = 'serviceWorker' in navigator ? 'registering' : 'unsupported';
export function getSwStatus(): SwStatus {
  return status;
}

/**
 * `registerType: 'prompt'` (SPEC §2): a new worker waits; we activate it only when the policy
 * allows, polling while one is waiting so "Home idle 30 s" is noticed.
 */
export function initPwa(getScreen: () => ScreenId, lastInputAt: () => number): void {
  if (status === 'unsupported') return;
  let timer = 0;
  const update = registerSW({
    immediate: true,
    onRegisteredSW: () => {
      if (status === 'registering') status = 'ready';
    },
    onOfflineReady: () => {
      status = 'offline-ready';
    },
    onRegisterError: () => {
      status = 'error';
    },
    onNeedRefresh: () => {
      status = 'waiting';
      const check = () => {
        if (shouldActivateWaitingWorker(getScreen(), performance.now() - lastInputAt())) {
          window.clearInterval(timer);
          void update(true);
        }
      };
      check();
      timer = window.setInterval(check, 5000);
    },
  });
}
