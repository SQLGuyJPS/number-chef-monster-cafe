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
