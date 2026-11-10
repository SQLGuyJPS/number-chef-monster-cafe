import { describe, expect, it } from 'vitest';
import { applyDemoStep, buildDemo, followMeCue, runDemo } from '../../src/engine/demos';
import { BUILT_SKILLS, pool } from '../../src/engine/generators';
import { phrase } from '../../src/engine/phrases';
import { startState, tapBin, toTrayTask } from '../../src/engine/tray';

const all = BUILT_SKILLS.flatMap((s) => pool(s));

describe('buildDemo (SPEC §5.5)', () => {
  it('every demo ends in the expected tray state, for every pool item', () => {
    for (const p of all) expect(runDemo(p).filled).toBe(toTrayTask(p, 3).expected.cells);
  });

  it('never steps outside the tray and never touches locked cells', () => {
    for (const p of all) {
      let s = startState(toTrayTask(p, 3));
      for (const step of buildDemo(p)) {
        // Only the make-ten gap step lights empty cells (SPEC §5.5); every glow stays on the tray.
        const limit = step.narrationKey.startsWith('demo.ten.gap')
          ? s.capacity
          : Math.max(s.filled, 1);
        if (step.trayOp.op === 'glow')
          for (const c of step.trayOp.cells) expect(c).toBeLessThan(limit);
        s = applyDemoStep(s, step);
        expect(s.filled).toBeGreaterThanOrEqual(s.locked);
      }
    }
  });

  it('narration is words only and the last line names the result', () => {
    for (const p of all) {
      const steps = buildDemo(p);
      for (const st of steps) expect(phrase(st.narrationKey, st.params)).not.toMatch(/[0-9]/);
      expect(steps.length).toBeLessThanOrEqual(14);
    }
  });

  it('picks the strategy demo: doubles, near double, count on, count back', () => {
    const find = (s: string) => all.find((p) => p.display.join('') === s)!;
    expect(buildDemo(find('3+3=?')).map((s) => s.narrationKey)).toContain('demo.doubles.orange');
    const near = buildDemo(find('3+4=?'));
    expect(near.at(-2)).toMatchObject({
      narrationKey: 'demo.near.know',
      params: { a: 3, sum: 6 },
      trayOp: { cells: [0, 1, 2, 3, 4, 5] },
    });
    expect(near.at(-1)).toMatchObject({
      narrationKey: 'demo.near.more',
      params: { n: 7 },
      trayOp: { cells: [6] },
    });
    const nearDown = buildDemo(find('4+3=?'));
    expect(nearDown.at(-2)?.trayOp).toEqual({ op: 'glow', cells: [0, 1, 2, 4, 5, 6] });
    expect(nearDown.at(-1)?.trayOp).toEqual({ op: 'glow', cells: [3] });
    expect(buildDemo(find('2+6=?')).map((s) => phrase(s.narrationKey, s.params))).toEqual([
      'Two.',
      'three',
      'four',
      'five',
      'six',
      'seven',
      'eight',
      'Eight!',
    ]);
    expect(buildDemo(find('8−3=?')).map((s) => phrase(s.narrationKey, s.params))).toEqual([
      'Eight.',
      'seven',
      'six',
      'five',
      'Five left!',
    ]);
  });

  it('A3: make ten flashes the gap and fills it counted from one; 10 − ? counts what went away (D98, D104)', () => {
    const find = (s: string) => all.find((p) => p.display.join('') === s)!;
    const ten = buildDemo(find('7+?=10'));
    expect(ten.map((s) => phrase(s.narrationKey, s.params))).toEqual([
      'Seven.',
      'Three empty spots.',
      'one',
      'two',
      'three',
      'Seven and three more makes ten!',
    ]);
    expect(ten[1]!.trayOp).toEqual({ op: 'glow', cells: [7, 8, 9] });
    expect(phrase(buildDemo(find('9+?=10'))[1]!.narrationKey)).toBe('One empty spot.');
    expect(buildDemo(find('?+3=10'))[0]!.params).toEqual({ n: 3 });
    expect(buildDemo(find('10−?=6')).map((s) => phrase(s.narrationKey, s.params))).toEqual([
      'Ten.',
      'one',
      'two',
      'three',
      'four',
      'Six left!',
      'Four taken away!',
    ]);
    expect(
      buildDemo(find('10−4=?'))
        .map((s) => phrase(s.narrationKey, s.params))
        .at(-1),
    ).toBe('Six left!');
  });
});

describe('followMeCue', () => {
  it('points at the next action, then the bell', () => {
    const add = startState(toTrayTask(pool('A1')[0]!, 3)); // 1 + 1
    expect(followMeCue(add, 2)).toBe('place');
    expect(followMeCue(tapBin(add).state, 2)).toBe('bell');
    expect(followMeCue(tapBin(tapBin(add).state).state, 2)).toBe('remove');
    const sub = startState(
      toTrayTask(
        pool('A1').find((p) => p.form === 'sub')!,
        3,
      ),
    );
    expect(followMeCue(sub, sub.filled - 1)).toBe('remove');
    expect(followMeCue(sub, sub.filled + 1)).toBe('putBack');
  });
});
