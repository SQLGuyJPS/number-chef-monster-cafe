// The coin shop over the event log (SPEC §10, §10.1, §11.2, D154).
import { describe, expect, it } from 'vitest';
import {
  buyEvent,
  coinEvent,
  crateEvent,
  equipEvent,
  serviceEndEvent,
  type Evt,
} from '../../src/engine/events';
import { CRATE_HOLD_AT_UNBOUGHT, STARTER_SHELF } from '../../src/engine/economy';
import { balance, earned, replay, servedMonsters, type Derived } from '../../src/engine/replay';
import {
  CATALOG,
  CRATE_QUEUE,
  canBuy,
  crateEntries,
  dueCrate,
  entryOf,
  equippedKey,
  freeDefault,
  shelfKeys,
  slotShelf,
  unboughtOnShelf,
} from '../../src/engine/shop';

function maker(dev: string, start = 1_000) {
  let n = 0;
  let t = start;
  return { id: () => `${dev}-${String(++n).padStart(5, '0')}`, now: () => ++t, dev };
}

/** A device's log, built a step at a time, with the shop's own rules deciding each crate. */
class Device {
  events: Evt[] = [];
  constructor(readonly ctx = maker('a')) {}
  get d(): Derived {
    return replay(this.events);
  }
  serve(served: number, coins = served * 3) {
    const svc = this.ctx.id();
    this.events.push(coinEvent(this.ctx, { svc, n: coins }));
    this.events.push(
      serviceEndEvent(this.ctx, {
        svc,
        skill: 'A1',
        seed: 1,
        orders: served,
        served,
        tip: 0,
        activeMs: 1,
        partial: false,
      }),
    );
  }
  /** A shop visit: at most one crate (D154). */
  visit(): { n: number; next: number } | null {
    const c = dueCrate(this.d);
    if (c) this.events.push(crateEvent(this.ctx, c));
    return c;
  }
  buy(key: string) {
    const e = entryOf(key)!;
    if (canBuy(this.d, key) === 'ok') this.events.push(buyEvent(this.ctx, { item: key, price: e.price }));
  }
  /** Buys from the shelf until at most `left` unbought entries remain. */
  buyDownTo(left: number) {
    for (const k of unboughtOnShelf(this.d)) {
      if (unboughtOnShelf(this.d).length <= left) return;
      this.serve(0, entryOf(k)!.price);
      this.buy(k);
    }
  }
}

describe('catalog and queue (SPEC §10)', () => {
  it('51 paid entries, 2,305 coins, no bell', () => {
    const paid = CATALOG.filter((e) => e.price > 0);
    expect(paid).toHaveLength(51);
    expect(paid.reduce((s, e) => s + e.price, 0)).toBe(2305);
    expect(CATALOG.some((e) => e.item.includes('bell'))).toBe(false);
  });

  it('every starter entry is in the catalog; the queue holds the other 33, fixed and distinct', () => {
    for (const k of STARTER_SHELF) expect(entryOf(k), k).toBeDefined();
    expect(CRATE_QUEUE).toHaveLength(33);
    expect(new Set(CRATE_QUEUE).size).toBe(33);
    expect(CRATE_QUEUE.some((k) => STARTER_SHELF.includes(k))).toBe(false);
    expect(crateEntries(1)).toEqual(CRATE_QUEUE.slice(0, 2));
    expect(crateEntries(17)).toEqual([CRATE_QUEUE[32]]);
    expect(crateEntries(18)).toEqual([]);
  });

  it('a fresh café shows the free defaults and the starter shelf', () => {
    const d = replay([]);
    expect(shelfKeys(d)).toHaveLength(18 + 6);
    expect(unboughtOnShelf(d)).toHaveLength(18);
    expect(equippedKey(d, 'wallpaper')).toBe('wallpaper.plain.sunny');
    expect(equippedKey(d, 'counter')).toBe(freeDefault('counter').key);
    const wall = slotShelf(d, 'wallpaper');
    expect(wall.map((i) => i.item)).toEqual(['plain', 'polka-dots', 'stripes']);
    expect(wall[0]!.entries.map((e) => e.colorway)).toEqual(['sunny', 'berry', 'lavender']);
  });
});

describe('buying (SPEC §10, §11.2)', () => {
  it('needs the coins, is charged once, and never lowers earned coins', () => {
    const dv = new Device();
    expect(canBuy(dv.d, 'wallpaper.plain.berry')).toBe('short');
    dv.serve(6, 25);
    expect(canBuy(dv.d, 'wallpaper.plain.berry')).toBe('ok');
    const before = earned(dv.d);
    dv.buy('wallpaper.plain.berry');
    expect(balance(dv.d)).toBe(5);
    expect(earned(dv.d)).toBe(before);
    expect(canBuy(dv.d, 'wallpaper.plain.berry')).toBe('owned');
    // The same purchase recorded twice (two devices, or a double tap that got through) is charged once.
    dv.events.push(buyEvent(maker('b'), { item: 'wallpaper.plain.berry', price: 20 }));
    expect(balance(dv.d)).toBe(5);
    expect(canBuy(dv.d, 'wallpaper.plain.sunny')).toBe('owned');
    expect(canBuy(dv.d, 'nope')).toBe('unknown');
  });

  it('equip shows an owned entry; an unowned one falls back to the free default', () => {
    const dv = new Device();
    dv.serve(10);
    dv.events.push(equipEvent(dv.ctx, { slot: 'wallpaper', items: ['wallpaper.plain.berry'] }));
    expect(equippedKey(dv.d, 'wallpaper')).toBe('wallpaper.plain.sunny');
    dv.buy('wallpaper.plain.berry');
    expect(equippedKey(dv.d, 'wallpaper')).toBe('wallpaper.plain.berry');
    dv.events.push(equipEvent(dv.ctx, { slot: 'wallpaper', items: ['wallpaper.plain.sunny'] }));
    expect(equippedKey(dv.d, 'wallpaper')).toBe('wallpaper.plain.sunny');
    // A key from another slot is ignored.
    dv.events.push(equipEvent(dv.ctx, { slot: 'floor', items: ['wallpaper.plain.berry'] }));
    expect(equippedKey(dv.d, 'floor')).toBe('floor.wood.classic');
  });
});

