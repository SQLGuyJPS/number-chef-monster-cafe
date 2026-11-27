import { describe, expect, it } from 'vitest';
import type { Evt } from '../../src/engine/events';
import { playTime } from '../../src/engine/playTime';
import type { SkillId, Stage } from '../../src/engine/types';

const MIN = 60_000;
let n = 0;
const base = (t: number) => ({ id: `e${n++}`, t, dev: 'd', v: 1 });

/** A service of `orders` orders, each `secs` long, starting at `from`; the first is the warm-up. */
function service(
  from: number,
  o: {
    svc: string;
    skill?: SkillId;
    stage?: Stage;
    orders?: number;
    secs?: number;
    partial?: boolean;
    served?: number;
  },
): Evt[] {
  const { svc, skill = 'A1', stage = 1, orders = 6, secs = 10, partial = false } = o;
  const served = o.served ?? orders;
  const out: Evt[] = [];
  let t = from;
  for (let i = 0; i < served; i++) {
    t += secs * 1000;
    out.push({ ...base(t), k: 'coin', svc, n: 3 });
    if (i > 0)
      out.push({
        ...base(t),
        k: 'attempt',
        svc,
        fact: `f${i}`,
        skill,
        stage,
        outcome: 'first',
        ms: secs * 1000,
      });
  }
  t += 5000;
  out.push({
    ...base(t),
    k: 'serviceEnd',
    svc,
    skill,
    seed: 1,
    orders,
    served,
    tip: partial ? 0 : 5,
    activeMs: t - from,
    partial,
  });
  return out;
}

describe('play time from the log (D189)', () => {
  it('times orders by dish and support level, leaving out the untimed warm-up', () => {
    const r = playTime([
      ...service(0, { svc: 'a', skill: 'A1', stage: 1, secs: 10 }),
      ...service(5 * MIN, { svc: 'b', skill: 'A2', stage: 3, secs: 20 }),
    ]);
    expect(r.orders.map((o) => [o.skill, o.stage, o.seconds.n, o.seconds.median])).toEqual([
      ['A1', 1, 5, 10],
      ['A2', 3, 5, 20],
    ]);
    expect(r.services.map((s) => [s.skill, s.stage, s.minutes.median])).toEqual([
      ['A1', 1, 65 / 60],
      ['A2', 3, 125 / 60],
    ]);
  });

  it('scales services to six orders and skips closed-early ones', () => {
    const r = playTime([
      ...service(0, { svc: 'a', orders: 4, secs: 30 }),
      ...service(10 * MIN, { svc: 'b', orders: 6, served: 2, partial: true }),
    ]);
    expect(r.services).toHaveLength(1);
    expect(r.services[0]!.minutesPer6.median).toBeCloseTo((125 / 60) * 1.5);
    expect(r.totals.services).toBe(1);
  });

  it('groups sittings by gap and counts coins with one tip per service', () => {
    const r = playTime([
      ...service(0, { svc: 'a' }),
      ...service(2 * MIN, { svc: 'b' }),
      {
        ...base(2 * MIN + 65_000),
        k: 'serviceEnd',
        svc: 'b',
        skill: 'A1',
        seed: 1,
        orders: 6,
        served: 6,
        tip: 5,
        activeMs: 65_000,
        partial: false,
      },
      ...service(60 * MIN, { svc: 'c' }),
    ]);
    expect(r.sittings.map((s) => [s.services, s.monsters, s.coins])).toEqual([
      [2, 12, 46],
      [1, 6, 23],
    ]);
    expect(r.sittings[0]!.minutes).toBeCloseTo(2 + 65 / 60);
    expect(r.totals.coins).toBe(69);
  });

  it('splits the gaps between services into plain ones and shop visits', () => {
    const r = playTime([
      ...service(0, { svc: 'a' }),
      ...service(1.5 * MIN, { svc: 'b' }),
      { ...base(3 * MIN), k: 'buy', item: 'x', price: 20 },
      ...service(5 * MIN, { svc: 'c' }),
    ]);
    expect(r.between.plain?.n).toBe(1);
    expect(r.between.withShop?.n).toBe(1);
    expect(r.suggest.betweenServicesMinutes).toBe(0.4);
  });

  it('ignores parent-only events and needs two weeks for a weekly figure', () => {
    const r = playTime([
      { ...base(-30 * MIN), k: 'skillConfig', skill: 'A1', stage: 1, ops: 'both' },
      ...service(0, { svc: 'a' }),
    ]);
    expect(r.sittings).toHaveLength(1);
    expect(r.sittings[0]!.start).toBe(0);
    expect(r.totals.minutesPerWeek).toBeNull();
  });
});
