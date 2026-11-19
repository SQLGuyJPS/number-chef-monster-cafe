import { describe, expect, it } from 'vitest';
import {
  freshGate,
  gateQuestion,
  GATE_LOCKOUT_MS,
  idleExpired,
  isLockedOut,
  PARENT_IDLE_MS,
  submitGate,
} from '../../src/engine/parentGate';
import { mulberry32 } from '../../src/engine/rng';

// SPEC §12, D134: 6–9 × 7–9; three wrong in a row → 30 s lockout; 5 minutes idle locks the area.
describe('parent gate', () => {
  it('asks 6–9 × 7–9 and covers every pair', () => {
    const rng = mulberry32(5);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const q = gateQuestion(rng);
      expect(q.a).toBeGreaterThanOrEqual(6);
      expect(q.a).toBeLessThanOrEqual(9);
      expect(q.b).toBeGreaterThanOrEqual(7);
      expect(q.b).toBeLessThanOrEqual(9);
      expect(q.answer).toBe(q.a * q.b);
      seen.add(`${q.a}x${q.b}`);
    }
    expect(seen.size).toBe(12);
  });

  it('opens on the right answer and clears the wrong count', () => {
    const q = { a: 7, b: 8, answer: 56 };
    let s = submitGate(freshGate(), q, 50, 0).state;
    expect(s.wrong).toBe(1);
    const r = submitGate(s, q, 56, 1);
    expect(r.result).toBe('open');
    s = r.state;
    expect(s).toEqual(freshGate());
  });

  it('locks for 30 s on the third wrong answer and ignores answers meanwhile', () => {
    const q = { a: 6, b: 7, answer: 42 };
    let s = freshGate();
    expect(submitGate(s, q, 1, 0).result).toBe('wrong');
    s = submitGate(s, q, 1, 0).state;
    s = submitGate(s, q, 2, 10).state;
    const third = submitGate(s, q, 3, 20);
    expect(third.result).toBe('lockedOut');
    s = third.state;
    expect(isLockedOut(s, 20)).toBe(true);
    expect(isLockedOut(s, 20 + GATE_LOCKOUT_MS - 1)).toBe(true);
    // Even the right answer does nothing during the lockout.
    expect(submitGate(s, q, 42, 1000)).toEqual({ state: s, result: 'lockedOut' });
    expect(isLockedOut(s, 20 + GATE_LOCKOUT_MS)).toBe(false);
    // Afterwards the count starts again: one wrong answer does not re-lock.
    const after = submitGate(s, q, 5, 20 + GATE_LOCKOUT_MS);
    expect(after.result).toBe('wrong');
    expect(after.state.wrong).toBe(1);
    expect(submitGate(s, q, 42, 20 + GATE_LOCKOUT_MS).result).toBe('open');
  });

  it('idle lock after 5 minutes without input', () => {
    expect(idleExpired(1000, 1000 + PARENT_IDLE_MS - 1)).toBe(false);
    expect(idleExpired(1000, 1000 + PARENT_IDLE_MS)).toBe(true);
    expect(PARENT_IDLE_MS).toBe(300_000);
  });
});
