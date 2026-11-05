// Process-wide handles that non-React code (PWA policy, debug screen, test hooks) needs.
import type { ScreenId } from './pwaPolicy';
import type { StorageBoot } from '../storage/open';
import type { PointerGuard } from '../game/input/pointerGuard';

let screen: ScreenId = 'splash';
export const getCurrentScreen = (): ScreenId => screen;
export const setCurrentScreen = (s: ScreenId): void => {
  screen = s;
};

let storageBoot: Promise<StorageBoot> | null = null;
export const setStorageBoot = (p: Promise<StorageBoot>): void => {
  storageBoot = p;
};
export const getStorageBoot = (): Promise<StorageBoot> | null => storageBoot;

let guard: PointerGuard | null = null;
export const setPointerGuard = (g: PointerGuard): void => {
  guard = g;
};
export const lastInputAt = (): number => guard?.lastInputAt() ?? 0;

/**
 * Scales every scripted wait (speech timeouts, demo holds, eat time). 1 in normal builds; e2e
 * fast-forwards through the `__ncmc` hook (SPEC §13.5), which exists only with VITE_E2E=1.
 */
let timeScale = 1;
export const getTimeScale = (): number => timeScale;
export const setTimeScale = (s: number): void => {
  timeScale = s;
};

/** e2e seed override for the next service (SPEC §13.5). */
let seedOverride: number | null = null;
export const takeSeedOverride = (): number | null => {
  const s = seedOverride;
  seedOverride = null;
  return s;
};
export const setSeedOverride = (s: number | null): void => {
  seedOverride = s;
};

/** Read-only snapshot of the running service for the e2e state dump. */
let serviceProbe: (() => unknown) | null = null;
export const setServiceProbe = (p: (() => unknown) | null): void => {
  serviceProbe = p;
};
export const probeService = (): unknown => serviceProbe?.();
