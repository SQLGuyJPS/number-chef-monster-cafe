// Session builder (SPEC §4.1). Pure and deterministic: same seed and same starting state (boxes,
// seen set, settings) → same service. Requeues are inserted during the service (step 7).
import {
  A1_ADD_SHARE,
  BOX_WEIGHTS,
  FAVORITE_FOOD_SHARE,
  MAX_NEW_FACTS,
  MAX_REQUEUES,
  REPEAT_WINDOW,
} from './config';
import { FOOD_IDS, type FoodId } from './foods';
import { filterOps, isAddition, pool } from './generators';
import type { MonsterRef } from './monsters';
import { mulberry32, type Rng } from './rng';
import type { Ops, Problem, SkillId, Stage } from './types';

export interface PlannedOrder {
  problem: Problem;
  food: FoodId;
  stage: Stage;
  monster: string;
  /** A requeued fact: the same monster coming back (step 7). */
  requeue?: boolean;
}

/** One order of a service (the UI's name for a planned order). */
export type Order = PlannedOrder;

export interface ServiceInput {
  seed: number;
  skill: SkillId;
  ops: Ops;
  stage: Stage;
  orders: number;
  /** Box per canonical factKey (SPEC §4.2); facts missing here start at box 0. */
  boxes: ReadonlyMap<string, number>;
  /** Facts already attempted or in the `known` preset; everything else is new (D29). */
  seen: ReadonlySet<string>;
  monsters: readonly MonsterRef[];
}

export interface ServicePlan {
  orders: PlannedOrder[];
  /** The facts this service introduces (≤ 3, difficulty order). */
  newFacts: string[];
}

interface Fact {
  key: string;
  add: boolean;
  difficulty: number;
  shapes: Problem[];
}

function factsOf(skill: SkillId, ops: Ops): Fact[] {
  const byKey = new Map<string, Fact>();
  for (const p of filterOps(pool(skill), ops)) {
    const f = byKey.get(p.factKey);
    if (f) {
      f.shapes.push(p);
      f.difficulty = Math.min(f.difficulty, p.difficulty);
    } else
      byKey.set(p.factKey, {
        key: p.factKey,
        add: isAddition(p),
        difficulty: p.difficulty,
        shapes: [p],
      });
  }
  return [...byKey.values()];
}

/** A1 aims at ~55 % addition; every other skill at its pool's canonical add share (D43). */
export function addShareOf(skill: SkillId): number {
  if (skill === 'A1') return A1_ADD_SHARE;
  const facts = factsOf(skill, 'both');
  return facts.filter((f) => f.add).length / facts.length;
}

function weightedPick<T>(rng: Rng, items: readonly T[], weight: (t: T) => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = rng.next() * total;
  for (const t of items) {
    r -= weight(t);
    if (r < 0) return t;
  }
  return items[items.length - 1]!;
}

/** Step 6: the monster's favourite 70 % of the time; never the same food twice in a row. */
function foodFor(rng: Rng, m: MonsterRef, avoid: readonly (FoodId | undefined)[]): FoodId {
  const favs = m.favorites.filter((f) => !avoid.includes(f));
  if (favs.length > 0 && rng.chance(FAVORITE_FOOD_SHARE)) return rng.pick(favs);
  return rng.pick(FOOD_IDS.filter((f) => !avoid.includes(f)));
}

export function buildService(input: ServiceInput): ServicePlan {
  const rng = mulberry32(input.seed);
  const facts = factsOf(input.skill, input.ops);

  // Step 4: new facts in difficulty order, ties broken by the seeded rng, at most 3.
  const ordered = rng
    .shuffle(facts.filter((f) => !input.seen.has(f.key)))
    .sort((x, y) => x.difficulty - y.difficulty);
  // Step 5 balance: target add count ±1. When `ops` is both, enough new facts of the operation the
  // seen set lacks are reserved first so the balance stays reachable (the child knows only
  // addition at first, so subtraction would otherwise be squeezed out; D97).
  const target = addShareOf(input.skill) * input.orders;
  const lo = Math.max(0, Math.ceil(target - 1));
  const hi = Math.min(input.orders, Math.floor(target + 1));
  const fresh: Fact[] = [];
  if (input.ops === 'both') {
    const seenOf = (add: boolean) =>
      facts.filter((f) => f.add === add && input.seen.has(f.key)).length;
    for (const [add, need] of [
      [true, lo],
      [false, input.orders - hi],
    ] as const) {
      const short = Math.min(MAX_NEW_FACTS - fresh.length, Math.max(0, need - seenOf(add)));
      fresh.push(...ordered.filter((f) => f.add === add).slice(0, short));
    }
  }
  for (const f of ordered) if (fresh.length < MAX_NEW_FACTS && !fresh.includes(f)) fresh.push(f);
  fresh.sort((x, y) => x.difficulty - y.difficulty);
  const newKeys = new Set(fresh.map((f) => f.key));
  const available = facts.filter((f) => input.seen.has(f.key) || newKeys.has(f.key));
  // Step 9 (pool-size guard): with no seen facts at all, fall back to the whole filtered pool.
  const usable = available.length > 0 ? available : facts;
  const weight = (f: Fact): number =>
    newKeys.has(f.key)
      ? BOX_WEIGHTS[0]!
      : (BOX_WEIGHTS[input.boxes.get(f.key) ?? 0] ?? BOX_WEIGHTS[0]!);

  // Step 5: window shrinks to (distinct − 1) when fewer than 5 facts are available.
  const window = Math.max(0, Math.min(REPEAT_WINDOW, usable.length - 1));
  // Step 5: add/sub stays within ±1 of the target when both operations are in play.
  const mixed = usable.some((f) => f.add) && usable.some((f) => !f.add);
  const orders: PlannedOrder[] = [];
  let adds = 0;
  for (let i = 0; i < input.orders; i++) {
    const recent = new Set(
      orders.slice(i - window < 0 ? 0 : i - window).map((o) => o.problem.factKey),
    );
    let pickFrom = usable.filter((f) => !recent.has(f.key));
    if (pickFrom.length === 0)
      pickFrom = usable.filter((f) => f.key !== orders.at(-1)?.problem.factKey);
    if (pickFrom.length === 0) pickFrom = usable;
    if (mixed) {
      const left = input.orders - i - 1;
      const ok = (add: boolean) => {
        const a = adds + (add ? 1 : 0);
        return a <= hi && a + left >= lo;
      };
      const balanced = pickFrom.filter((f) => ok(f.add));
      if (balanced.length > 0) pickFrom = balanced;
    }
    const fact = weightedPick(rng, pickFrom, weight);
    if (fact.add) adds++;
    const prev = orders.at(-1);
    const others = input.monsters.filter((m) => m.id !== prev?.monster);
    const monster = rng.pick(others.length > 0 ? others : input.monsters);
    orders.push({
      problem: rng.pick(fact.shapes),
      food: foodFor(rng, monster, [prev?.food]),
      stage: input.stage,
      monster: monster.id,
    });
  }
  return { orders, newFacts: fresh.map((f) => f.key) };
}

