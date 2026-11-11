import { describe, expect, it } from 'vitest';
import { BUILT_SKILLS, pool } from '../../src/engine/generators';
import {
  check,
  isStartState,
  marksAtStart,
  orangeCells,
  removeLast,
  removedCount,
  startState,
  tapBin,
  tapItem,
  tapTakenAway,
  ticketRoles,
  toTrayTask,
  type TrayState,
} from '../../src/engine/tray';
import { factKeyOf } from '../../src/engine/generators';
import { STAGES, type Problem } from '../../src/engine/types';

const synthetic = (
  form: Problem['form'],
  display: Problem['display'],
  operands: Problem['operands'],
  answer: number,
): Problem => ({
  factKey: factKeyOf('A4', form, operands, answer),
  skill: 'A4',
  form,
  operands,
  display,
  answer,
  spoken: '',
  strategy: 'countOn',
  difficulty: 1,
});
// Forms that M2/M5 generators produce; the model supports them from M1 (D57).
const MISSING_ADD = synthetic('missingAddend', [7, '+', '?', '=', 10], [7, null, 10], 3);
const MISSING_ADD_FIRST = synthetic('missingAddend', ['?', '+', 4, '=', 9], [null, 4, 9], 5);
const MISSING_SUB = synthetic('missingSub', [7, '−', '?', '=', 5], [7, null, 5], 2);
const BRIDGE = synthetic('add', [8, '+', 5, '=', '?'], [8, 5, null], 13);
const BACK = synthetic('sub', [15, '−', 7, '=', '?'], [15, 7, null], 8);

const apply = (s: TrayState, n: number, f: (s: TrayState) => { state: TrayState }) => {
  let x = s;
  for (let i = 0; i < n; i++) x = f(x).state;
  return x;
};

/** Plays the obvious correct sequence for a task: add or remove one at a time. */
function solve(p: Problem, stage: (typeof STAGES)[number]): TrayState {
  const task = toTrayTask(p, stage);
  let s = startState(task);
  while (s.filled < task.expected.cells) s = tapBin(s).state;
  while (s.filled > task.expected.cells)
    s = (task.mode === 'remove' ? tapItem(s, 0) : removeLast(s)).state;
  return s;
}

