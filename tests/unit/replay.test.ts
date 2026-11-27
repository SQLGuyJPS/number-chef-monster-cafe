import { describe, expect, it } from 'vitest';
import type { Outcome } from '../../src/engine/attempt';
import {
  attemptEvent,
  coinEvent,
  crateEvent,
  equipEvent,
  serviceEndEvent,
  skillConfigEvent,
  type BuyEvt,
  type Evt,
  coinAdjustEvent,
} from '../../src/engine/events';
import { pool } from '../../src/engine/generators';
import {
  applyEvent,
  balance,
  boxMap,
  boxOf,
  earned,
  emptyDerived,
  inOrder,
  nextBox,
  replay,
  seenSet,
  servicesOf,
  type Derived,
  coinAdjustTo,
} from '../../src/engine/replay';
import { mulberry32, type Rng } from '../../src/engine/rng';
import type { SkillId, Stage } from '../../src/engine/types';

const OUTCOMES: Outcome[] = ['first', 'afterHint', 'fixed', 'assisted'];
const STAGES: Stage[] = [3, 2, 1, 0];

function ctxAt(t: number, id: string, dev = 'd1') {
  return { id: () => id, now: () => t, dev };
}

describe('nextBox (SPEC §4.2, D29)', () => {
  it('first at S1/S0 moves up one box, capped at 4', () => {
    for (const s of [1, 0] as Stage[]) {
      expect(nextBox(0, 'first', s)).toBe(1);
      expect(nextBox(3, 'first', s)).toBe(4);
      expect(nextBox(4, 'first', s)).toBe(4);
    }
  });
  it('first at S3/S2 and afterHint leave the box', () => {
    for (let b = 0; b <= 4; b++) {
      expect(nextBox(b, 'first', 3)).toBe(b);
      expect(nextBox(b, 'first', 2)).toBe(b);
      for (const s of STAGES) expect(nextBox(b, 'afterHint', s)).toBe(b);
    }
  });
  it('fixed and assisted reset to 0 at every stage', () => {
    for (let b = 0; b <= 4; b++)
      for (const s of STAGES) {
        expect(nextBox(b, 'fixed', s)).toBe(0);
        expect(nextBox(b, 'assisted', s)).toBe(0);
      }
  });
});

describe('two box sets, no preset (SPEC §4.2, D127)', () => {
  const at = (id: string, t: number, stage: Stage, outcome: Outcome, fact = 'A2:+:4,4') =>
    attemptEvent(ctxAt(t, id), { svc: 's', fact, skill: 'A2', stage, outcome, ms: 1 });

  it('no fact starts seen or above box 0: +1 and doubles are new like any other fact', () => {
    const d = replay([]);
    expect(boxOf(d, 'A2:+:4,4', 'tray')).toBe(0);
    expect(boxOf(d, 'A2:+:1,7', 'num')).toBe(0);
    expect(seenSet(d).size).toBe(0);
    expect(boxMap(d, 'tray').size).toBe(0);
  });

  it('a first try at S1 raises only the tray box; at S0 only the number box', () => {
    const s1 = replay([at('a', 1, 1, 'first'), at('b', 2, 1, 'first')]);
    expect(boxOf(s1, 'A2:+:4,4', 'tray')).toBe(2);
    expect(boxOf(s1, 'A2:+:4,4', 'num')).toBe(0);
    const s0 = replay([at('a', 1, 0, 'first')]);
    expect(boxOf(s0, 'A2:+:4,4', 'tray')).toBe(0);
    expect(boxOf(s0, 'A2:+:4,4', 'num')).toBe(1);
    expect(seenSet(s0).has('A2:+:4,4')).toBe(true);
  });

  it('a miss resets the box of its own set: S3/S2/S1 the tray box, S0 the number box', () => {
    const base = [at('a', 1, 1, 'first'), at('b', 2, 0, 'first'), at('c', 3, 0, 'first')];
    const trayMiss = replay([...base, at('d', 4, 3, 'fixed')]);
    expect(boxOf(trayMiss, 'A2:+:4,4', 'tray')).toBe(0);
    expect(boxOf(trayMiss, 'A2:+:4,4', 'num')).toBe(2);
    const numMiss = replay([...base, at('d', 4, 0, 'assisted')]);
    expect(boxOf(numMiss, 'A2:+:4,4', 'tray')).toBe(1);
    expect(boxOf(numMiss, 'A2:+:4,4', 'num')).toBe(0);
    expect(boxMap(numMiss, 'tray').get('A2:+:4,4')).toBe(1);
    expect(boxMap(numMiss, 'num').get('A2:+:4,4')).toBe(0);
  });
});

