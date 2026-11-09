import { describe, expect, it } from 'vitest';
import { BUILT_SKILLS, factKeyOf, filterOps, isAddition, pool } from '../../src/engine/generators';
import type { Problem } from '../../src/engine/types';

// SPEC §4 table (ordered presentations).
const SIZES = { A1: { add: 10, sub: 10 }, A2: { add: 35, sub: 35 } };

const evaluate = (p: Problem): number => {
  const [a, op, b] = p.display;
  return op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
};

describe.each(BUILT_SKILLS)('%s pool', (skill) => {
  const items = pool(skill);

  it('has the SPEC §4 size', () => {
    expect(items.filter(isAddition)).toHaveLength(SIZES[skill].add);
    expect(items.filter((p) => !isAddition(p))).toHaveLength(SIZES[skill].sub);
  });

  it('answers are valid, never zero, within range', () => {
    const max = skill === 'A1' ? 5 : 10;
    const minSum = skill === 'A1' ? 2 : 6;
    for (const p of items) {
      expect(p.answer).toBe(evaluate(p));
      expect(p.answer).toBeGreaterThan(0);
      const top = p.form === 'add' ? p.answer : (p.operands[0] as number);
      expect(top).toBeLessThanOrEqual(max);
      expect(top).toBeGreaterThanOrEqual(minSum);
      for (const o of p.operands) if (o !== null) expect(o).toBeGreaterThanOrEqual(1);
    }
  });

  it('presentations are unique; commuted additions share a key, subtractions do not', () => {
    const shown = new Set(items.map((p) => p.display.join(' ')));
    expect(shown.size).toBe(items.length);
    for (const p of items.filter((q) => q.form === 'add')) {
      const [a, , b] = p.display as number[];
      expect(p.factKey).toBe(`${skill}:+:${Math.min(a!, b!)},${Math.max(a!, b!)}`);
    }
    for (const p of items.filter((q) => q.form === 'sub')) {
      expect(p.factKey).toBe(`${skill}:-:${p.display[0]},${p.display[2]}`);
    }
  });

  it('spoken text is words only and ends with a question mark', () => {
    for (const p of items) {
      expect(p.spoken).not.toMatch(/[0-9+−=]/);
      expect(p.spoken).toMatch(/equals what\?$/);
    }
  });

  it('tags doubles, near-doubles, count-on and count-back', () => {
    const tag = (s: string) => items.find((p) => p.display.join('') === s)?.strategy;
    if (skill === 'A1') {
      expect(tag('2+2=?')).toBe('doubles');
      expect(tag('2+3=?')).toBe('nearDouble');
      expect(tag('4+1=?')).toBe('countOn');
      expect(tag('5−2=?')).toBe('countBack');
    } else {
      expect(tag('3+4=?')).toBe('nearDouble');
      expect(tag('5+5=?')).toBe('doubles');
      expect(tag('8+2=?')).toBe('countOn');
    }
  });

  it('difficulty puts near-doubles first, then larger addends; subtraction by minuend', () => {
    for (const p of items) {
      expect(p.difficulty).toBeGreaterThanOrEqual(1);
      expect(p.difficulty).toBeLessThanOrEqual(5);
      if (p.strategy === 'nearDouble') expect(p.difficulty).toBe(1);
    }
    const subs = items.filter((p) => p.form === 'sub');
    for (const x of subs)
      for (const y of subs)
        if ((x.operands[0] as number) < (y.operands[0] as number))
          expect(x.difficulty).toBeLessThanOrEqual(y.difficulty);
  });

  it('the ops filter yields only the allowed forms', () => {
    expect(filterOps(items, 'add').every(isAddition)).toBe(true);
    expect(filterOps(items, 'sub').some(isAddition)).toBe(false);
    expect(filterOps(items, 'both')).toHaveLength(items.length);
  });
});

describe('factKeyOf (D50)', () => {
  it('follows skill:form:operands with shared missing-addend keys', () => {
    expect(factKeyOf('A2', 'add', [5, 3, null], 8)).toBe('A2:+:3,5');
    expect(factKeyOf('A8', 'sub', [15, 7, null], 8)).toBe('A8:-:15,7');
    expect(factKeyOf('A4', 'missingAddend', [3, null, 8], 5)).toBe('A4:?add:3,8');
    expect(factKeyOf('A4', 'missingAddend', [null, 3, 8], 5)).toBe('A4:?add:3,8');
    expect(factKeyOf('A3', 'missingSub', [10, null, 6], 4)).toBe('A3:?sub:10,6');
  });
});
