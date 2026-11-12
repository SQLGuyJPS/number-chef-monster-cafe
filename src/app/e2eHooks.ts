// Loaded only when VITE_E2E=1 (SPEC §13.5). A unit test asserts the production bundle has no trace
// of the hook name. Grows in later milestones (seed override, fast-forward, fake clock).
import {
  getCurrentScreen,
  getStorageBoot,
  probeService,
  setSeedOverride,
  setTimeScale,
} from './runtime';
import { saveSkillConfig } from './skillConfig';
import type { Ops, SkillId, Stage } from '../engine/types';
import { getStageLayout } from './Stage';
import { getSwStatus } from './pwa';
import { countMovingSvgElements, countSvgElements } from './svgCount';

export function installE2eHooks(): void {
  const hooks = {
    screen: getCurrentScreen,
    layout: getStageLayout,
    swStatus: getSwStatus,
    /** Scales every scripted wait (speech timeouts, demos, eating). */
    setTimeScale,
    /** Seed for the next service. */
    setSeed: (seed: number | null) => setSeedOverride(seed),
    /** Running service state (phase, answer, tray, typed, events…). */
    service: probeService,
    /** SVG elements on screen and those animating now (SPEC §2.4 budget, D113). */
    svgCounts: () => ({
      total: countSvgElements(document),
      moving: countMovingSvgElements(document),
    }),
    async setSkillConfig(skill: SkillId, stage: Stage, ops: Ops) {
      const boot = await getStorageBoot();
      if (boot) await saveSkillConfig(boot.storage, skill, { stage, ops });
    },
    /** Marks the first-ever warm-up order as shown (or not) on this device (SPEC §5.4). */
    async setWarmupShown(shown: boolean) {
      const boot = await getStorageBoot();
      if (boot) await boot.storage.setMeta('warmupShown', shown);
    },
    async storage() {
      const boot = await getStorageBoot();
      return boot
        ? { kind: boot.storage.kind, degraded: boot.degraded, deviceId: boot.deviceId }
        : null;
    },
  };
  (window as unknown as Record<string, unknown>)['__ncmc'] = hooks;
}