describe('crates (SPEC §10.1, D154)', () => {
  it('the hold at 6: no crate while 6 or more unbought entries are on the shelf', () => {
    const dv = new Device();
    dv.serve(200);
    expect(dv.visit()).toBeNull();
    dv.buyDownTo(CRATE_HOLD_AT_UNBOUGHT);
    expect(unboughtOnShelf(dv.d)).toHaveLength(6);
    expect(dv.visit()).toBeNull();
    dv.buyDownTo(5);
    const c = dv.visit();
    expect(c).toEqual({ n: 1, next: servedMonsters(dv.d) + 1 });
    for (const k of crateEntries(1)) expect(shelfKeys(dv.d)).toContain(k);
    expect(unboughtOnShelf(dv.d)).toHaveLength(7);
  });

  it('a backlog arrives one crate per visit, never as a pile', () => {
    const dv = new Device();
    dv.serve(1000);
    dv.buyDownTo(0);
    expect(dv.visit()?.n).toBe(1);
    // Straight after a crate, the next waits for at least one more monster (next = served + 1).
    expect(dv.visit()).toBeNull();
    dv.serve(1);
    expect(dv.visit()?.n).toBe(2);
    // Then the usual pace again: 30 monsters from that due point.
    dv.serve(29);
    expect(dv.visit()).toBeNull();
    dv.serve(1);
    expect(dv.visit()?.n).toBe(3);
    // Six unbought now: the hold stops the backlog.
    dv.serve(30);
    expect(dv.visit()).toBeNull();
    expect(unboughtOnShelf(dv.d)).toHaveLength(6);
  });

  it('keeps a pace of 30 monsters from the due point, not from the visit', () => {
    const dv = new Device();
    dv.buyDownTo(0);
    // The first crate is due at once; the second 30 monsters after that.
    expect(dv.visit()).toEqual({ n: 1, next: 30 });
    dv.buyDownTo(0);
    dv.serve(29);
    expect(dv.visit()).toBeNull();
    dv.serve(1);
    expect(dv.visit()).toEqual({ n: 2, next: 60 });
    dv.buyDownTo(0);
    dv.serve(35); // a visit 5 monsters late: the next is still due at 90, not 95
    expect(dv.visit()).toEqual({ n: 3, next: 90 });
    dv.buyDownTo(0);
    dv.serve(100); // a long gap: one crate now, the next at the following monster
    expect(dv.visit()).toEqual({ n: 4, next: 166 });
  });

  it('stops when the queue is empty', () => {
    const dv = new Device();
    dv.serve(5000);
    let crates = 0;
    for (let i = 0; i < 40; i++) {
      dv.buyDownTo(0);
      if (dv.visit()) crates++;
      dv.serve(30);
    }
    expect(crates).toBe(17);
    expect(unboughtOnShelf(dv.d)).toHaveLength(0);
    expect(shelfKeys(dv.d)).toHaveLength(CATALOG.length);
  });

  it('two devices merge to the same shelf; one crate n counts once, with the smaller next', () => {
    const a = new Device(maker('a', 1_000));
    const b = new Device(maker('b', 5_000));
    for (const dv of [a, b]) {
      dv.serve(100);
      dv.buyDownTo(0);
    }
    a.serve(3);
    const ca = a.visit()!;
    const cb = b.visit()!;
    expect(ca.n).toBe(1);
    expect(cb.n).toBe(1);
    expect(ca.next).not.toBe(cb.next);
    const merged = replay([...a.events, ...b.events]);
    const mergedRev = replay([...b.events, ...a.events]);
    expect(merged).toEqual(mergedRev);
    expect(Object.keys(merged.crates)).toEqual(['1']);
    expect(merged.crates[1]).toBe(Math.min(ca.next, cb.next));
    expect(shelfKeys(merged)).toEqual(shelfKeys(a.d));
    expect(shelfKeys(merged)).toEqual(shelfKeys(b.d));
    // The next crate on either device after the merge is crate 2.
    expect(dueCrate(merged)?.n ?? 2).toBe(2);
  });

  it('served monsters count the largest row per service (a resumed service ends twice)', () => {
    const ctx = maker('a');
    const end = (served: number) =>
      serviceEndEvent(ctx, {
        svc: 's1',
        skill: 'A1',
        seed: 1,
        orders: 6,
        served,
        tip: 0,
        activeMs: 1,
        partial: true,
      });
    expect(servedMonsters(replay([end(2), end(5)]))).toBe(5);
  });
});
