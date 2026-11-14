// Persisted event shapes (SPEC §11.2). `attempt` and `coin` are FROZEN in M1 (D36): M3a only writes
// them. Changing a field here needs a schema migration (CLAUDE.md). The shape test in
// tests/unit/events.test.ts pins the exact keys.
import type { Outcome } from './attempt';
import type { Ops, SkillId, Stage } from './types';

/** Event format version (`v`). */
export const EVENT_VERSION = 1;

export interface EvtBase {
  /** crypto.randomUUID() (fallback: 128 random bits), injected by the caller. */
  id: string;
  /** Epoch ms, injected clock. */
  t: number;
  /** deviceId from the meta store. */
  dev: string;
  v: number;
}

export const OUTCOMES: readonly Outcome[] = ['first', 'afterHint', 'fixed', 'assisted'];

export interface AttemptEvt extends EvtBase {
  k: 'attempt';
  svc: string;
  fact: string;
  skill: SkillId;
  stage: Stage;
  outcome: Outcome;
  ms: number;
}

/** One per completed problem, incl. the warm-up order and requeues (D31). */
export interface CoinEvt extends EvtBase {
  k: 'coin';
  svc: string;
  n: number;
}

export type FrozenEvt = AttemptEvt | CoinEvt;

export interface EventContext {
  id: () => string;
  now: () => number;
  dev: string;
}

export function attemptEvent(
  ctx: EventContext,
  a: { svc: string; fact: string; skill: SkillId; stage: Stage; outcome: Outcome; ms: number },
): AttemptEvt {
  return {
    id: ctx.id(),
    t: ctx.now(),
    dev: ctx.dev,
    v: EVENT_VERSION,
    k: 'attempt',
    ...a,
    ms: Math.max(0, Math.round(a.ms)),
  };
}

export function coinEvent(ctx: EventContext, a: { svc: string; n: number }): CoinEvt {
  return { id: ctx.id(), t: ctx.now(), dev: ctx.dev, v: EVENT_VERSION, k: 'coin', ...a };
}

/**
 * End of a service (SPEC §11.2, D39): `tip` is 0 or 5; `partial` = ended before all orders were
 * served (Close the café). A resumed service can end twice; coins take the largest tip per `svc`.
 */
export interface ServiceEndEvt extends EvtBase {
  k: 'serviceEnd';
  svc: string;
  skill: SkillId;
  seed: number;
  orders: number;
  served: number;
  tip: number;
  activeMs: number;
  partial: boolean;
}

/** Per-skill parent settings (D23, D24); latest `t` wins per skill. */
export interface SkillConfigEvt extends EvtBase {
  k: 'skillConfig';
  skill: SkillId;
  stage: Stage;
  ops: Ops;
}

/** Shop purchase (M4); counted here only so the balance formula is whole from the start (§11.2). */
export interface BuyEvt extends EvtBase {
  k: 'buy';
  item: string;
  price: number;
}

/** Every event M3a reads or writes. `equip`, `known` and `focus` join with M4 and M7. */
export type Evt = FrozenEvt | ServiceEndEvt | SkillConfigEvt | BuyEvt;
export type EvtKind = Evt['k'];

export function serviceEndEvent(
  ctx: EventContext,
  a: Omit<ServiceEndEvt, keyof EvtBase | 'k'>,
): ServiceEndEvt {
  return {
    id: ctx.id(),
    t: ctx.now(),
    dev: ctx.dev,
    v: EVENT_VERSION,
    k: 'serviceEnd',
    ...a,
    activeMs: Math.max(0, Math.round(a.activeMs)),
  };
}

export function skillConfigEvent(
  ctx: EventContext,
  a: { skill: SkillId; stage: Stage; ops: Ops },
): SkillConfigEvt {
  return { id: ctx.id(), t: ctx.now(), dev: ctx.dev, v: EVENT_VERSION, k: 'skillConfig', ...a };
}
