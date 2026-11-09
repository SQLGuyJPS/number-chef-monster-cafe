import { describe, expect, it } from 'vitest';
import { MAX_NEW_FACTS } from '../../src/engine/config';
import { isAddition, pool } from '../../src/engine/generators';
import { REGULARS } from '../../src/engine/monsters';
import { mulberry32 } from '../../src/engine/rng';
import {
  addShareOf,
  buildService,
  knownPreset,
  moreSupport,
  withRequeue,
  withWarmUp,
  type PlannedOrder,
  type ServiceInput,
} from '../../src/engine/session';
import type { Ops, SkillId } from '../../src/engine/types';

function input(
  skill: SkillId,
  ops: Ops,
  seed: number,
  extra: Partial<ServiceInput> = {},
): ServiceInput {
  const boxes = knownPreset(skill);
  return {
    seed,
    skill,
    ops,
    stage: 3,
    orders: 6,
    boxes,
    seen: new Set(boxes.keys()),
    monsters: REGULARS,
    ...extra,
  };
}

const CASES: [SkillId, Ops][] = [
  ['A1', 'both'],
  ['A1', 'add'],
  ['A1', 'sub'],
  ['A2', 'both'],
  ['A2', 'add'],
  ['A2', 'sub'],
  ['A3', 'both'],
  ['A3', 'add'],
  ['A3', 'sub'],
];

