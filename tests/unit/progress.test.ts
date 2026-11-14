import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach, describe, expect, it } from 'vitest';
import { Progress } from '../../src/app/progress';
import { DEBUG_SKILL_CONFIG_KEY } from '../../src/app/skillConfig';
import { attemptEvent, coinEvent, serviceEndEvent } from '../../src/engine/events';
import { balance, replay } from '../../src/engine/replay';
import { IdbStorage } from '../../src/storage/idb';
import { MemoryStorage } from '../../src/storage/memory';
import { migrateStored } from '../../src/storage/open';
import type { Migration } from '../../src/storage/migrations';
import type { Storage } from '../../src/storage/types';

beforeEach(() => {
  (globalThis as { indexedDB: unknown }).indexedDB = new IDBFactory();
});

let n = 0;
let clock = 1_700_000_000_000;
const deps = { now: () => ++clock, newId: () => `id-${String(++n).padStart(6, '0')}` };
const ctx = { id: deps.newId, now: deps.now, dev: 'dev' };

const backends: Array<[string, () => Promise<Storage>]> = [
  ['MemoryStorage', async () => new MemoryStorage()],
  ['IdbStorage', () => IdbStorage.open()],
];

describe.each(backends)('%s: event log, resume, cache, snapshot (SPEC §11.3)', (_name, make) => {
  it('commit writes events, resume and state together; events read back without the profile column', async () => {
    const s = await make();
    const e = coinEvent(ctx, { svc: 's', n: 3 });
    await s.commit({ events: [e], resume: { hello: 1 }, state: { throughEventCount: 1, derived: replay([e]) } });
    expect(await s.loadEvents()).toEqual([e]);
    expect(await s.countEvents()).toBe(1);
    expect(await s.getResume()).toEqual({ hello: 1 });
    expect(await s.getState()).toEqual({ throughEventCount: 1, derived: replay([e]) });
    await s.commit({ resume: null });
    expect(await s.getResume()).toBeUndefined();
    // The same id twice is one row (merge-safe).
    await s.commit({ events: [e] });
    expect(await s.countEvents()).toBe(1);
    s.close();
  });

  it('snapshot: one row, replaced by the next', async () => {
    const s = await make();
    await s.setSetting('basketSide', 'left');
    const snap = { takenAt: 1, reason: 'reset' as const, schemaVersion: 1, deviceId: 'd', events: [], settings: await s.allSettings() };
    await s.putSnapshot(snap);
    await s.putSnapshot({ ...snap, takenAt: 2 });
    expect(await s.getSnapshot()).toEqual({ ...snap, takenAt: 2 });
    expect(snap.settings).toEqual({ basketSide: 'left' });
    expect((await s.counts()).snapshots).toBe(1);
    s.close();
  });

  it('migration (harness, D36): snapshot of the old data first, then upcast events, then the version', async () => {
    const s = await make();
    const old = coinEvent(ctx, { svc: 's', n: 3 });
    await s.commit({ events: [old] });
    await s.setMeta('schemaVersion', 1);
    const double: Migration = { from: 1, to: 2, upcast: (e) => ({ ...(e as object), n: 6 }) };
    await migrateStored(s, 1, 'dev', () => 42, [double], 2);
    expect((await s.getSnapshot())?.events).toEqual([old]);
    expect((await s.getSnapshot())?.reason).toBe('migration');
    expect(await s.loadEvents()).toEqual([{ ...old, n: 6 }]);
    expect(await s.getMeta('schemaVersion')).toBe(2);
    s.close();
  });
});

describe('Progress (derived state in memory, log on disk)', () => {
  it('coins survive a killed app: a fresh load replays to the same balance', async () => {
    const s = await IdbStorage.open();
    const p = await Progress.load(s, 'dev', deps);
    p.append([attemptEvent(ctx, { svc: 's', fact: 'A1:+:2,3', skill: 'A1', stage: 3, outcome: 'first', ms: 1 }), coinEvent(ctx, { svc: 's', n: 3 })]);
    p.append([coinEvent(ctx, { svc: 's', n: 3 })]);
    expect(balance(p.derived)).toBe(6);
    await p.flush();
    // "Killed": no serviceEnd, nothing else flushed. Open again from disk.
    const again = await Progress.load(s, 'dev', deps);
    expect(balance(again.derived)).toBe(6);
    expect(again.derived).toEqual(p.derived);
    s.close();
  });

  it('uses the state cache when it covers the log; rebuilds it when it does not', async () => {
    const s = new MemoryStorage();
    const p = await Progress.load(s, 'dev', deps);
    p.append([coinEvent(ctx, { svc: 's', n: 3 })]);
    await p.flush();
    expect(await s.getState()).toEqual({ throughEventCount: 1, derived: p.derived });
    // An event written without the cache (e.g. a crash between writes): the counts disagree.
    await s.commit({ events: [coinEvent(ctx, { svc: 's', n: 3 })] });
    const again = await Progress.load(s, 'dev', deps);
    expect(balance(again.derived)).toBe(6);
    expect(await s.getState()).toEqual({ throughEventCount: 2, derived: again.derived });
  });

  it('an event that sorts before the last (clock set back) leaves the cache to rebuild on the next boot', async () => {
    const s = new MemoryStorage();
    const p = await Progress.load(s, 'dev', deps);
    p.append([coinEvent({ ...ctx, now: () => 2_000_000_000_000 }, { svc: 's', n: 3 })]);
    p.append([coinEvent({ ...ctx, now: () => 1_000 }, { svc: 's', n: 5 })]);
    await p.flush();
    expect((await s.getState() as { throughEventCount: number }).throughEventCount).toBe(1);
    const again = await Progress.load(s, 'dev', deps);
    expect(balance(again.derived)).toBe(8);
  });

  it('a resumed service ending twice is tipped once', async () => {
    const s = new MemoryStorage();
    const p = await Progress.load(s, 'dev', deps);
    const end = (tip: number, partial: boolean) =>
      serviceEndEvent(ctx, { svc: 's', skill: 'A1', seed: 1, orders: 6, served: 3, tip, activeMs: 1, partial });
    p.append([coinEvent(ctx, { svc: 's', n: 3 }), end(0, true)]);
    p.append([coinEvent(ctx, { svc: 's', n: 3 }), end(5, false)]);
    expect(balance(p.derived)).toBe(11);
  });

  it('the pre-M3a playtest picker becomes skillConfig events once, then the setting is gone (D125)', async () => {
    const s = new MemoryStorage();
    await s.setSetting(DEBUG_SKILL_CONFIG_KEY, { A1: { stage: 1, ops: 'sub' }, A9: { stage: 9 } });
    const p = await Progress.load(s, 'dev', deps);
    expect(p.derived.config).toEqual({ A1: { stage: 1, ops: 'sub' } });
    expect(await s.getSetting(DEBUG_SKILL_CONFIG_KEY)).toBeUndefined();
    expect((await s.loadEvents()).map((e) => e.k)).toEqual(['skillConfig']);
    const again = await Progress.load(s, 'dev', deps);
    expect(again.derived.config).toEqual({ A1: { stage: 1, ops: 'sub' } });
    expect(await s.countEvents()).toBe(1);
  });

  it('resume rows round-trip and are cleared with null', async () => {
    const s = new MemoryStorage();
    const p = await Progress.load(s, 'dev', deps);
    p.setResume(null);
    expect(await p.getResume()).toBeNull();
    // A damaged row is never offered.
    await s.commit({ resume: { svc: 1 } });
    expect(await p.getResume()).toBeNull();
  });
});
