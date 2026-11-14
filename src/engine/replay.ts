// Derived state from the event log (SPEC §11.1, §11.2). `replay` is the definition; `applyEvent`
// is its incremental form and must give the same result when events arrive in (t, id) order
// (property test in tests/unit/replay.test.ts). Pure: no clock, no storage.
import type { Outcome } from './attempt';
import { MAX_BOX } from './config';
import type { Evt } from './events';
import { BUILT_SKILLS } from './generators';
import { knownPreset } from './session';
import type { Ops, SkillId, Stage } from './types';

/**
 * Fact box rules (SPEC §4.2, D29): `first` at S1 or S0 moves a fact up one box (max 4); `first` at
 * S3/S2 and `afterHint` leave it; `fixed` and `assisted` reset it to 0 at every stage.
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
 * The starting-state preset (SPEC §4.2, §11.2): applied implicitly, never as events, so two fresh
 * devices do not double-seed. Facts not in it start at box 0.
 */
export type Initial = Readonly<Record<string, number>>;
export function startingBoxes(skills: readonly SkillId[] = BUILT_SKILLS): Initial {
  const out: Record<string, number> = {};
  for (const s of skills) for (const [k, b] of knownPreset(s)) out[k] = b;
  return out;
}

export interface FactStat {
  box: number;
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
  /** Events folded in. */
  count: number;
  /** The greatest (t, id) folded in; an event that sorts before it needs a full replay. */
  last: { t: number; id: string } | null;
  /** Facts with at least one `attempt`; the preset is read through `boxOf`. */
  facts: Record<string, FactStat>;
  skills: Partial<Record<SkillId, SkillStat>>;
  /** Σ coin.n (SPEC §11.2). */
  coinSum: number;
  /** One row per ended service: its skill and the largest tip seen for it (D39). */
  ends: Record<string, { skill: SkillId; tip: number; t: number }>;
  /** Distinct purchased items and their price (the same item bought twice is charged once). */
  bought: Record<string, number>;
  /** Latest `skillConfig` per skill. */
  config: Partial<Record<SkillId, SkillConfigState>>;
}

export const emptyDerived = (): Derived => ({
  count: 0,
  last: null,
  facts: {},
  skills: {},
  coinSum: 0,
  ends: {},
  bought: {},
  config: {},
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
export function applyEvent(d: Derived, e: Evt, initial: Initial = {}): Derived {
  const next: Derived = {
    ...d,
    count: d.count + 1,
    last: d.last === null || compareEvt(d.last, e) < 0 ? { t: e.t, id: e.id } : d.last,
  };
  switch (e.k) {
    case 'attempt': {
      const prev = d.facts[e.fact] ?? { box: initial[e.fact] ?? 0, seen: 0, first: 0 };
      const isFirst = e.outcome === 'first';
      next.facts = {
        ...d.facts,
        [e.fact]: {
          box: nextBox(prev.box, e.outcome, e.stage),
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
        [e.svc]: { skill: e.skill, tip: Math.max(prev?.tip ?? 0, e.tip), t: Math.max(prev?.t ?? 0, e.t) },
      };
      break;
    }
    case 'buy':
      if (!(e.item in d.bought)) next.bought = { ...d.bought, [e.item]: e.price };
      break;
    case 'skillConfig':
      next.config = { ...d.config, [e.skill]: { stage: e.stage, ops: e.ops } };
      break;
  }
  return next;
}

/** Full replay: distinct ids, sorted by (t, id), folded from empty (SPEC §11.2). */
export function replay(events: readonly Evt[], initial: Initial = {}): Derived {
  const byId = new Map<string, Evt>();
  for (const e of events) if (!byId.has(e.id)) byId.set(e.id, e);
  return [...byId.values()].sort(compareEvt).reduce((d, e) => applyEvent(d, e, initial), emptyDerived());
}

// ---------- reads ----------

export const boxOf = (d: Derived, fact: string, initial: Initial = {}): number =>
  d.facts[fact]?.box ?? initial[fact] ?? 0;

/** Every fact with a box: the preset plus every fact attempted (session builder input, §4.1). */
export function boxMap(d: Derived, initial: Initial = {}): Map<string, number> {
  const m = new Map(Object.entries(initial));
  for (const [k, f] of Object.entries(d.facts)) m.set(k, f.box);
  return m;
}

/** Facts already seen (any `attempt`, or in the preset): everything else is new (D29). */
export function seenSet(d: Derived, initial: Initial = {}): Set<string> {
  return new Set([...Object.keys(initial), ...Object.keys(d.facts)]);
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