describe('session builder (SPEC §4.1)', () => {
  it('same seed and state → same service', () => {
    expect(buildService(input('A2', 'both', 42))).toEqual(buildService(input('A2', 'both', 42)));
    expect(buildService(input('A2', 'both', 42))).not.toEqual(
      buildService(input('A2', 'both', 43)),
    );
  });

  it.each(CASES)('%s/%s, 500 seeds: rules of steps 2, 4, 5, 6 and 9', (skill, ops) => {
    const share = addShareOf(skill);
    for (let seed = 0; seed < 500; seed++) {
      const inp = input(skill, ops, seed);
      const { orders, newFacts } = buildService(inp);
      expect(orders).toHaveLength(6);
      expect(newFacts.length).toBeLessThanOrEqual(MAX_NEW_FACTS);
      const keys = orders.map((o) => o.problem.factKey);
      // At most 3 new facts; everything else already seen.
      const unseen = new Set(keys.filter((k) => !inp.seen.has(k)));
      expect(unseen.size).toBeLessThanOrEqual(MAX_NEW_FACTS);
      for (const k of unseen) expect(newFacts).toContain(k);
      const distinct =
        new Set(
          [...inp.seen].filter((k) =>
            pool(skill).some(
              (p) => p.factKey === k && (ops === 'both' || isAddition(p) === (ops === 'add')),
            ),
          ),
        ).size + newFacts.length;
      const window = Math.min(4, distinct - 1);
      orders.forEach((o, i) => {
        if (ops !== 'both') expect(isAddition(o.problem)).toBe(ops === 'add');
        if (i === 0) return;
        const prev = orders[i - 1]!;
        expect(o.food).not.toBe(prev.food);
        expect(o.monster).not.toBe(prev.monster);
        expect(keys.slice(Math.max(0, i - window), i)).not.toContain(o.problem.factKey);
        expect(o.problem.factKey).not.toBe(prev.problem.factKey);
      });
      if (ops === 'both') {
        const adds = orders.filter((o) => isAddition(o.problem)).length;
        expect(Math.abs(adds - share * 6)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('new facts come in difficulty order within each operation, alternating add and sub', () => {
    for (const skill of ['A2', 'A3'] as const) {
      const items = pool(skill);
      const facts = new Map(items.map((p) => [p.factKey, p.difficulty]));
      const add = new Map(items.map((p) => [p.factKey, isAddition(p)]));
      for (let seed = 0; seed < 50; seed++) {
        const inp = input(skill, 'both', seed);
        const { newFacts } = buildService(inp);
        for (const op of [true, false]) {
          const d = newFacts.filter((k) => add.get(k) === op).map((k) => facts.get(k)!);
          expect(d).toEqual([...d].sort((a, b) => a - b));
          const unseen = [...facts]
            .filter(([k]) => !inp.seen.has(k) && add.get(k) === op)
            .map(([, v]) => v);
          if (d.length) expect(d[0]).toBe(Math.min(...unseen));
        }
        // A3 starts with nothing seen, so both operations get new facts. (A2's preset is all
        // addition, so its balance reserve makes the first new facts all subtraction, D97.)
        if (skill === 'A3') expect(new Set(newFacts.map((k) => add.get(k))).size).toBe(2);
      }
    }
  });

  it('favourite food about 70 % of the time', () => {
    let fav = 0;
    let n = 0;
    for (let seed = 0; seed < 400; seed++) {
      for (const o of buildService(input('A2', 'both', seed)).orders) {
        n++;
        if (REGULARS.find((m) => m.id === o.monster)!.favorites.includes(o.food)) fav++;
      }
    }
    expect(fav / n).toBeGreaterThan(0.6);
    expect(fav / n).toBeLessThan(0.8);
  });

  it('box weights: low boxes come up more often than high ones', () => {
    const keys = [
      ...new Set(
        pool('A2')
          .filter((p) => p.form === 'add')
          .map((p) => p.factKey),
      ),
    ];
    const boxes = new Map(keys.map((k, i) => [k, i % 2 === 0 ? 0 : 4]));
    const count = [0, 0];
    for (let seed = 0; seed < 300; seed++) {
      const { orders } = buildService(input('A2', 'add', seed, { boxes, seen: new Set(keys) }));
      for (const o of orders) count[boxes.get(o.problem.factKey) === 0 ? 0 : 1]!++;
    }
    expect(count[0]!).toBeGreaterThan(count[1]! * 3);
  });

  it('first A1 subtraction-only service: few facts, repeats allowed but never adjacent (step 9)', () => {
    for (let seed = 0; seed < 200; seed++) {
      const { orders, newFacts } = buildService(input('A1', 'sub', seed));
      expect(newFacts).toHaveLength(3);
      expect(new Set(orders.map((o) => o.problem.factKey)).size).toBeLessThanOrEqual(3);
      orders
        .slice(1)
        .forEach((o, i) => expect(o.problem.factKey).not.toBe(orders[i]!.problem.factKey));
    }
  });

  it('known preset: +1 and doubles at box 3, result forms only', () => {
    const k = knownPreset('A2');
    expect(k.get('A2:+:1,5')).toBe(3);
    expect(k.get('A2:+:4,4')).toBe(3);
    expect(k.has('A2:+:2,4')).toBe(false);
    expect([...k.keys()].every((key) => key.includes(':+:'))).toBe(true);
    expect(knownPreset('A3').size).toBe(0);
  });
});

describe('requeue (SPEC §4.1 step 7)', () => {
  const base = (seed: number): PlannedOrder[] => buildService(input('A2', 'add', seed)).orders;

  it('same monster 3–5 problems later (or appended), more support, different food, swapped operands', () => {
    let placed35 = 0;
    for (let seed = 0; seed < 300; seed++) {
      const plan = base(seed).map((o) => ({ ...o, stage: 1 as const }));
      const at = seed % 6;
      const next = withRequeue(plan, at, mulberry32(seed), REGULARS)!;
      expect(next).toHaveLength(7);
      const p = next.findIndex((o) => o.requeue);
      const src = plan[at]!;
      const rq = next[p]!;
      expect(rq.monster).toBe(src.monster);
      expect(rq.stage).toBe(2);
      expect(rq.problem.factKey).toBe(src.problem.factKey);
      expect(rq.food).not.toBe(src.food);
      const [a, b] = src.problem.operands as number[];
      if (a !== b) expect(rq.problem.operands.slice(0, 2)).toEqual([b, a]);
      const gap = p - at;
      // 3–5 later where that fits; otherwise at the end, or the latest spot keeping an order between (D97).
      if (gap >= 3 && gap <= 5) placed35++;
      else if (at < plan.length - 1) expect(gap).toBeGreaterThanOrEqual(2);
      // Never adjacent to its fact or its monster, when another order exists in between.
      if (at < plan.length - 1) {
        for (const n of [next[p - 1], next[p + 1]]) {
          if (!n) continue;
          expect(n.problem.factKey).not.toBe(rq.problem.factKey);
        }
      }
      if (next[p + 1]) expect(next[p + 1]!.food).not.toBe(rq.food);
      expect(next[p - 1]!.food).not.toBe(rq.food);
    }
    // Orders at index 0–2 always have a 3–5 slot inside a 6-order plan; most of them fit.
    expect(placed35).toBeGreaterThan(100);
  });

  it('at most two requeues per service', () => {
    let plan = base(1);
    plan = withRequeue(plan, 0, mulberry32(1), REGULARS)!;
    plan = withRequeue(plan, 1, mulberry32(2), REGULARS)!;
    expect(withRequeue(plan, 2, mulberry32(3), REGULARS)).toBeNull();
  });

  it('support steps S0 → S1 → S2 → S3, S3 stays', () => {
    expect([0, 1, 2, 3].map((s) => moreSupport(s as 0 | 1 | 2 | 3))).toEqual([1, 2, 3, 3]);
  });
});

describe('warm-up order (SPEC §5.4, D26)', () => {
  it('prepends 2 + 1 cookies at S3 with a different monster; no cookies twice in a row', () => {
    for (let seed = 0; seed < 200; seed++) {
      const plan = buildService(input('A2', 'both', seed)).orders;
      const next = withWarmUp(plan, REGULARS);
      expect(next).toHaveLength(plan.length + 1);
      const w = next[0]!;
      expect(w).toMatchObject({ food: 'cookie', stage: 3, warmUp: true });
      expect(w.problem.display.join('')).toBe('2+1=?');
      expect(w.monster).not.toBe(next[1]!.monster);
      expect(next[1]!.food).not.toBe('cookie');
      expect(next[1]!.food).not.toBe(next[2]!.food);
      expect(next.slice(1).map((o) => o.problem)).toEqual(plan.map((o) => o.problem));
    }
  });
});
