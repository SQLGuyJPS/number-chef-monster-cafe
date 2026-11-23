// Playtest request for the next shop visit (SPEC §12, D180): a crate sent from the grown-ups'
// area, or a replay of the last delivery moment. In memory only and used once: a playtest aid, not
// progress, so it never reaches the log, the settings store or a backup.
import { useSyncExternalStore } from 'react';

export type ShopPlaytestRequest = 'crate' | 'replay' | null;

let pending: ShopPlaytestRequest = null;
const listeners = new Set<() => void>();

export function setShopPlaytest(next: ShopPlaytestRequest): void {
  pending = next;
  listeners.forEach((f) => f());
}

/** Read by the shop visit: returns the request and clears it. */
export function takeShopPlaytest(): ShopPlaytestRequest {
  const r = pending;
  if (r !== null) setShopPlaytest(null);
  return r;
}

const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

export function useShopPlaytest(): ShopPlaytestRequest {
  return useSyncExternalStore(subscribe, () => pending);
}
