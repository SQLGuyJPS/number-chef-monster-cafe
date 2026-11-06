import { describe, expect, it } from 'vitest';
import { numberToWords } from '../../src/engine/numberWords';

// SPEC §13.4: exhaustive 0–100 against a hand-typed table of 0–20, the tens, and 12 spot checks.
const HAND_0_20 = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
  'twenty',
];
const HAND_TENS: Record<number, string> = {
  30: 'thirty',
  40: 'forty',
  50: 'fifty',
  60: 'sixty',
  70: 'seventy',
  80: 'eighty',
  90: 'ninety',
  100: 'one hundred',
};
const SPOT: Record<number, string> = {
  21: 'twenty-one',
  23: 'twenty-three',
  34: 'thirty-four',
  45: 'forty-five',
  48: 'forty-eight',
  56: 'fifty-six',
  67: 'sixty-seven',
  72: 'seventy-two',
  81: 'eighty-one',
  89: 'eighty-nine',
  94: 'ninety-four',
  99: 'ninety-nine',
};

describe('numberToWords', () => {
  it('matches the hand table for 0–20, the tens and spot checks', () => {
    HAND_0_20.forEach((w, n) => expect(numberToWords(n)).toBe(w));
    for (const [n, w] of Object.entries(HAND_TENS)) expect(numberToWords(Number(n))).toBe(w);
    for (const [n, w] of Object.entries(SPOT)) expect(numberToWords(Number(n))).toBe(w);
  });

  it('every value 0–100 is lowercase words, unique, digit-free', () => {
    const seen = new Set<string>();
    for (let n = 0; n <= 100; n++) {
      const w = numberToWords(n);
      expect(w).toMatch(/^[a-z]+(?:[- ][a-z]+)?$/);
      seen.add(w);
      if (n > 20 && n < 100 && n % 10 !== 0) {
        const [t, o] = w.split('-');
        expect(t).toBe(numberToWords(n - (n % 10)));
        expect(o).toBe(numberToWords(n % 10));
      }
    }
    expect(seen.size).toBe(101);
  });

  it('rejects values outside 0–100', () => {
    expect(() => numberToWords(-1)).toThrow();
    expect(() => numberToWords(101)).toThrow();
    expect(() => numberToWords(2.5)).toThrow();
  });
});
