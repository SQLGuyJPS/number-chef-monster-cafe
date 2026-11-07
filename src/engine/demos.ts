// Worked demos are data (SPEC §5.5): buildDemo(problem) → DemoStep[]; one DemoPlayer renders them.
// Every demo starts from the S3 start state and ends in the expected tray (unit-tested).
import type { PhraseKey, PhraseParams } from './phrases';
import { removeLast, startState, tapBin, toTrayTask, type TrayState } from './tray';
import type { Problem } from './types';

export type TrayOp =
  | { op: 'none' }
  | { op: 'add' } // first empty cell
  | { op: 'remove' } // last filled cell
  /** Highlight these cells (0-based); visual only. */
  | { op: 'glow'; cells: number[] };

export interface DemoStep {
  narrationKey: PhraseKey;
  params: PhraseParams;
  trayOp: TrayOp;
  holdMs: number;
}

const HOLD = { step: 700, intro: 900, outro: 1200 };

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
const glow = (from: number, to: number): TrayOp => ({ op: 'glow', cells: range(from, to) });

const say = (
  narrationKey: PhraseKey,
  params: PhraseParams,
  trayOp: TrayOp = { op: 'none' },
  holdMs = HOLD.step,
): DemoStep => ({
  narrationKey,
  params,
  trayOp,
  holdMs,
});

/** Count on: blue group glows "five", orange items appear one by one "six, seven, eight". */
function countOn(start: number, add: number): DemoStep[] {
  const steps = [say('demo.start', { n: start }, glow(0, start), HOLD.intro)];
  for (let i = 1; i <= add; i++) steps.push(say('count.n', { n: start + i }, { op: 'add' }));
  steps.push(say('demo.total', { n: start + add }, { op: 'none' }, HOLD.outro));
  return steps;
}

/** Count back: items fly off "seven, six, five" from the last filled cell. */
function countBack(start: number, remove: number): DemoStep[] {
  const steps = [say('demo.start', { n: start }, glow(0, start), HOLD.intro)];
  for (let i = 1; i <= remove; i++) steps.push(say('count.n', { n: start - i }, { op: 'remove' }));
  steps.push(say('demo.left', { n: start - remove }, { op: 'none' }, HOLD.outro));
  return steps;
}

/** Doubles (D42b): the blue and orange groups glow in turn, "three blue, three orange: the same". */
function doubles(a: number): DemoStep[] {
  const steps: DemoStep[] = [];
  for (let i = 1; i <= a; i++) steps.push(say('count.n', { n: a + i }, { op: 'add' }));
  steps.push(say('demo.doubles.blue', { n: a }, glow(0, a), HOLD.intro));
  steps.push(say('demo.doubles.orange', { n: a }, glow(a, 2 * a), HOLD.intro));
  steps.push(say('demo.doubles.sum', { a, sum: 2 * a }, glow(0, 2 * a), HOLD.outro));
  return steps;
}

/**
 * Near double (D17, D42b): the blue group and an equal part of the orange group glow ("you know
 * three and three is six"), then the one extra item: "one more makes seven".
 */
function nearDouble(a: number, b: number): DemoStep[] {
  const d = Math.min(a, b);
  const steps: DemoStep[] = [];
  for (let i = 1; i <= b; i++) steps.push(say('count.n', { n: a + i }, { op: 'add' }));
  // The equal part: blue is the bigger group → its first d cells and all of orange; otherwise all of
  // blue and the first d orange cells. The one cell left over is "one more".
  const equal = a > b ? [...range(0, d), ...range(a, a + b)] : range(0, a + d);
  const extra = a > b ? a - 1 : a + d;
  steps.push(say('demo.near.know', { a: d, sum: 2 * d }, { op: 'glow', cells: equal }, HOLD.intro));
  steps.push(say('demo.near.more', { n: a + b }, { op: 'glow', cells: [extra] }, HOLD.outro));
  return steps;
}

/** SPEC §5.5 table; A1/A2 strategies in M1 (D42). */
export function buildDemo(p: Problem): DemoStep[] {
  const task = toTrayTask(p, 3);
  const start = task.prefill.frameCells;
  const target = task.expected.cells;
  const [a, b] = p.operands.filter((o): o is number => o !== null);
  if (task.mode === 'remove') return countBack(start, start - target);
  if (p.form === 'add' && p.strategy === 'doubles') return doubles(a!);
  if (p.form === 'add' && p.strategy === 'nearDouble') return nearDouble(a!, b!);
  return countOn(start, target - start);
}

/** Applies one demo step to a tray (glows and narration leave it unchanged). */
export function applyDemoStep(s: TrayState, step: DemoStep): TrayState {
  if (step.trayOp.op === 'add') return tapBin(s).state;
  if (step.trayOp.op === 'remove') return removeLast(s).state;
  return s;
}

export function runDemo(p: Problem): TrayState {
  return buildDemo(p).reduce(applyDemoStep, startState(toTrayTask(p, 3)));
}

/**
 * FollowMe (SPEC §5.5): what the child should do next to reach the expected tray. The UI pulses
 * the matching target; when nothing is left, the bell pulses (the child presses it, D4).
 */
export type FollowMeCue = 'place' | 'putBack' | 'remove' | 'bell';
export function followMeCue(s: TrayState, expectedCells: number): FollowMeCue {
  if (s.filled < expectedCells) return s.mode === 'remove' ? 'putBack' : 'place';
  // Too many: the last item pulses; tapping it sends it back in every mode (D82).
  if (s.filled > expectedCells) return 'remove';
  return 'bell';
}