/** A random but plausible event log; timestamps may repeat so the id tie-break is exercised. */
function randomLog(rng: Rng, n: number): Evt[] {
  const facts = [...pool('A1'), ...pool('A2'), ...pool('A3')].map((p) => p.factKey);
  const skills: SkillId[] = ['A1', 'A2', 'A3'];
  const out: Evt[] = [];
  let t = 1_700_000_000_000;
  for (let i = 0; i < n; i++) {
    t += rng.int(0, 3); // repeats on purpose
    const ctx = ctxAt(t, `e${rng.int(0, 1e9).toString(36)}-${i}`, rng.chance(0.5) ? 'ipad' : 'phone');
    const svc = `s${rng.int(0, 6)}`;
    const skill = rng.pick(skills);
    const r = rng.next();
    if (r < 0.45)
      out.push(
        attemptEvent(ctx, {
          svc,
          fact: rng.pick(facts),
          skill,
          stage: rng.pick(STAGES),
          outcome: rng.pick(OUTCOMES),
          ms: rng.int(500, 20000),
        }),
      );
    else if (r < 0.75) out.push(coinEvent(ctx, { svc, n: 3 }));
    else if (r < 0.85)
      out.push(
        serviceEndEvent(ctx, {
          svc,
          skill,
          seed: 1,
          orders: 6,
          served: rng.int(0, 6),
          tip: rng.chance(0.5) ? 5 : 0,
          activeMs: 1000,
          partial: rng.chance(0.3),
        }),
      );
    else if (r < 0.88)
      out.push(skillConfigEvent(ctx, { skill, stage: rng.pick(STAGES), ops: rng.pick(['both', 'add', 'sub'] as const) }));
    else if (r < 0.91)
      out.push(equipEvent(ctx, { slot: rng.pick(['floor', 'wallpaper']), items: [rng.pick(['lamp', 'rug'])] }));
    else if (r < 0.92) out.push(coinAdjustEvent(ctx, { n: rng.int(-40, 40) }));
    else if (r < 0.94)
      // Two devices recording the same crate with different `next` (D154): the smaller wins.
      out.push(crateEvent(ctx, { n: rng.int(1, 3), next: rng.int(0, 90) }));
    else {
      const buy: BuyEvt = { id: ctx.id(), t, dev: 'd', v: 1, k: 'buy', item: rng.pick(['lamp', 'rug']), price: 20 };
      out.push(buy);
    }
  }
  return out;
}

const sorted = (es: Evt[]) => [...es].sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

describe('replay ≡ incremental applyEvent (SPEC §11.2 property test)', () => {
  it('for 300 random logs, folding applyEvent in (t, id) order equals a full replay', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = mulberry32(seed);
      const log = sorted(randomLog(rng, rng.int(0, 80)));
      let d: Derived = emptyDerived();
      for (const e of log) {
        expect(inOrder(d, e)).toBe(true);
        d = applyEvent(d, e);
      }
      expect(d).toEqual(replay(log));
    }
  });

  it('replay does not depend on the order events arrive in, and counts each id once (merge-safe)', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = mulberry32(seed * 7);
      const log = randomLog(rng, 60);
      const shuffled = rng.shuffle([...log]);
      const doubled = [...shuffled, ...rng.shuffle([...log])];
      expect(replay(shuffled)).toEqual(replay(log));
      expect(replay(doubled)).toEqual(replay(log));
    }
  });

  it('an event older than the last one is flagged as needing a full replay', () => {
    const a = coinEvent(ctxAt(10, 'b'), { svc: 's', n: 3 });
    const d = applyEvent(emptyDerived(), a);
    expect(inOrder(d, coinEvent(ctxAt(9, 'z'), { svc: 's', n: 3 }))).toBe(false);
    expect(inOrder(d, coinEvent(ctxAt(10, 'a'), { svc: 's', n: 3 }))).toBe(false);
    expect(inOrder(d, coinEvent(ctxAt(10, 'c'), { svc: 's', n: 3 }))).toBe(true);
  });

  it('survives a JSON round trip (the `state` cache)', () => {
    const d = replay(randomLog(mulberry32(5), 50));
    expect(JSON.parse(JSON.stringify(d))).toEqual(d);
  });
});

