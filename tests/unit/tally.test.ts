import { describe, expect, it } from 'vitest';
import { TALLY_FLOOR_MS, TALLY_START_MS, tallySchedule } from '../../src/engine/tally';

describe('Results tally schedule (SPEC §5.7)', () => {
  it('0 coins goes straight to the end', () => {
    expect(tallySchedule(0)).toEqual([]);
  });

  it('counts by one from 1 to the total, starting at 0 ms', () => {
    for (let t = 1; t <= 40; t++) {
      const s = tallySchedule(t);
      expect(s.map((x) => x.n)).toEqual(Array.from({ length: t }, (_, i) => i + 1));
      expect(s[0]!.atMs).toBe(0);
      expect(s.at(-1)!.n).toBe(t);
    }
  });

  it('starts near three a second and accelerates smoothly to the ten-a-second cap', () => {
    const s = tallySchedule(40);
    const gaps = s.slice(1).map((x, i) => x.atMs - s[i]!.atMs);
    expect(gaps[0]).toBe(TALLY_START_MS);
    gaps.forEach((g) => expect(g).toBeGreaterThanOrEqual(TALLY_FLOOR_MS));
    gaps.slice(1).forEach((g, i) => expect(g).toBeLessThanOrEqual(gaps[i]!));
    // Smooth: no single step speeds up by more than a fifth.
    gaps.slice(1).forEach((g, i) => expect(gaps[i]! - g).toBeLessThanOrEqual(gaps[i]! / 5));
    expect(gaps.at(-1)).toBeLessThanOrEqual(TALLY_FLOOR_MS + 5);
  });

  it('takes a sensible time: about 4 s for a full service, never long for a big one', () => {
    const dur = (t: number) => tallySchedule(t).at(-1)!.atMs;
    expect(dur(23)).toBeGreaterThanOrEqual(3_000);
    expect(dur(23)).toBeLessThanOrEqual(4_500);
    expect(dur(29)).toBeLessThanOrEqual(5_000);
    expect(dur(5)).toBeLessThanOrEqual(1_400);
  });
});
