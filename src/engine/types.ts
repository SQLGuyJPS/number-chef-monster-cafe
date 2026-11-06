// Core model (SPEC §3.1). Names may be refined; semantics may not.

export type SkillId =
  'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'B1' | 'B2' | 'B3' | 'B4';
export type Stage = 3 | 2 | 1 | 0;
export const STAGES: readonly Stage[] = [3, 2, 1, 0];

/** Per-skill operation filter (D24, D43b). */
export type Ops = 'both' | 'add' | 'sub';

export type StrategyTag =
  | 'countOn'
  | 'countBack'
  | 'doubles'
  | 'nearDouble'
  | 'makeTen'
  | 'bridge'
  | 'backThroughTen'
  | 'tens'
  | 'tensOnes'
  | 'compare'
  | 'count';

/**
 * Generator forms. `add`/`sub` are result forms (`a + b = ?`, `m − b = ?`); `missingAddend` covers
 * `a + ? = c` and `? + a = c`; `missingSub` is `m − ? = c` (SPEC §3.2).
 */
export type Form = 'add' | 'sub' | 'missingAddend' | 'missingSub';

export type Token = number | '?' | '+' | '−' | '=';

export interface Problem {
  /** Canonical, persisted (D50): `skill:form:operands`; addition result keys sort operands. */
  factKey: string;
  skill: SkillId;
  form: Form;
  /** As displayed, left to right; `null` is the blank. */
  operands: (number | null)[];
  display: Token[];
  answer: number;
  /** Unwrapped sentence, words only: "Eight plus five equals what?" (SPEC §4). */
  spoken: string;
  strategy: StrategyTag;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export type Layout = 'frames1' | 'frames2' | 'tensOnes';

export interface TrayTask {
  layout: Layout;
  /** Cells filled at the start. `locked`: prefill cannot be removed (add mode). */
  prefill: { frameCells: number; locked: boolean };
  mode: 'add' | 'remove';
  /** Missing-subtrahend forms: removed items stay visible in the taken-away row (SPEC §3.3). */
  takenAwayRow: boolean;
  /**
   * `cells`: the correct tray value. At S0 the tray is the S3 model under the cloche (D41) and the
   * answer is typed, so `typed` holds the number to enter (refines SPEC §3.1, D69).
   */
  expected: { cells: number; typed?: number };
  entry?: 'numpad1' | 'numpad2';
}
