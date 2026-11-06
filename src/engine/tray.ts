// Tray model (SPEC §3.3, D30, D42): canonical fill order, removal from the end, locked prefill,
// tap-to-count, remove-mode put-back, capacity, taken-away row. Pure; the UI renders it.
import type { Layout, Problem, Stage, TrayTask } from './types';

const capacityOf = (layout: Layout): number => (layout === 'frames2' ? 20 : 10);

/** SPEC §4: frames2 iff max(prefill, expected) > 10. */
const layoutFor = (prefill: number, expected: number): Layout =>
  Math.max(prefill, expected) > 10 ? 'frames2' : 'frames1';

/** The S3/S2 tray (also the S0 cloche model, D41). */
function guidedTask(p: Problem): Omit<TrayTask, 'layout'> {
  const known = p.operands.filter((o): o is number => o !== null);
  switch (p.form) {
    case 'add': // a + b = ?: a prefilled and locked; the child adds b.
      return {
        prefill: { frameCells: known[0]!, locked: true },
        mode: 'add',
        takenAwayRow: false,
        expected: { cells: p.answer },
      };
    case 'sub': // m − b = ?: the full minuend; the child removes b (D30).
      return {
        prefill: { frameCells: known[0]!, locked: false },
        mode: 'remove',
        takenAwayRow: false,
        expected: { cells: p.answer },
      };
    case 'missingAddend': {
      // a + ? = c and ? + a = c: the known addend is prefilled (blue), the child fills to c.
      const a = known[0]!;
      return {
        prefill: { frameCells: a, locked: true },
        mode: 'add',
        takenAwayRow: false,
        expected: { cells: a + p.answer },
      };
    }
    case 'missingSub': // m − ? = c: remove until c remain; removed items stay in the row.
      return {
        prefill: { frameCells: known[0]!, locked: false },
        mode: 'remove',
        takenAwayRow: true,
        expected: { cells: known[1]! },
      };
  }
}

/** Pure (SPEC §3.1). S1 builds only the unknown from empty; S0 types it (D32). */
export function toTrayTask(p: Problem, stage: Stage): TrayTask {
  const g = guidedTask(p);
  if (stage === 1) {
    return {
      layout: layoutFor(0, p.answer),
      prefill: { frameCells: 0, locked: false },
      mode: 'add',
      takenAwayRow: false,
      expected: { cells: p.answer },
    };
  }
  const layout = layoutFor(g.prefill.frameCells, g.expected.cells);
  if (stage === 0)
    return {
      ...g,
      layout,
      expected: { ...g.expected, typed: p.answer },
      entry: p.answer > 99 ? 'numpad2' : 'numpad1',
    };
  return { ...g, layout };
}

export interface TrayState {
  capacity: number;
  /** Filled cells always form a run from cell 1 (no holes, D30). */
  filled: number;
  /** Cells 1..prefill started filled (blue). */
  prefill: number;
  /** Locked cells cannot be removed (add-mode prefill). */
  locked: number;
  mode: 'add' | 'remove';
  takenAwayRow: boolean;
}

export function startState(task: TrayTask): TrayState {
  return {
    capacity: capacityOf(task.layout),
    filled: task.prefill.frameCells,
    prefill: task.prefill.frameCells,
    locked: task.prefill.locked ? task.prefill.frameCells : 0,
    mode: task.mode,
    takenAwayRow: task.takenAwayRow,
  };
}

/** Items taken off in remove mode; for missing-subtrahend forms they sit in the taken-away row. */
export const removedCount = (s: TrayState): number =>
  s.mode === 'remove' ? Math.max(0, s.prefill - s.filled) : 0;

export type TrayEffect =
  | { kind: 'placed'; index: number; count: number } // count = running total said at S3
  | { kind: 'putBack'; index: number; count: number }
  | { kind: 'removed'; index: number; count: number } // count = remaining (counting back)
  | { kind: 'count'; index: number; count: number } // tap-to-count hop (add mode)
  | { kind: 'wobbleBin' } // over capacity, or nothing to put back
  | { kind: 'shakeLocked'; index: number }
  | { kind: 'none' };

export interface TrayResult {
  state: TrayState;
  effect: TrayEffect;
}

/**
 * Tap (or drop on the tray from) the bin. Add mode: a new item takes the first empty cell. Remove
 * mode: puts the last removed item back (D42a), never above the starting amount.
 */
export function tapBin(s: TrayState): TrayResult {
  if (s.mode === 'remove') {
    if (s.filled >= s.prefill) return { state: s, effect: { kind: 'wobbleBin' } };
    const next = { ...s, filled: s.filled + 1 };
    return { state: next, effect: { kind: 'putBack', index: s.filled, count: next.filled } };
  }
  if (s.filled >= s.capacity) return { state: s, effect: { kind: 'wobbleBin' } };
  const next = { ...s, filled: s.filled + 1 };
  return { state: next, effect: { kind: 'placed', index: s.filled, count: next.filled } };
}

/** Taken-away row tap (missing-subtrahend forms): same as the bin in remove mode (D42a). */
export const tapTakenAway = (s: TrayState): TrayResult =>
  s.takenAwayRow ? tapBin(s) : { state: s, effect: { kind: 'none' } };

/**
 * Removal always takes the last filled cell, whichever item was touched (D30). Add mode: "take one
 * back" or dragging an item to the bin; locked prefill shakes and stays.
 */
export function removeLast(s: TrayState): TrayResult {
  if (s.filled === 0) return { state: s, effect: { kind: 'none' } };
  if (s.filled <= s.locked)
    return { state: s, effect: { kind: 'shakeLocked', index: s.filled - 1 } };
  const next = { ...s, filled: s.filled - 1 };
  return { state: next, effect: { kind: 'removed', index: s.filled - 1, count: next.filled } };
}

/**
 * Tapping a placed item. Add mode: it hops and says its position; nothing is removed (counting by
 * touch, SPEC §3.3). Remove mode: removes the last filled cell (the action being taught).
 */
export function tapItem(s: TrayState, index: number): TrayResult {
  if (index < 0 || index >= s.filled) return { state: s, effect: { kind: 'none' } };
  if (s.mode === 'remove') return removeLast(s);
  return { state: s, effect: { kind: 'count', index, count: index + 1 } };
}

/** Dragging a placed item off the tray (remove mode) or onto the bin (add mode). */
export const dragItemAway = (s: TrayState): TrayResult => removeLast(s);

/** The bell is disabled while the tray equals its starting state (anti-mash, SPEC §3.3). */
export const isStartState = (s: TrayState): boolean => s.filled === s.prefill;

/** Pure (SPEC §3.1): is this tray (or, at S0, this typed number) the right answer? */
export function check(task: TrayTask, state: { filled: number; typed?: number | null }): boolean {
  if (task.entry) return state.typed === task.expected.typed;
  return state.filled === task.expected.cells;
}

/** Ticket token roles (SPEC §5.4, D30): by role on the tray, not by position. */
export type TokenRole = 'prefill' | 'child' | 'result' | 'op';
export function ticketRoles(p: Problem): TokenRole[] {
  const roles: TokenRole[] = [];
  let operandIndex = 0;
  for (const t of p.display) {
    if (t === '+' || t === '−' || t === '=') {
      roles.push('op');
      continue;
    }
    const pos = operandIndex++;
    const isLast = pos === 2;
    if (isLast) roles.push('result');
    else if (p.form === 'missingAddend' && t !== '?') roles.push('prefill');
    else if (p.form === 'missingAddend') roles.push('child');
    else roles.push(pos === 0 ? 'prefill' : 'child');
  }
  return roles;
}
