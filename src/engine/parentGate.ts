// Parent gate (SPEC §12, D134). Pure: the caller injects the rng and the clock. The question is a
// multiplication a grown-up answers in seconds and a young child can't (factors 6–9 × 7–9); it is
// shown, never spoken.
import type { Rng } from './rng';

export const GATE_MAX_WRONG = 3;
export const GATE_LOCKOUT_MS = 30_000;
/** The parent area locks after this long without input (SPEC §12). */
export const PARENT_IDLE_MS = 5 * 60_000;
/** Longest answer the pad accepts (9 × 9 = 81; a third digit is room for a slip). */
export const GATE_MAX_DIGITS = 3;

export interface GateQuestion {
  a: number;
  b: number;
  answer: number;
}

export function gateQuestion(rng: Rng): GateQuestion {
  const a = rng.int(6, 9);
  const b = rng.int(7, 9);
  return { a, b, answer: a * b };
}

/** Wrong answers in a row and, once there were three, when the lockout ends (D134). */
export interface GateState {
  wrong: number;
  lockedUntil: number | null;
}

export const freshGate = (): GateState => ({ wrong: 0, lockedUntil: null });

export const isLockedOut = (s: GateState, now: number): boolean =>
  s.lockedUntil !== null && now < s.lockedUntil;

export type GateResult = 'open' | 'wrong' | 'lockedOut';

/**
 * One answer. Right opens and clears the count; the third wrong in a row starts the lockout; an
 * answer during the lockout changes nothing. After a lockout the count starts again from zero.
 */
export function submitGate(
  s: GateState,
  q: GateQuestion,
  typed: number,
  now: number,
): { state: GateState; result: GateResult } {
  if (isLockedOut(s, now)) return { state: s, result: 'lockedOut' };
  const wrongSoFar = s.lockedUntil !== null ? 0 : s.wrong;
  if (typed === q.answer) return { state: freshGate(), result: 'open' };
  const wrong = wrongSoFar + 1;
  if (wrong >= GATE_MAX_WRONG) {
    return { state: { wrong, lockedUntil: now + GATE_LOCKOUT_MS }, result: 'lockedOut' };
  }
  return { state: { wrong, lockedUntil: null }, result: 'wrong' };
}

/** True once the parent area has been left alone for `PARENT_IDLE_MS` (wall clock, D134). */
export const idleExpired = (lastInput: number, now: number): boolean =>
  now - lastInput >= PARENT_IDLE_MS;
