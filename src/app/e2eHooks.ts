// Loaded only when VITE_E2E=1 (SPEC §13.5). A unit test asserts the production bundle has no trace
// of the hook name. Grows in later milestones (seed override, fast-forward, fake clock).
import {
  getCurrentScreen,
  getGateAnswer,
  skewParentClock,
  getStorageBoot,
  probeService,
  setSeedOverride,
  setTimeScale,
} from './runtime';
import { getProgress } from './progress';
import { balance } from '../engine/replay';
import { saveBasketSide } from './basketSide';
import type { BasketSide } from './metrics';
import type { Ops, SkillId, Stage } from '../engine/types';
import { getStageLayout } from './Stage';
import { getSwStatus } from './pwa';
import { countMovingSvgElements, countSvgElements } from './svgCount';
import { loadVoiceManifest, say, voiceCacheStats, voiceLog } from '../audio/voice';
import type { Line } from '../engine/clips';

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
      const p = await getProgress();
      p?.setSkillConfig(skill, stage, ops);
      await p?.flush();
    },
    /** The event log as stored, the derived coins and the resume row (SPEC §11). */
    async progress() {
      const p = await getProgress();
      if (!p) return null;
      await p.flush();
      const events = await p.storage.loadEvents();
      return {
        balance: balance(p.derived),
        count: p.derived.count,
        config: p.derived.config,
        kinds: events.map((e) => e.k),
        events,
        resume: await p.storage.getResume(),
      };
    },
    /** Basket side for the next service (D115). */
    async setBasketSide(side: BasketSide) {
      const boot = await getStorageBoot();
      if (boot) await saveBasketSide(boot.storage, side);
    },
    /** Marks the first-ever warm-up order as shown (or not) on this device (SPEC §5.4). */
    async setWarmupShown(shown: boolean) {
      const boot = await getStorageBoot();
      if (boot) await boot.storage.setMeta('warmupShown', shown);
    },
    /** Lines spoken so far, recorded or TTS, with their clips and outcome (SPEC §8.4). */
    voiceLog: () => voiceLog.map((e) => ({ ...e })),
    /** Speaks a line through the voice layer; resolves with how long `say` took. */
    async voiceSay(line: Line, voice: string) {
      await loadVoiceManifest();
      const t0 = performance.now();
      const done = say(line, voice);
      const entry = voiceLog[voiceLog.length - 1]!; // logged synchronously when the line starts
      await done;
      return { ms: performance.now() - t0, entry: { ...entry } };
    },
    voiceCache: voiceCacheStats,
    /** The answer to the parent gate question on screen (it is never spoken; D134). */
    gateAnswer: getGateAnswer,
    /** Moves the gate's lockout and the parent area's idle clock forward. */
    skewParentClock,
    /** Rows per store and the snapshot, for the Reset and import checks (SPEC §11.6). */
    async stores() {
      const boot = await getStorageBoot();
      if (!boot) return null;
      return { counts: await boot.storage.counts(), snapshot: await boot.storage.getSnapshot(), deviceId: boot.deviceId };
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
