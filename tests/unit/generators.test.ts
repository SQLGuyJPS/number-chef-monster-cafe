import { describe, expect, it } from 'vitest';
import { factKeyOf, filterOps, isAddition, pool } from '../../src/engine/generators';
import type { Problem } from '../../src/engine/types';

// SPEC §4 table (ordered presentations).
const SIZES = { A1: { add: 10, sub: 10 }, A2: { add: 35, sub: 35 }, A3: { add: 18, sub: 18 } };

/** Solves the ticket for its blank, wherever the blank is. */
const evaluate = (p: Problem): number => {
  const [x, op, y, , z] = p.display;
  if (z === '?') return op === '+' ? Number(x) + Number(y) : Number(x) - Number(y);
  if (x === '?') return op === '+' ? Number(z) - Number(y) : Number(z) + Number(y);
  return op === '+' ? Number(z) - Number(x) : Number(x) - Number(z);
};

describe('A3 Perfect Ten pool (SPEC §4)', () => {
  const items = pool('A3');
  it('has the four forms for every a 1–9, answers are the other part of ten', () => {
    expect(items).toHaveLength(36);
    for (const p of items) {
      expect(p.answer).toBe(evaluate(p));
      expect(p.display).toContain(10);
      expect(p.answer).toBeGreaterThanOrEqual(1);
      expect(p.answer).toBeLessThanOrEqual(9);
    }
  });
  it('keys: a+?=10 and ?+a=10 share; 10−a=? and 10−?=a do not (D50)', () => {
    const key = (s: string) => items.find((p) => p.display.join('') === s)!.factKey;
    expect(key('7+?=10')).toBe('A3:?add:7,10');
    expect(key('?+7=10')).toBe('A3:?add:7,10');
    expect(key('10−4=?')).toBe('A3:-:10,4');
    expect(key('10−?=6')).toBe('A3:?sub:10,6');
    expect(new Set(items.map((p) => p.factKey)).size).toBe(27);
  });
  it('5+5 and 9+1 easiest, then by distance from 5; addition makes ten', () => {
    const d = (s: string) => items.find((p) => p.display.join('') === s)!;
    expect(d('5+?=10').difficulty).toBe(1);
    expect(d('9+?=10').difficulty).toBe(1);
    expect(d('1+?=10').difficulty).toBe(1);
    expect(d('4+?=10').difficulty).toBe(2);
    expect(d('3+?=10').difficulty).toBe(3);
    expect(d('8+?=10').difficulty).toBe(4);
    expect(d('7+?=10').strategy).toBe('makeTen');
    expect(d('10−?=6').strategy).toBe('countBack');
  });
  it('spoken text is words only', () => {
    for (const p of items) expect(p.spoken).not.toMatch(/[0-9+−=]/);
    expect(items.find((p) => p.display.join('') === '7+?=10')!.spoken).toBe(
      'Seven plus what equals ten?',
    );
  });
});

describe.each(['A1', 'A2'] as const)('%s pool', (skill) => {
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
