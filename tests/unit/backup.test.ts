import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  APP_ID,
  buildExport,
  checksumOf,
  exportFileName,
  ImportError,
  parseImport,
  replaceFromImport,
  resetAll,
} from '../../src/storage/backup';
import { IdbStorage } from '../../src/storage/idb';
import { MemoryStorage } from '../../src/storage/memory';
import { ensureMeta } from '../../src/storage/open';
import type { Storage } from '../../src/storage/types';
import type { Evt } from '../../src/engine/events';
import { STORE_NAMES } from '../../src/storage/names';

beforeEach(() => {
  (globalThis as { indexedDB: unknown }).indexedDB = new IDBFactory();
});

const ev = (id: string, t: number, extra: Partial<Evt> = {}): Evt =>
  ({ id, t, dev: 'devA', v: 1, k: 'coin', svc: 's1', n: 3, ...extra }) as Evt;

const LOG: Evt[] = [
  ev('a', 100),
  { id: 'b', t: 200, dev: 'devA', v: 1, k: 'attempt', svc: 's1', fact: 'A1:+:1,2', skill: 'A1', stage: 3, outcome: 'first', ms: 900 },
  { id: 'c', t: 300, dev: 'devA', v: 1, k: 'serviceEnd', svc: 's1', skill: 'A1', seed: 7, orders: 6, served: 6, tip: 5, activeMs: 1000, partial: false },
  { id: 'd', t: 400, dev: 'devA', v: 1, k: 'skillConfig', skill: 'A2', stage: 0, ops: 'sub' },
];

async function seeded(s: Storage): Promise<string> {
  const { deviceId } = await ensureMeta(s, () => 1);
  await s.commit({ events: LOG, resume: { svc: 's9' } });
  await s.setSetting('ordersPerService', 8);
  await s.setSetting('basketSide', 'left');
  return deviceId;
}

const backends: Array<[string, () => Promise<Storage>]> = [
  ['MemoryStorage', async () => new MemoryStorage()],
  ['IdbStorage', () => IdbStorage.open()],
];

describe('export file (SPEC §11.6, D136)', () => {
  it('names the file by local date', () => {
    expect(exportFileName(new Date(2026, 10, 9, 15).getTime())).toBe('number-chef-backup-2026-11-09.json');
  });

  it('checksum is the hex SHA-256 of {events, settings}', async () => {
    const c = await checksumOf([], {});
    // sha256('{"events":[],"settings":{}}')
    expect(c).toMatch(/^[0-9a-f]{64}$/);
    expect(c).toBe(await checksumOf([], {}));
    expect(c).not.toBe(await checksumOf([], { a: 1 }));
  });
});

describe.each(backends)('%s backup', (_n, make) => {
  it('exports the §11.6 shape and imports it back with the checksum verified', async () => {
    const s = await make();
    const dev = await seeded(s);
    const out = await buildExport(s, dev, 5000);
    expect(Object.keys(out.file)).toEqual([
      'app',
      'schemaVersion',
      'deviceId',
      'deviceLabel',
      'exportedAt',
      'events',
      'settings',
      'checksum',
    ]);
    expect(out.file.app).toBe(APP_ID);
    expect(out.file.events.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(out.file.checksum).toBe(await checksumOf(out.file.events, out.file.settings));
    const imp = await parseImport(out.json);
    expect(imp.checksumOk).toBe(true);
    expect(imp.events).toEqual(LOG);
    expect(imp.settings).toEqual({ ordersPerService: 8, basketSide: 'left' });
    expect(imp.coins).toBe(8);
    expect(imp.span).toEqual({ from: 100, to: 400 });
    s.close();
  });

  it('replace snapshots first, swaps events and settings, clears resume and keeps meta', async () => {
    const s = await make();
    const dev = await seeded(s);
    const other: Evt[] = [ev('x', 50, { n: 2 } as Partial<Evt>)];
    const imp = await parseImport(
      JSON.stringify({
        app: APP_ID,
        schemaVersion: 1,
        deviceId: 'devB',
        deviceLabel: 'iPad',
        exportedAt: 9,
        events: other,
        settings: { voiceVolume: 0.5 },
        checksum: await checksumOf(other, { voiceVolume: 0.5 }),
      }),
    );
    await replaceFromImport(s, dev, imp, 777);
    expect((await s.loadEvents()).map((e) => e.id)).toEqual(['x']);
    expect(await s.allSettings()).toEqual({ voiceVolume: 0.5 });
    expect(await s.getResume()).toBeUndefined();
    expect(await s.getState()).toBeUndefined();
    expect(await s.getMeta('deviceId')).toBe(dev);
    const snap = (await s.getSnapshot())!;
    expect(snap).toMatchObject({ reason: 'replace', takenAt: 777, deviceId: dev });
    expect(snap.events.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(snap.settings).toEqual({ ordersPerService: 8, basketSide: 'left' });
    s.close();
  });

  it('reset snapshots first and empties every store except snapshots', async () => {
    const s = await make();
    const dev = await seeded(s);
    await resetAll(s, dev, 888);
    const counts = await s.counts();
    for (const n of STORE_NAMES) expect(counts[n], n).toBe(n === 'snapshots' ? 1 : 0);
    const snap = (await s.getSnapshot())!;
    expect(snap).toMatchObject({ reason: 'reset', takenAt: 888 });
    expect(snap.events).toHaveLength(4);
    // The next boot starts a fresh device.
    const meta = await ensureMeta(s, () => 2);
    expect(meta.deviceId).not.toBe(dev);
    s.close();
  });
});

describe('import validation', () => {
  const good = async (events: unknown[] = LOG, settings: Record<string, unknown> = {}) => ({
    app: APP_ID,
    schemaVersion: 1,
    deviceId: 'd',
    deviceLabel: '',
    exportedAt: 1,
    events,
    settings,
    checksum: await checksumOf(events, settings),
  });

  it('rejects text that is not a backup', async () => {
    await expect(parseImport('not json')).rejects.toBeInstanceOf(ImportError);
    await expect(parseImport('{"app":"other"}')).rejects.toThrow("isn't a Number Chef backup");
    await expect(parseImport(JSON.stringify({ ...(await good()), app: 'someone-else' }))).rejects.toBeInstanceOf(ImportError);
  });

  it('refuses a newer schema with a clear message', async () => {
    await expect(parseImport(JSON.stringify({ ...(await good()), schemaVersion: 4 }))).rejects.toThrow(/newer app version/);
  });

  it('rejects a damaged event', async () => {
    const bad = [{ ...LOG[0], k: 'coin', n: 'three' }];
    await expect(parseImport(JSON.stringify(await good(bad)))).rejects.toThrow(/damaged/);
    const unknown = [{ ...LOG[0], k: 'teleport' }];
    await expect(parseImport(JSON.stringify(await good(unknown)))).rejects.toBeInstanceOf(ImportError);
  });

  it('flags a checksum mismatch without refusing (the parent confirms twice)', async () => {
    const f = await good();
    (f.events[0] as { n: number }).n = 500;
    const imp = await parseImport(JSON.stringify(f));
    expect(imp.checksumOk).toBe(false);
    expect(imp.coins).toBe(505);
  });

  it('keeps one copy of a duplicated event id', async () => {
    const imp = await parseImport(JSON.stringify(await good([...LOG, LOG[0]])));
    expect(imp.events).toHaveLength(4);
  });
});
