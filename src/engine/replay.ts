// Derived state from the event log (SPEC §11.1, §11.2). `replay` is the definition; `applyEvent`
// is its incremental form and must give the same result when events arrive in (t, id) order
// (property test in tests/unit/replay.test.ts). Pure: no clock, no storage.
import type { Outcome } from './attempt';
import { MAX_BOX } from './config';
import type { Evt } from './events';
import type { Ops, SkillId, Stage } from './types';

/**
 * Two box sets per fact (D127): the tray set for S3–S1, where the child builds the answer and
 * can count it out, and the number set for S0, closer to recall. Success at one says little
 * about the other, so they never mix.
 */
export type BoxSet = 'tray' | 'num';
export const boxSetOf = (stage: Stage): BoxSet => (stage === 0 ? 'num' : 'tray');

/**
 * Fact box rules (SPEC §4.2, D29, D127), applied to the attempt's own box set: `first` at S1 or S0
 * moves a fact up one box (max 4); `first` at S3/S2 and `afterHint` leave it; `fixed` and
 * `assisted` reset it to 0 at every stage.
 */
export function nextBox(box: number, outcome: Outcome, stage: Stage): number {
  switch (outcome) {
    case 'first':
      return stage <= 1 ? Math.min(MAX_BOX, box + 1) : box;
    case 'afterHint':
      return box;
    case 'fixed':
    case 'assisted':
      return 0;
  }
}

/**
 * Bumped when the shape of `Derived` changes, so an older `state` cache is rebuilt from the log
 * (the events themselves do not change, so no migration, SPEC §11.3).
 */
export const DERIVED_SHAPE = 3;

export interface FactStat {
  /** Box in the tray set (S3–S1) and in the number set (S0), D127. */
  tray: number;
  num: number;
  /** `attempt` events for this fact. */
  seen: number;
  /** Of those, first-try correct (no Help, no miss). */
  first: number;
}

export interface SkillStat {
  /** Attempts (problems with an `attempt` event; the warm-up writes none). */
  problems: number;
  first: number;
  assisted: number;
}

export interface SkillConfigState {
  stage: Stage;
  ops: Ops;
}

/** Plain data only (records and arrays), so it serializes to the `state` cache as is. */
export interface Derived {
  /** `DERIVED_SHAPE` when written. */
  shape: number;
  /** Events folded in. */
  count: number;
  /** The greatest (t, id) folded in; an event that sorts before it needs a full replay. */
  last: { t: number; id: string } | null;
  /** Facts with at least one `attempt`; every other fact is new, in box 0 of both sets. */
  facts: Record<string, FactStat>;
  skills: Partial<Record<SkillId, SkillStat>>;
  /** Σ coin.n (SPEC §11.2). */
  coinSum: number;
  /**
   * One row per ended service: its skill, the largest tip and the most monsters served seen for it
   * (D39; a resumed service can end twice).
   */
  ends: Record<string, { skill: SkillId; tip: number; t: number; served: number }>;
  /** Distinct purchased items and their price (the same item bought twice is charged once). */
  bought: Record<string, number>;
  /** Latest `skillConfig` per skill. */
  config: Partial<Record<SkillId, SkillConfigState>>;
  /** Latest `equip` per slot: the entry keys shown there (M4, §11.2). */
  equipped: Record<string, string[]>;
  /** Delivered crates: n → the smallest `next` recorded for it (D154). */
  crates: Record<string, number>;
}

export const emptyDerived = (): Derived => ({
  shape: DERIVED_SHAPE,
  count: 0,
  last: null,
  facts: {},
  skills: {},
  coinSum: 0,
  ends: {},
  bought: {},
  config: {},
  equipped: {},
  crates: {},
});

