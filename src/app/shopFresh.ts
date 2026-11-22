// Starred shop entries (SPEC §10.1, D164): what a delivery crate brought, starred (with its slot
// tab) until the child taps it. Only a cue, not progress, so it is a per-device setting row, not an
// event: a crate merged in from another device simply arrives without stars here.
import { useSyncExternalStore } from 'react';
import type { Storage } from '../storage/types';

export const SHOP_FRESH_KEY = 'shopFresh';

let fresh: readonly string[] = [];
let storage: Storage | null = null;
const listeners = new Set<() => void>();

function set(next: readonly string[]): void {
  fresh = next;
  listeners.forEach((f) => f());
  void storage?.setSetting(SHOP_FRESH_KEY, [...next]).catch(() => undefined);
}

export async function loadShopFresh(s: Storage): Promise<void> {
  storage = s;
  try {
    const raw = await s.getSetting(SHOP_FRESH_KEY);
    fresh = Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    fresh = [];
  }
  listeners.forEach((f) => f());
}

export const getShopFresh = (): readonly string[] => fresh;

export function addShopFresh(keys: readonly string[]): void {
  set([...fresh, ...keys.filter((k) => !fresh.includes(k))]);
}

export function seeShopFresh(keys: readonly string[]): void {
  if (keys.some((k) => fresh.includes(k))) set(fresh.filter((k) => !keys.includes(k)));
}

const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

export function useShopFresh(): readonly string[] {
  return useSyncExternalStore(subscribe, getShopFresh);
}