describe('coins (SPEC §11.2, D31, D39)', () => {
  const end = (id: string, t: number, tip: number, partial: boolean) =>
    serviceEndEvent(ctxAt(t, id), { svc: 's1', skill: 'A1', seed: 1, orders: 6, served: 6, tip, activeMs: 1, partial });

  it('a 6-order service pays 23: six coin events plus the tip', () => {
    const log: Evt[] = Array.from({ length: 6 }, (_, i) => coinEvent(ctxAt(i, `c${i}`), { svc: 's1', n: 3 }));
    log.push(end('e', 10, 5, false));
    expect(earned(replay(log))).toBe(23);
  });

  it('a resumed service (partial end, then a full end) keeps every coin and one tip', () => {
    const log: Evt[] = [
      coinEvent(ctxAt(1, 'c1'), { svc: 's1', n: 3 }),
      end('e1', 2, 0, true),
      coinEvent(ctxAt(3, 'c2'), { svc: 's1', n: 3 }),
      end('e2', 4, 5, false),
      end('e3', 5, 5, false), // the same service ending twice (merge) is tipped once
    ];
    const d = replay(log);
    expect(earned(d)).toBe(11);
    expect(servicesOf(d, 'A1')).toBe(1);
  });

  it('a killed app keeps the coins already written (no serviceEnd at all)', () => {
    const d = replay([coinEvent(ctxAt(1, 'c1'), { svc: 's1', n: 3 }), coinEvent(ctxAt(2, 'c2'), { svc: 's1', n: 3 })]);
    expect(balance(d)).toBe(6);
  });

  it('the same item bought twice is charged once; balance never goes below 0', () => {
    const buy = (id: string, item: string, price: number): BuyEvt => ({ id, t: 1, dev: 'd', v: 1, k: 'buy', item, price });
    const d = replay([coinEvent(ctxAt(0, 'c'), { svc: 's', n: 30 }), buy('b1', 'lamp', 20), buy('b2', 'lamp', 20)]);
    expect(balance(d)).toBe(10);
    expect(balance(replay([buy('b1', 'lamp', 20)]))).toBe(0);
  });
});

describe('playtest coin setting (D179)', () => {
  const buy = (id: string, t: number, item: string, price: number): BuyEvt => ({ id, t, dev: 'd', v: 1, k: 'buy', item, price });

  it('coinAdjustTo sets the jar exactly, up or down, and leaves earned alone', () => {
    let log: Evt[] = [coinEvent(ctxAt(1, 'c1'), { svc: 's', n: 30 }), buy('b1', 2, 'lamp', 20)];
    for (const [i, target] of [500, 0, 7, 7, 1000].entries()) {
      const n = coinAdjustTo(replay(log), target);
      log = [...log, coinAdjustEvent(ctxAt(10 + i, `a${i}`), { n })];
      expect(balance(replay(log))).toBe(target);
    }
    expect(earned(replay(log))).toBe(30);
    expect(coinAdjustTo(replay(log), 1000)).toBe(0);
  });

  it('a jar in the red after a merge is set exactly too, and play adds on top', () => {
    const log: Evt[] = [buy('b1', 1, 'lamp', 20), buy('b2', 2, 'rug', 20)];
    const n = coinAdjustTo(replay(log), 50);
    const after = [...log, coinAdjustEvent(ctxAt(3, 'a'), { n }), coinEvent(ctxAt(4, 'c'), { svc: 's', n: 3 })];
    expect(balance(replay(after))).toBe(53);
  });
});

describe('skillConfig (SPEC §11.2): latest t wins per skill', () => {
  it('the later event wins whatever order they arrive in', () => {
    const early = skillConfigEvent(ctxAt(1, 'z'), { skill: 'A2', stage: 1, ops: 'add' });
    const late = skillConfigEvent(ctxAt(2, 'a'), { skill: 'A2', stage: 0, ops: 'sub' });
    const other = skillConfigEvent(ctxAt(3, 'b'), { skill: 'A1', stage: 2, ops: 'both' });
    expect(replay([late, early, other]).config).toEqual({
      A2: { stage: 0, ops: 'sub' },
      A1: { stage: 2, ops: 'both' },
    });
  });
});

describe('stats for the progress list', () => {
  it('counts attempts, first tries and assisted per skill and per fact', () => {
    const a = (id: string, t: number, outcome: Outcome) =>
      attemptEvent(ctxAt(t, id), { svc: 's', fact: 'A1:+:2,3', skill: 'A1', stage: 1, outcome, ms: 1 });
    const d = replay([a('1', 1, 'first'), a('2', 2, 'first'), a('3', 3, 'assisted'), a('4', 4, 'first')]);
    expect(d.skills.A1).toEqual({ problems: 4, first: 3, assisted: 1 });
    expect(d.facts['A1:+:2,3']).toEqual({ tray: 1, num: 0, seen: 4, first: 3 });
  });
});