describe('toTrayTask / check agree with the answer (every pool item × every stage)', () => {
  const all = [
    ...BUILT_SKILLS.flatMap((s) => pool(s)),
    MISSING_ADD,
    MISSING_ADD_FIRST,
    MISSING_SUB,
    BRIDGE,
    BACK,
  ];
  it.each(STAGES)('stage S%s', (stage) => {
    for (const p of all) {
      const task = toTrayTask(p, stage);
      const s = solve(p, stage);
      if (stage === 0) {
        expect(task.entry).toBe('numpad1');
        expect(check(task, { filled: s.filled, typed: p.answer })).toBe(true);
        expect(check(task, { filled: s.filled, typed: p.answer + 1 })).toBe(false);
        expect(check(task, { filled: s.filled, typed: null })).toBe(false);
        continue;
      }
      expect(check(task, s)).toBe(true);
      // The tray value that represents the unknown equals the answer.
      const unknown =
        stage === 1
          ? s.filled
          : task.mode === 'remove' && task.takenAwayRow
            ? removedCount(s)
            : task.mode === 'remove'
              ? s.filled
              : p.form === 'add'
                ? s.filled
                : s.filled - s.prefill;
      expect(unknown).toBe(p.answer);
      // Off by one either way is wrong.
      expect(check(task, { filled: s.filled + 1 })).toBe(false);
      expect(check(task, { filled: s.filled - 1 })).toBe(false);
      // No zero answers: the correct tray never equals the start (bell would be disabled, D11).
      expect(isStartState(s)).toBe(false);
      expect(s.filled).toBeLessThanOrEqual(s.capacity);
    }
  });

  it('layout is frames2 only above ten (SPEC §4)', () => {
    for (const p of BUILT_SKILLS.flatMap((s) => pool(s)))
      for (const st of STAGES) expect(toTrayTask(p, st).layout).toBe('frames1');
    expect(toTrayTask(BRIDGE, 3).layout).toBe('frames2');
    expect(toTrayTask(BRIDGE, 1).layout).toBe('frames2');
    expect(toTrayTask(BACK, 2).layout).toBe('frames2');
    expect(toTrayTask(BACK, 1).layout).toBe('frames1');
  });

  it('maps the four worked examples of SPEC §3.2', () => {
    const add = pool('A2').find((p) => p.display.join('') === '5+3=?')!;
    expect(toTrayTask(add, 3)).toMatchObject({
      prefill: { frameCells: 5, locked: true },
      mode: 'add',
      expected: { cells: 8 },
    });
    expect(toTrayTask(add, 1)).toMatchObject({
      prefill: { frameCells: 0 },
      mode: 'add',
      expected: { cells: 8 },
    });
    const sub = pool('A2').find((p) => p.display.join('') === '8−3=?')!;
    expect(toTrayTask(sub, 2)).toMatchObject({
      prefill: { frameCells: 8, locked: false },
      mode: 'remove',
      takenAwayRow: false,
      expected: { cells: 5 },
    });
    expect(toTrayTask(sub, 1)).toMatchObject({ mode: 'add', expected: { cells: 5 } });
    expect(toTrayTask(MISSING_ADD, 3)).toMatchObject({
      prefill: { frameCells: 7 },
      expected: { cells: 10 },
    });
    expect(toTrayTask(MISSING_ADD, 1).expected.cells).toBe(3);
    expect(toTrayTask(MISSING_SUB, 3)).toMatchObject({
      prefill: { frameCells: 7 },
      mode: 'remove',
      takenAwayRow: true,
      expected: { cells: 5 },
    });
    expect(toTrayTask(MISSING_SUB, 1)).toMatchObject({
      takenAwayRow: false,
      expected: { cells: 2 },
    });
    expect(toTrayTask(MISSING_SUB, 0)).toMatchObject({
      takenAwayRow: true,
      expected: { cells: 5, typed: 2 },
      entry: 'numpad1',
    });
  });
});