/** Event order for replay (SPEC §11.2): by `t`, then by `id`. */
export function compareEvt(a: { t: number; id: string }, b: { t: number; id: string }): number {
  if (a.t !== b.t) return a.t - b.t;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** True when `e` sorts after everything already folded into `d`, so `applyEvent` is exact. */
export const inOrder = (d: Derived, e: Evt): boolean => d.last === null || compareEvt(d.last, e) < 0;

/**
 * Folds one event in. Exact (≡ `replay`) when `inOrder(d, e)` holds and `e.id` is new; returns a
 * new object and never mutates `d`. Unknown kinds are counted and otherwise ignored.
 */
export function applyEvent(d: Derived, e: Evt): Derived {
  const next: Derived = {
    ...d,
    count: d.count + 1,
    last: d.last === null || compareEvt(d.last, e) < 0 ? { t: e.t, id: e.id } : d.last,
  };
  switch (e.k) {
    case 'attempt': {
      const prev = d.facts[e.fact] ?? { tray: 0, num: 0, seen: 0, first: 0 };
      const isFirst = e.outcome === 'first';
      const set = boxSetOf(e.stage);
      next.facts = {
        ...d.facts,
        [e.fact]: {
          ...prev,
          [set]: nextBox(prev[set], e.outcome, e.stage),
          seen: prev.seen + 1,
          first: prev.first + (isFirst ? 1 : 0),
        },
      };
      const sk = d.skills[e.skill] ?? { problems: 0, first: 0, assisted: 0 };
      next.skills = {
        ...d.skills,
        [e.skill]: {
          problems: sk.problems + 1,
          first: sk.first + (isFirst ? 1 : 0),
          assisted: sk.assisted + (e.outcome === 'assisted' ? 1 : 0),
        },
      };
      break;
    }
    case 'coin':
      next.coinSum = d.coinSum + e.n;
      break;
    case 'serviceEnd': {
      const prev = d.ends[e.svc];
      next.ends = {
        ...d.ends,
        [e.svc]: {
          skill: e.skill,
          tip: Math.max(prev?.tip ?? 0, e.tip),
          t: Math.max(prev?.t ?? 0, e.t),
          served: Math.max(prev?.served ?? 0, e.served),
        },
      };
      break;
    }
    case 'buy':
      if (!(e.item in d.bought)) next.bought = { ...d.bought, [e.item]: e.price };
      break;
    case 'skillConfig':
      next.config = { ...d.config, [e.skill]: { stage: e.stage, ops: e.ops } };
      break;
    case 'equip':
      next.equipped = { ...d.equipped, [e.slot]: [...e.items] };
      break;
    case 'crate': {
      const prev = d.crates[e.n];
      if (prev === undefined || e.next < prev) next.crates = { ...d.crates, [e.n]: e.next };
      break;
    }
  }
  return next;
}

/** Full replay: distinct ids, sorted by (t, id), folded from empty (SPEC §11.2). */
export function replay(events: readonly Evt[]): Derived {
  const byId = new Map<string, Evt>();
  for (const e of events) if (!byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort(compareEvt).reduce((d, e) => applyEvent(d, e), emptyDerived());
}

// ---------- reads ----------

export const boxOf = (d: Derived, fact: string, set: BoxSet): number => d.facts[fact]?.[set] ?? 0;

/** Every attempted fact's box in one set (session builder input, §4.1); others are new, box 0. */
export function boxMap(d: Derived, set: BoxSet): Map<string, number> {
  return new Map(Object.entries(d.facts).map(([k, f]) => [k, f[set]]));
}

/** Facts already seen (any `attempt`): everything else is new (D29). No preset (D127). */
export function seenSet(d: Derived): Set<string> {
  return new Set(Object.keys(d.facts));
}

/** SPEC §11.2: earned = Σ coin.n + Σ over distinct svc of the largest tip. */
export const earned = (d: Derived): number =>
  d.coinSum + Object.values(d.ends).reduce((s, x) => s + x.tip, 0);
export const spent = (d: Derived): number => Object.values(d.bought).reduce((s, p) => s + p, 0);
export const balance = (d: Derived): number => Math.max(0, earned(d) - spent(d));

/** Services played per skill (distinct `svc` with a `serviceEnd`, partial ones included). */
export function servicesOf(d: Derived, skill: SkillId): number {
  return Object.values(d.ends).filter((x) => x.skill === skill).length;
}

/** Monsters served, ever (D154): Σ over distinct svc of the largest `serviceEnd.served`. */
export const servedMonsters = (d: Derived): number =>
  Object.values(d.ends).reduce((s, x) => s + x.served, 0);
