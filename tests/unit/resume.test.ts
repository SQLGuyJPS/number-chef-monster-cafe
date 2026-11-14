import { describe, expect, it } from 'vitest';
import { RESUME_MAX_AGE_MS } from '../../src/engine/config';
import { REGULARS } from '../../src/engine/monsters';
import { isOfferable, makeResume, parseResume, restorePlan } from '../../src/engine/resume';
import { buildService, withRequeue, withWarmUp } from '../../src/engine/session';
import { mulberry32 } from '../../src/engine/rng';

function snapshot(index = 2) {
  const plan = buildService({
    seed: 42,
    skill: 'A2',
    ops: 'both',
    stage: 1,
    orders: 6,
    boxes: new Map(),
    seen: new Set(),
    monsters: REGULARS,
  }).orders;
  const withBack = withRequeue(withWarmUp(plan, REGULARS), 1, mulberry32(1), REGULARS)!;
  return {
    plan: withBack,
    snap: makeResume({
      svc: 'svc-1',
      seed: 42,
      skill: 'A2',
      stage: 1,
      ops: 'both',
      orders: 6,
      plan: withBack,
      index,
      results: [null, 'assisted'],
      coins: 6,
      activeMs: 61_000,
      savedAt: 1_000_000,
    }),
  };
}

describe('resume snapshot (SPEC §11.6, D43)', () => {
  it('restores exactly the planned orders, requeue and warm-up flags included', () => {
    const { plan, snap } = snapshot();
    expect(snap.requeues).toBe(1);
    const back = restorePlan(snap)!;
    expect(back).toEqual(plan);
  });

  it('survives storage as JSON and validates', () => {
    const { snap } = snapshot();
    expect(parseResume(JSON.parse(JSON.stringify(snap)))).toEqual(snap);
  });

  it('damaged or unknown rows are not offered', () => {
    const { snap } = snapshot();
    expect(parseResume(null)).toBeNull();
    expect(parseResume({ ...snap, index: -1 })).toBeNull();
    expect(parseResume({ ...snap, plan: [] })).toBeNull();
    const badProblem = { ...snap, plan: [{ ...snap.plan[0]!, display: '99 + 99 = ?' }] };
    expect(isOfferable(badProblem, snap.savedAt)).toBe(false);
  });

  it('offered under 2 h old with orders left; not after 2 h or when finished', () => {
    const { snap } = snapshot();
    expect(isOfferable(snap, snap.savedAt + 1)).toBe(true);
    expect(isOfferable(snap, snap.savedAt + RESUME_MAX_AGE_MS - 1)).toBe(true);
    expect(isOfferable(snap, snap.savedAt + RESUME_MAX_AGE_MS)).toBe(false);
    expect(isOfferable({ ...snap, index: snap.plan.length }, snap.savedAt)).toBe(false);
    // A clock set back still counts as recent.
    expect(isOfferable(snap, snap.savedAt - 60_000)).toBe(true);
  });
});
