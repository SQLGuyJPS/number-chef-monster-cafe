// Persisted event shapes (SPEC §11.2). `attempt` and `coin` are FROZEN in M1 (D36): M3a only writes
// them. Changing a field here needs a schema migration (CLAUDE.md). The shape test in
// tests/unit/events.test.ts pins the exact keys.
import type { Outcome } from './attempt';
import type { SkillId, Stage } from './types';

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
