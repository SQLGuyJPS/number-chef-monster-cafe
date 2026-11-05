import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { IdbStorage } from '../../src/storage/idb';
import { MemoryStorage } from '../../src/storage/memory';
import { SCHEMA_VERSION, UnknownSchemaVersionError } from '../../src/storage/migrations';
import { DB_NAME, STORE_NAMES } from '../../src/storage/names';
import { ensureMeta, openStorage } from '../../src/storage/open';
import type { Storage } from '../../src/storage/types';

function setIndexedDB(value: unknown): void {
  (globalThis as { indexedDB: unknown }).indexedDB = value;
}

beforeEach(() => {
  // Fresh factory per test: no state leaks between tests.
  setIndexedDB(new IDBFactory());
});

const backends: Array<[string, () => Promise<Storage>]> = [
  ['MemoryStorage', async () => new MemoryStorage()],
  ['IdbStorage', () => IdbStorage.open()],
];

describe.each(backends)('%s', (_name, make) => {
  it('ensureMeta writes schemaVersion, createdAt (injected clock) and a deviceId', async () => {
    const s = await make();
    const meta = await ensureMeta(s, () => 12345);
    expect(meta.schemaVersion).toBe(1);
    expect(meta.deviceId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await s.getMeta('schemaVersion')).toBe(SCHEMA_VERSION);
    expect(await s.getMeta('createdAt')).toBe(12345);
    expect(await s.getMeta('deviceId')).toBe(meta.deviceId);
    s.close();
  });

  it('ensureMeta again keeps the same deviceId and createdAt', async () => {
    const s = await make();
    const a = await ensureMeta(s, () => 1);
    const b = await ensureMeta(s, () => 2);
    expect(b.deviceId).toBe(a.deviceId);
    expect(await s.getMeta('createdAt')).toBe(1);
    s.close();
  });

  it('settings set / get / overwrite / delete', async () => {
    const s = await make();
    expect(await s.getSetting('volume')).toBeUndefined();
    await s.setSetting('volume', 0.5);
    await s.setSetting('names', { a: [1, 2] });
    expect(await s.getSetting<number>('volume')).toBe(0.5);
    expect(await s.getSetting('names')).toEqual({ a: [1, 2] });
    await s.setSetting('volume', 0.9);
    expect(await s.getSetting<number>('volume')).toBe(0.9);
    await s.deleteSetting('volume');
    expect(await s.getSetting('volume')).toBeUndefined();
    s.close();
  });

  it('counts() has exactly the 7 store names', async () => {
    const s = await make();
    const c = await s.counts();
    expect(Object.keys(c).sort()).toEqual([...STORE_NAMES].sort());
    expect(Object.keys(c)).toHaveLength(7);
    await s.setSetting('x', 1);
    expect((await s.counts()).settings).toBe(1);
    s.close();
  });

  it('ensureMeta throws UnknownSchemaVersionError for a newer stored schema', async () => {
    const s = await make();
    await s.setMeta('schemaVersion', 2);
    await expect(ensureMeta(s, () => 0)).rejects.toBeInstanceOf(UnknownSchemaVersionError);
    s.close();
  });
});

describe('IdbStorage specifics', () => {
  it('uses the ncmc-v1 database with all stores and the events.t index', async () => {
    const s = await IdbStorage.open();
    s.close();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open(DB_NAME);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    expect(db.name).toBe('ncmc-v1');
    expect([...db.objectStoreNames].sort()).toEqual([...STORE_NAMES].sort());
    expect(db.objectStoreNames).toHaveLength(7);
    const tx = db.transaction('events', 'readonly');
    expect([...tx.objectStore('events').indexNames]).toContain('t');
    db.close();
    const dbs = await indexedDB.databases();
    expect(dbs.map((d) => d.name)).toEqual(['ncmc-v1']);
  });

  it('reopening after close sees the same deviceId', async () => {
    const a = await IdbStorage.open();
    const { deviceId } = await ensureMeta(a, () => 1);
    a.close();
    const b = await IdbStorage.open();
    expect(await b.getMeta('deviceId')).toBe(deviceId);
    expect((await ensureMeta(b, () => 2)).deviceId).toBe(deviceId);
    b.close();
  });
});

describe('openStorage', () => {
  it('returns idb, not degraded, with fake IndexedDB', async () => {
    const boot = await openStorage(() => 99);
    expect(boot.storage.kind).toBe('idb');
    expect(boot.degraded).toBe(false);
    expect(boot.error).toBeUndefined();
    expect(boot.schemaVersion).toBe(1);
    expect(boot.deviceId).toBeTruthy();
    boot.storage.close();
  });

  it('falls back to memory (degraded, with an error string) when indexedDB.open throws', async () => {
    setIndexedDB({
      open() {
        throw new Error('SecurityError: denied');
      },
    });
    const boot = await openStorage(() => 5);
    expect(boot.storage.kind).toBe('memory');
    expect(boot.degraded).toBe(true);
    expect(typeof boot.error).toBe('string');
    expect(boot.error).toContain('denied');
    expect(boot.deviceId).toBeTruthy();
    expect(boot.schemaVersion).toBe(1);
  });
});
