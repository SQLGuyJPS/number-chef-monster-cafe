import { IdbStorage } from './idb';
import { MemoryStorage } from './memory';
import { newId } from './ids';
import { migrateEvents, migrations, SCHEMA_VERSION, UnknownSchemaVersionError, type Migration } from './migrations';
import type { Storage } from './types';
import type { Evt } from '../engine/events';
import { emptyDerived } from '../engine/replay';

export interface StorageBoot {
  storage: Storage;
  /** IndexedDB failed; running in memory. Shown to the parent only (SPEC §11.3). */
  degraded: boolean;
  error?: string;
  deviceId: string;
  schemaVersion: number;
}

const OPEN_TIMEOUT_MS = 4000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`IndexedDB open timed out after ${ms} ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(id);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/** Writes the meta skeleton on first boot: schemaVersion, a random deviceId and createdAt. */
export async function ensureMeta(storage: Storage, now: () => number): Promise<{ deviceId: string; schemaVersion: number }> {
  let schemaVersion = await storage.getMeta('schemaVersion');
  if (schemaVersion === undefined) {
    schemaVersion = SCHEMA_VERSION;
    await storage.setMeta('schemaVersion', schemaVersion);
    await storage.setMeta('createdAt', now());
  }
  if (schemaVersion > SCHEMA_VERSION) throw new UnknownSchemaVersionError(schemaVersion, SCHEMA_VERSION);
  let deviceId = await storage.getMeta('deviceId');
  if (!deviceId) {
    deviceId = newId();
    await storage.setMeta('deviceId', deviceId);
  }
  if (schemaVersion < SCHEMA_VERSION) {
    await migrateStored(storage, schemaVersion, deviceId, now);
    schemaVersion = SCHEMA_VERSION;
  }
  return { deviceId, schemaVersion };
}

/**
 * Upcasts the stored log (SPEC §11.3, D36): a snapshot of the data as it was first, then the
 * upcast events and an emptied state cache (rebuilt by the next replay), then the new version.
 */
export async function migrateStored(
  storage: Storage,
  from: number,
  deviceId: string,
  now: () => number,
  list: readonly Migration[] = migrations,
  target: number = SCHEMA_VERSION,
): Promise<void> {
  const events = await storage.loadEvents();
  const upcast = migrateEvents(events, from, list, target) as Evt[];
  await storage.putSnapshot({
    takenAt: now(),
    reason: 'migration',
    schemaVersion: from,
    deviceId,
    events,
    settings: await storage.allSettings(),
  });
  await storage.commit({ events: upcast, state: { throughEventCount: -1, derived: emptyDerived() } });
  await storage.setMeta('schemaVersion', target);
}

export async function openStorage(now: () => number): Promise<StorageBoot> {
  try {
    const storage = await withTimeout(IdbStorage.open(), OPEN_TIMEOUT_MS);
    const meta = await ensureMeta(storage, now);
    return { storage, degraded: false, ...meta };
  } catch (e) {
    const storage = new MemoryStorage();
    const meta = await ensureMeta(storage, now);
    return { storage, degraded: true, error: e instanceof Error ? e.message : String(e), ...meta };
  }
}
