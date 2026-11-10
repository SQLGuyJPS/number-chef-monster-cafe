import { describe, expect, it } from 'vitest';
import { tallySteps } from '../../src/engine/tally';

describe('Results tally (SPEC §5.7, D55)', () => {
  it('ones to ten, then fives, ending on the exact total', () => {
    expect(tallySteps(0)).toEqual([]);
    expect(tallySteps(3)).toEqual([1, 2, 3]);
    expect(tallySteps(10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(tallySteps(18)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 18]);
    expect(tallySteps(20)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]);
    expect(tallySteps(23)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 23]);
  });
  it('is strictly increasing for every total up to 40', () => {
    for (let t = 1; t <= 40; t++) {
      const s = tallySteps(t);
      expect(s.at(-1)).toBe(t);
      s.slice(1).forEach((n, i) => expect(n).toBeGreaterThan(s[i]!));
    }
  });
});
