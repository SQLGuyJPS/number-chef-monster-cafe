// Per-device settings from the parent area (SPEC §11.3, §12; D135): orders per service, voice,
// speed, volumes and reduced motion. Each is one row of the `settings` store, read through zod so
// a bad or missing row falls back to its default (no schema change: new keys, events untouched).
// The basket side (D115) predates this module and keeps its own row (`basketSide.ts`).
import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { DEFAULT_RATE } from '../audio/speech';
import { ORDERS_PER_SERVICE } from '../engine/config';
import type { Storage } from '../storage/types';

export const ORDER_CHOICES = [4, 6, 8] as const;
export const RATE_MIN = 0.7;
export const RATE_MAX = 1.1;

const volume = z.number().min(0).max(1);

export const SETTING_SCHEMAS = {
  ordersPerService: z.union([z.literal(4), z.literal(6), z.literal(8)]),
  /** `voiceURI` of the chosen voice; `null` = pick automatically (SPEC §8.2). */
  voiceURI: z.string().nullable(),
  speechRate: z.number().min(RATE_MIN).max(RATE_MAX),
  masterVolume: volume,
  sfxVolume: volume,
  voiceVolume: volume,
  /** On forces reduced motion; off follows the device (`prefers-reduced-motion`, SPEC §2.3). */
  reducedMotion: z.boolean(),
} as const;

export type DeviceSettings = { [K in keyof typeof SETTING_SCHEMAS]: z.infer<(typeof SETTING_SCHEMAS)[K]> };
export type SettingKey = keyof DeviceSettings;

/** SPEC §8.2, §8.3: rate 0.85; master / SFX / voice 0.8 / 0.7 / 1.0. */
export const DEFAULT_SETTINGS: DeviceSettings = {
  ordersPerService: ORDERS_PER_SERVICE as 6,
  voiceURI: null,
  speechRate: DEFAULT_RATE,
  masterVolume: 0.8,
  sfxVolume: 0.7,
  voiceVolume: 1,
  reducedMotion: false,
};

const KEYS = Object.keys(SETTING_SCHEMAS) as SettingKey[];

/** Any record (a stored row set or an imported file) → valid settings, defaults where bad. */
export function sanitizeSettings(raw: Record<string, unknown>): DeviceSettings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const k of KEYS) {
    const r = SETTING_SCHEMAS[k].safeParse(raw[k]);
    if (r.success) out[k] = r.data;
  }
  return out as DeviceSettings;
}

// ---------- app-wide copy ----------

let current: DeviceSettings = DEFAULT_SETTINGS;
const listeners = new Set<(s: DeviceSettings) => void>();

export const getSettings = (): DeviceSettings => current;

function publish(next: DeviceSettings): void {
  current = next;
  listeners.forEach((f) => f(next));
}

/** Audio and the motion class listen here; called at once with the current values. */
export function onSettings(f: (s: DeviceSettings) => void): () => void {
  listeners.add(f);
  f(current);
  return () => listeners.delete(f);
}

let loading: Promise<DeviceSettings> = Promise.resolve(DEFAULT_SETTINGS);
/** Read once at boot; later reads would race the parent's own saves. */
export function startSettings(storage: Promise<Storage>): Promise<DeviceSettings> {
  loading = storage.then(loadSettings, () => current);
  return loading;
}
/** Resolves once the stored settings are in (or failed to load and the defaults stand). */
export const settingsLoaded = (): Promise<DeviceSettings> => loading;

async function loadSettings(storage: Storage): Promise<DeviceSettings> {
  try {
    publish(sanitizeSettings(await storage.allSettings()));
  } catch {
    /* defaults stand */
  }
  return current;
}

export async function saveSetting<K extends SettingKey>(
  storage: Storage | null,
  key: K,
  value: DeviceSettings[K],
): Promise<void> {
  publish({ ...current, [key]: value });
  await storage?.setSetting(key, value);
}

const subscribe = (f: () => void) => {
  const g = () => f();
  listeners.add(g);
  return () => listeners.delete(g);
};
export function useSettings(): DeviceSettings {
  return useSyncExternalStore(subscribe, getSettings);
}
