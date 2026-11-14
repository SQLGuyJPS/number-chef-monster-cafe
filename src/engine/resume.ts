// Service resume (SPEC §5.8, §11.6, D43): after each completed problem the app stores where the
// service stands, so a reload or a killed app can *offer* to continue exactly the planned orders.
// Pure: the caller supplies the clock. Per device only; never exported.
import { z } from 'zod';
import { RESUME_MAX_AGE_MS } from './config';
import { FOOD_IDS } from './foods';
import { isBuilt, pool } from './generators';
import type { Order } from './session';
import type { Ops, SkillId, Stage } from './types';

// The CSP has no 'unsafe-eval' (SPEC §2): zod's JIT probes `new Function`, which the browser
// reports as a violation even though zod catches it. Plain parsing is fast enough for one row.
z.config({ jitless: true });

const stage = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
const outcome = z.enum(['first', 'afterHint', 'fixed', 'assisted']);

/**
 * A planned order by reference: the problem is looked up again in its skill's pool by what the
 * ticket shows, so a stored plan never carries stale generator fields and a plan that no longer
 * matches the pool is dropped instead of played.
 */
const orderRef = z.object({
  skill: z.string(),
  display: z.string(),
  food: z.enum(FOOD_IDS),
  stage,
  monster: z.string(),
  requeue: z.boolean().optional(),
  warmUp: z.boolean().optional(),
});

export const resumeSchema = z.object({
  svc: z.string(),
  seed: z.number(),
  config: z.object({
    skill: z.string(),
    stage,
    ops: z.enum(['both', 'add', 'sub']),
    orders: z.number().int().positive(),
  }),
  plan: z.array(orderRef).min(1),
  /** The next order to play (orders before it are done). */
  index: z.number().int().nonnegative(),
  requeues: z.number().int().nonnegative(),
  /** Outcome of each completed order; `null` for the warm-up order, which writes no `attempt`. */
  results: z.array(outcome.nullable()),
  /** Coins this service has paid so far (its `coin` events), for the Results tally. */
  coins: z.number().int().nonnegative(),
  activeMs: z.number().nonnegative(),
  /** Epoch ms of the write. */
  savedAt: z.number(),
});
export type ResumeSnapshot = z.infer<typeof resumeSchema>;
export type OrderRef = z.infer<typeof orderRef>;

export const toOrderRef = (o: Order): OrderRef => ({
  skill: o.problem.skill,
  display: o.problem.display.join(' '),
  food: o.food,
  stage: o.stage,
  monster: o.monster,
  ...(o.requeue ? { requeue: true } : {}),
  ...(o.warmUp ? { warmUp: true } : {}),
});

export interface ResumeInput {
  svc: string;
  seed: number;
  skill: SkillId;
  stage: Stage;
  ops: Ops;
  /** Orders the parent asked for (requeues come on top). */
  orders: number;
  plan: readonly Order[];
  index: number;
  results: readonly (ResumeSnapshot['results'][number])[];
  coins: number;
  activeMs: number;
  savedAt: number;
}

export function makeResume(i: ResumeInput): ResumeSnapshot {
  return {
    svc: i.svc,
    seed: i.seed,
    config: { skill: i.skill, stage: i.stage, ops: i.ops, orders: i.orders },
    plan: i.plan.map(toOrderRef),
    index: i.index,
    requeues: i.plan.filter((o) => o.requeue).length,
    results: [...i.results],
    coins: i.coins,
    activeMs: i.activeMs,
    savedAt: i.savedAt,
  };
}

/** The stored plan as playable orders, or null if any order no longer matches its pool. */
export function restorePlan(s: ResumeSnapshot): Order[] | null {
  const out: Order[] = [];
  for (const r of s.plan) {
    if (!isBuilt(r.skill)) return null;
    const problem = pool(r.skill).find((p) => p.display.join(' ') === r.display);
    if (!problem) return null;
    out.push({
      problem,
      food: r.food,
      stage: r.stage,
      monster: r.monster,
      ...(r.requeue ? { requeue: true } : {}),
      ...(r.warmUp ? { warmUp: true } : {}),
    });
  }
  return out;
}

/** Validates a stored row; anything damaged or from an older shape is simply not offered. */
export function parseResume(raw: unknown): ResumeSnapshot | null {
  const r = resumeSchema.safeParse(raw);
  return r.success ? r.data : null;
}

/**
 * Offer "Continue dinner service?" only for a snapshot younger than 2 h with orders left (SPEC
 * §5.8). A clock set backwards gives a negative age; that still counts as recent.
 */
export function isOfferable(s: ResumeSnapshot, now: number): boolean {
  if (s.index >= s.plan.length) return false;
  if (!isBuilt(s.config.skill)) return false;
  return now - s.savedAt < RESUME_MAX_AGE_MS && restorePlan(s) !== null;
}
