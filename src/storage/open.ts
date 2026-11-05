import { IdbStorage } from './idb';
import { MemoryStorage } from './memory';
import { newId } from './ids';
import { SCHEMA_VERSION, UnknownSchemaVersionError } from './migrations';
import type { Storage } from './types';

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
  // schemaVersion < SCHEMA_VERSION: migrate events here once the first migration exists (D36).
  let deviceId = await storage.getMeta('deviceId');
  if (!deviceId) {
    deviceId = newId();
    await storage.setMeta('deviceId', deviceId);
  }
  return { deviceId, schemaVersion };
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
