import { describe, expect, it } from 'vitest';
import { EAT_BUDGET_MS, eatGroups, eatReactMs } from '../../src/engine/eat';

describe('eat sequence (SPEC §5.6, D101)', () => {
  it('singles up to five, then rows of five', () => {
    expect(eatGroups(3)).toEqual([1, 1, 1]);
    expect(eatGroups(5)).toEqual([1, 1, 1, 1, 1]);
    expect(eatGroups(8)).toEqual([5, 3]);
    expect(eatGroups(20)).toEqual([5, 5, 5, 5]);
  });
  it('eat + react stays within 4 s for every tray answer 1–20', () => {
    for (let n = 1; n <= 20; n++) expect(eatReactMs(n)).toBeLessThanOrEqual(EAT_BUDGET_MS);
  });
});
