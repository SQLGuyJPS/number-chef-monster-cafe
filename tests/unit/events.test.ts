import { describe, expect, it } from 'vitest';
import { attemptEvent, coinEvent, OUTCOMES } from '../../src/engine/events';

// SPEC §11.2, D36: the attempt and coin shapes are frozen in M1. Changing these keys needs a
// schema migration; this test is the tripwire.
const ctx = { id: () => 'id-1', now: () => 1700000000000, dev: 'dev-1' };

describe('frozen event shapes', () => {
  it('attempt', () => {
    const e = attemptEvent(ctx, {
      svc: 's1',
      fact: 'A2:+:3,5',
      skill: 'A2',
      stage: 3,
      outcome: 'first',
      ms: 4200.4,
    });
    expect(Object.keys(e).sort()).toEqual([
      'dev',
      'fact',
      'id',
      'k',
      'ms',
      'outcome',
      'skill',
      'stage',
      'svc',
      't',
      'v',
    ]);
    expect(e).toEqual({
      id: 'id-1',
      t: 1700000000000,
      dev: 'dev-1',
      v: 1,
      k: 'attempt',
      svc: 's1',
      fact: 'A2:+:3,5',
      skill: 'A2',
      stage: 3,
      outcome: 'first',
      ms: 4200,
    });
  });

  it('coin', () => {
    const e = coinEvent(ctx, { svc: 's1', n: 3 });
    expect(Object.keys(e).sort()).toEqual(['dev', 'id', 'k', 'n', 'svc', 't', 'v']);
    expect(e.k).toBe('coin');
  });

  it('the four outcomes, spelled as in SPEC §3.4', () => {
    expect(OUTCOMES).toEqual(['first', 'afterHint', 'fixed', 'assisted']);
  });
});