/** One step more support (step 7): S0 → S1 → S2 → S3; S3 stays. */
export const moreSupport = (s: Stage): Stage => (s === 3 ? 3 : ((s + 1) as Stage));

/** The commuted presentation where one exists (step 7: swapped operand order). */
function swapped(p: Problem): Problem {
  if (p.form !== 'add' && p.form !== 'missingAddend') return p;
  const other = pool(p.skill).find(
    (q) => q.factKey === p.factKey && q.form === p.form && q.display.join() !== p.display.join(),
  );
  return other ?? p;
}

/**
 * Step 7: the order at `at` ended `assisted`; returns the plan with the same monster coming back
 * 3–5 problems later (or appended), or `null` when the service already has its 2 requeues.
 */
export function withRequeue(
  plan: readonly PlannedOrder[],
  at: number,
  rng: Rng,
  monsters: readonly MonsterRef[],
): PlannedOrder[] | null {
  if (plan.filter((o) => o.requeue).length >= MAX_REQUEUES) return null;
  const src = plan[at];
  if (!src) return null;
  const monster = monsters.find((m) => m.id === src.monster) ?? {
    id: src.monster,
    favorites: ['cookie', 'cake'] as const,
  };
  const clash = (o: PlannedOrder | undefined, monsterToo: boolean) =>
    !!o && (o.problem.factKey === src.problem.factKey || (monsterToo && o.monster === src.monster));
  const fitsWith =
    (monsterToo: boolean) =>
    (p: number): boolean =>
      p > at && p <= plan.length && !clash(plan[p - 1], monsterToo) && !clash(plan[p], monsterToo);
  // Inserted before index p, so the requeue is p − at problems after the original. If no 3–5 spot
  // fits, it is appended; if the end would sit next to its own fact or monster, the latest spot
  // keeping an order in between is used. Its own fact next to it is worse than its monster twice
  // in a row, so that rule gives way last (D97).
  const pick = (fits: (p: number) => boolean): number | undefined => {
    const near = rng
      .shuffle([3, 4, 5])
      .map((k) => at + k)
      .find(fits);
    const late = Array.from({ length: plan.length - at - 1 }, (_, i) => plan.length - i).find(
      (q) => q >= at + 2 && fits(q),
    );
    return near ?? late;
  };
  const p = pick(fitsWith(true)) ?? pick(fitsWith(false)) ?? plan.length;
  const before = plan[p - 1];
  const after = plan[p];
  const order: PlannedOrder = {
    problem: swapped(src.problem),
    food: foodFor(rng, monster, [src.food, before?.food, after?.food]),
    stage: moreSupport(src.stage),
    monster: src.monster,
    requeue: true,
  };
  return [...plan.slice(0, p), order, ...plan.slice(p)];
}

/**
 * Default `known` preset (SPEC §4.2, D16): +1 in both orders and doubles, result forms only, in
 * A1, A2 and A7, at box 3.
 */
export const KNOWN_BOX = 3;
export function knownPreset(skill: SkillId): Map<string, number> {
  const out = new Map<string, number>();
  // A7 is not built yet (M5); its preset arrives with its pool.
  if (skill !== 'A1' && skill !== 'A2') return out;
  for (const p of pool(skill)) {
    if (p.form !== 'add') continue;
    const [a, b] = p.operands as [number, number];
    if (a === 1 || b === 1 || a === b) out.set(p.factKey, KNOWN_BOX);
  }
  return out;
}
