import { describe, expect, it } from 'vitest';
import {
  COLOR_FAMILIES,
  CRATE_HOLD_AT_UNBOUGHT,
  STARTER_SHELF,
  LATER_GROUPS,
  M4_ITEMS,
  TIER_PRICE,
  expandCatalog,
  expandPlanned,
} from '../../src/engine/economy';
import { DEFAULT_PROFILE, percentile, simulate, type SimInput } from '../../src/engine/economySim';
import { mulberry32 } from '../../src/engine/rng';

describe('shop catalog', () => {
  const entries = expandCatalog(M4_ITEMS);

  it('matches SPEC §10: 55 paid entries, 3,105 coins (D148)', () => {
    const paid = entries.filter((e) => e.price > 0);
    expect(paid).toHaveLength(55);
    expect(paid.reduce((s, e) => s + e.price, 0)).toBe(3105);
  });

  it('has unique keys, prices in steps of 5 and known colour families', () => {
    expect(new Set(entries.map((e) => e.key)).size).toBe(entries.length);
    for (const e of entries) {
      expect(e.price % 5).toBe(0);
      if (e.colorway !== 'classic') expect(Object.keys(COLOR_FAMILIES)).toContain(e.colorway);
    }
  });

  it('gives every decor slot exactly one free default (SPEC §10)', () => {
    for (const slot of new Set(entries.map((e) => e.slot))) {
      expect(entries.filter((e) => e.slot === slot && e.price === 0)).toHaveLength(1);
    }
  });

  it('keeps M4 to at most 3 colorways an item, each extra one cheaper than the original', () => {
    for (const def of M4_ITEMS) {
      expect(def.colorways.length).toBeLessThanOrEqual(3);
      expect(new Set(def.colorways).size).toBe(def.colorways.length);
      const [first, ...rest] = entries.filter((e) => e.item === def.id && e.slot === def.slot);
      if (!def.free) for (const e of rest) expect(e.price).toBeLessThan(first!.price);
    }
  });

  it('opens M4 with a starter shelf that covers every slot (D151)', () => {
    const paid = entries.filter((e) => e.price > 0);
    const keys = new Set(paid.map((e) => e.key));
    expect(new Set(STARTER_SHELF).size).toBe(STARTER_SHELF.length);
    for (const k of STARTER_SHELF) expect(keys.has(k)).toBe(true);
    const shelfSlots = new Set(
      paid.filter((e) => STARTER_SHELF.includes(e.key)).map((e) => e.slot),
    );
    for (const slot of new Set(paid.map((e) => e.slot))) expect(shelfSlots.has(slot)).toBe(true);
    // A tier-1 entry is on the shelf, so the first service buys something.
    expect(paid.some((e) => STARTER_SHELF.includes(e.key) && e.price === TIER_PRICE[1])).toBe(true);
    // Bigger than the hold, so no crate lands on top of a fresh shelf.
    expect(STARTER_SHELF.length).toBeGreaterThanOrEqual(CRATE_HOLD_AT_UNBOUGHT);
  });

  it('prices planned groups from the same tiers', () => {
    const planned = expandPlanned(LATER_GROUPS);
    expect(planned).toHaveLength(LATER_GROUPS.reduce((s, g) => s + g.count, 0));
    for (const e of planned) expect(e.price).toBeLessThanOrEqual(TIER_PRICE[e.tier]);
  });
});

describe('economy simulator', () => {
  const steady = { ...DEFAULT_PROFILE, requeueOne: 0, requeueTwo: 0, partialRate: 0 };
  const base = (over: Partial<SimInput> = {}): SimInput => ({
    profile: steady,
    policy: 'impulse',
    maxBuysPerVisit: 2,
    starting: expandCatalog(M4_ITEMS),
    waves: [],
    weeks: 10,
    ...over,
  });

  it('is deterministic for a seed', () => {
    expect(simulate(base(), mulberry32(7))).toEqual(simulate(base(), mulberry32(7)));
  });

  it('pays SPEC §9: 23 a finished 6-order service, plus the warm-up order once', () => {
    const r = simulate(base({ starting: [] }), mulberry32(1));
    const services = r.weeks.reduce((s, w) => s + w.services, 0);
    expect(r.coins).toBe(services * 23 + 3);
    expect(r.monsters).toBe(services * 6);
  });

  it('never spends more than was earned, and buys out a small shop', () => {
    const starting = expandCatalog(M4_ITEMS).slice(0, 8);
    for (const policy of ['impulse', 'cheapest', 'saver'] as const) {
      const r = simulate(base({ starting, policy }), mulberry32(3));
      expect(r.totalSpent).toBeLessThanOrEqual(r.coins);
      expect(r.startingBoughtOutWeek).not.toBeNull();
    }
  });

  it('delivers every crate, and a stock hold keeps the shop from piling up', () => {
    const later = expandPlanned(LATER_GROUPS).filter((e) => e.wave === 'decor');
    const input = base({
      starting: [],
      waves: [{ id: 'decor', opensWeek: 0, entries: later }],
      weeks: 60,
      policy: 'saver',
    });
    const free = simulate({ ...input, crates: { everyMonsters: 20, size: 3 } }, mulberry32(5));
    const held = simulate(
      { ...input, crates: { everyMonsters: 20, size: 3, holdAtStock: 4 } },
      mulberry32(5),
    );
    expect(free.allBoughtOutWeek).not.toBeNull();
    expect(held.allBoughtOutWeek).not.toBeNull();
    expect(held.meanStock).toBeLessThan(free.meanStock);
    expect(held.meanStock).toBeLessThan(4 + 3);
  });

  it('percentile sorts never-happened values last', () => {
    expect(percentile([3, null, 1, 2, 4], 50)).toBe(3);
    expect(percentile([3, null, 1, 2, 4], 100)).toBeNull();
    expect(percentile([null, null], 50)).toBeNull();
  });
});
