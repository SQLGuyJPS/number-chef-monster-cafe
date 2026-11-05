// Loaded only when VITE_E2E=1 (SPEC §13.5). A unit test asserts the production bundle has no trace
// of the hook name. Grows in later milestones (seed override, fast-forward, fake clock).
import { getCurrentScreen, getStorageBoot } from './runtime';
import { getStageLayout } from './Stage';
import { getSwStatus } from './pwa';

export function installE2eHooks(): void {
  const hooks = {
    screen: getCurrentScreen,
    layout: getStageLayout,
    swStatus: getSwStatus,
    async storage() {
      const boot = await getStorageBoot();
      return boot ? { kind: boot.storage.kind, degraded: boot.degraded, deviceId: boot.deviceId } : null;
    },
  };
  (window as unknown as Record<string, unknown>)['__ncmc'] = hooks;
}