describe('tray rules (SPEC §3.3)', () => {
  const add = startState(
    toTrayTask(
      pool('A2').find((p) => p.display.join('') === '5+3=?')!,
      3,
    ),
  );
  const sub = startState(
    toTrayTask(
      pool('A2').find((p) => p.display.join('') === '8−3=?')!,
      3,
    ),
  );

  it('a new item always takes the first empty cell', () => {
    const r = tapBin(add);
    expect(r.effect).toEqual({ kind: 'placed', index: 5, count: 6 });
    expect(tapBin(r.state).effect).toMatchObject({ index: 6, count: 7 });
  });

  it('removal always takes the last filled cell, whichever item is tapped (remove mode)', () => {
    for (const touched of [0, 3, 7]) {
      const r = tapItem(sub, touched);
      expect(r.effect).toEqual({ kind: 'removed', index: 7, count: 7 });
      expect(r.state.filled).toBe(7);
    }
  });

  it('add mode: tapping a placed item sends the last one back to the bin; a locked item shakes (D82)', () => {
    const s = apply(add, 2, tapBin); // 5 locked + 2 placed
    expect(tapItem(s, 5)).toEqual({ state: { ...s, filled: 6 }, effect: { kind: 'removed', index: 6, count: 6 } });
    expect(tapItem(s, 6).effect).toEqual({ kind: 'removed', index: 6, count: 6 });
    expect(tapItem(s, 1)).toEqual({ state: s, effect: { kind: 'shakeLocked', index: 1 } });
    expect(tapItem(s, 9).effect.kind).toBe('none');
  });

  it('add mode: removeLast (drag to the bin) takes the last unlocked cell; locked prefill shakes and stays', () => {
    const s = apply(add, 2, tapBin);
    const r1 = removeLast(s);
    expect(r1.effect).toEqual({ kind: 'removed', index: 6, count: 6 });
    const r2 = removeLast(removeLast(r1.state).state);
    expect(r2.effect).toEqual({ kind: 'shakeLocked', index: 4 });
    expect(r2.state.filled).toBe(5);
  });

  it('remove mode: tapping the bin puts the last removed item back, never above the start (D42a)', () => {
    expect(tapBin(sub).effect.kind).toBe('wobbleBin');
    const s = apply(sub, 3, (x) => tapItem(x, 0));
    expect(s.filled).toBe(5);
    const r = tapBin(s);
    expect(r.effect).toEqual({ kind: 'putBack', index: 5, count: 6 });
    expect(r.state.filled).toBe(6);
  });

  it('taken-away row: removed items stay counted and tapping the row puts one back', () => {
    let s = startState(toTrayTask(MISSING_SUB, 3));
    s = apply(s, 3, (x) => tapItem(x, 0));
    expect(removedCount(s)).toBe(3);
    const r = tapTakenAway(s);
    expect(r.effect.kind).toBe('putBack');
    expect(removedCount(r.state)).toBe(2);
    expect(tapTakenAway(sub).effect.kind).toBe('none');
  });

  it('capacity: frames1 holds 10 and frames2 holds 20; over capacity wobbles the bin', () => {
    const one = apply(startState(toTrayTask(pool('A2')[0]!, 1)), 10, tapBin);
    expect(one.filled).toBe(10);
    expect(tapBin(one)).toEqual({ state: one, effect: { kind: 'wobbleBin' } });
    const two = apply(startState(toTrayTask(BRIDGE, 3)), 20, tapBin);
    expect(two.filled).toBe(20);
    expect(tapBin(two).effect.kind).toBe('wobbleBin');
  });

  it('no holes: the filled cells are always a run from cell one', () => {
    let s = add;
    const ops = [
      tapBin,
      removeLast,
      tapBin,
      tapBin,
      (x: TrayState) => tapItem(x, 2),
      removeLast,
      removeLast,
      removeLast,
    ];
    for (const op of ops) {
      s = op(s).state;
      expect(s.filled).toBeGreaterThanOrEqual(s.locked);
      expect(s.filled).toBeLessThanOrEqual(s.capacity);
    }
  });

  it('start state is detected for the bell guard', () => {
    expect(isStartState(add)).toBe(true);
    expect(isStartState(tapBin(add).state)).toBe(false);
  });
});

describe('ticket roles (D30): by role on the tray, not by position', () => {
  it('colours operands per form', () => {
    expect(ticketRoles(pool('A1')[0]!)).toEqual(['prefill', 'op', 'child', 'op', 'result']);
    expect(ticketRoles(MISSING_ADD)).toEqual(['prefill', 'op', 'child', 'op', 'result']);
    expect(ticketRoles(MISSING_ADD_FIRST)).toEqual(['child', 'op', 'prefill', 'op', 'result']);
    expect(ticketRoles(MISSING_SUB)).toEqual(['prefill', 'op', 'child', 'op', 'result']);
  });
});

describe('orange marks on the guided tray (D104, D111)', () => {
  const any = (form: string) => pool('A2').find((p) => p.form === form)!;
  it('result forms: the spots to fill / the items to take away; marked at the start only at S3 and S0', () => {
    const sub = any('sub');
    const t = toTrayTask(sub, 3);
    const [m, b] = sub.operands as number[];
    expect(orangeCells(t)).toEqual({ from: m! - b!, to: m });
    expect(marksAtStart(t, 3)).toBe(true);
    expect(marksAtStart(toTrayTask(sub, 2), 2)).toBe(false);
    expect(marksAtStart(toTrayTask(sub, 0), 0)).toBe(true);
    const add = any('add');
    const [x] = add.operands as number[];
    expect(orangeCells(toTrayTask(add, 3))).toEqual({ from: x, to: add.answer });
    // S1 holds only the answer: nothing to mark.
    expect(orangeCells(toTrayTask(add, 1))).toBeNull();
  });
  it('missing-number forms: the unknown, marked at S2 too', () => {
    const p = pool('A3').find((q) => q.form === 'missingAddend')!;
    const t = toTrayTask(p, 2);
    expect(orangeCells(t)).toEqual(t.unknown);
    expect(marksAtStart(t, 2)).toBe(true);
  });
});
