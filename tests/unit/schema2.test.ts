// schemaVersion 1 → 2 (M4a, D154): fixture tests for the first schema change (CLAUDE.md, D36).
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import fixture from '../fixtures/backup-schema1.json';
import { crateEvent, equipEvent, type Evt } from '../../src/engine/events';
import { balance, replay } from '../../src/engine/replay';
import { APP_ID, buildExport, checksumOf, parseImport } from '../../src/storage/backup';
import { IdbStorage } from '../../src/storage/idb';
import { SCHEMA_VERSION } from '../../src/storage/migrations';
import { ensureMeta } from '../../src/storage/open';

beforeEach(() => {
  (globalThis as { indexedDB: unknown }).indexedDB = new IDBFactory();
});

const V1_EVENTS = fixture.events as Evt[];

describe('schema 1 → 2', () => {
  it('a schema-1 device boots on schema 2 with the same log and a snapshot of the old data', async () => {
    const s = await IdbStorage.open();
    await s.setMeta('schemaVersion', 1);
    await s.setMeta('deviceId', 'dev-v1');
    await s.commit({ events: V1_EVENTS });
    const before = replay(await s.loadEvents());

    const meta = await ensureMeta(s, () => 99);
    expect(meta.schemaVersion).toBe(2);
    expect(await s.getMeta('schemaVersion')).toBe(SCHEMA_VERSION);
    const after = await s.loadEvents();
    expect(after).toEqual(V1_EVENTS);
    expect(replay(after)).toEqual(before);
    expect(balance(replay(after))).toBe(8);
    const snap = await s.getSnapshot();
    expect(snap).toMatchObject({ reason: 'migration', schemaVersion: 1, takenAt: 99 });
    expect(snap?.events).toEqual(V1_EVENTS);
    s.close();
  });

  it('imports the schema-1 backup fixture unchanged', async () => {
    const imp = await parseImport(JSON.stringify(fixture));
    expect(imp.checksumOk).toBe(true);
    expect(imp.events).toEqual(V1_EVENTS);
  });

  it('exports and re-imports the new equip and crate events', async () => {
    let k = 0;
    const ctx = { id: () => `x-${++k}`, now: () => 1763000000400, dev: 'dev-v2' };
    const events = [
      ...V1_EVENTS,
      equipEvent(ctx, { slot: 'wallpaper', items: ['wallpaper.plain.berry'] }),
      crateEvent(ctx, { n: 1, next: 31 }),
    ];
    const s = await IdbStorage.open();
    const { deviceId } = await ensureMeta(s, () => 1);
    await s.commit({ events });
    const { json, file } = await buildExport(s, deviceId, 2);
    expect(file.schemaVersion).toBe(2);
    const imp = await parseImport(json);
    expect(imp.events.map((e) => e.k).sort()).toEqual(
      ['attempt', 'coin', 'crate', 'equip', 'serviceEnd', 'skillConfig'].sort(),
    );
    s.close();
  });

  it('rejects a damaged crate or equip event', async () => {
    const bad = [{ id: 'z', t: 1, dev: 'd', v: 1, k: 'crate', n: 0, next: 3 }];
    const file = {
      app: APP_ID,
      schemaVersion: 2,
      deviceId: 'd',
      deviceLabel: '',
      exportedAt: 1,
      events: bad,
      settings: {},
      checksum: await checksumOf(bad, {}),
    };
    await expect(parseImport(JSON.stringify(file))).rejects.toThrow(/damaged/);
    const bad2 = [{ id: 'z', t: 1, dev: 'd', v: 1, k: 'equip', slot: 'floor', items: 'x' }];
    await expect(
      parseImport(
        JSON.stringify({ ...file, events: bad2, checksum: await checksumOf(bad2, {}) }),
      ),
    ).rejects.toThrow(/damaged/);
  });
});
