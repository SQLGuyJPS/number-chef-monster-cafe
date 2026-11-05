import { describe, expect, it } from 'vitest';
import { hashSeed, mulberry32 } from '../../src/engine/rng';

describe('mulberry32', () => {
  it('is deterministic per seed and differs across seeds', () => {
    const a = Array.from({ length: 5 }, mulberry32(42).next);
    const b = Array.from({ length: 5 }, mulberry32(42).next);
    const c = Array.from({ length: 5 }, mulberry32(43).next);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('stays in range and covers int bounds', () => {
    const r = mulberry32(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const x = r.next();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      seen.add(r.int(1, 6));
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('shuffle is a permutation', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(mulberry32(1).shuffle(items).sort()).toEqual(items);
  });

  it('hashSeed is stable and order-sensitive', () => {
    expect(hashSeed('dev', 1, 2)).toBe(hashSeed('dev', 1, 2));
    expect(hashSeed('dev', 1, 2)).not.toBe(hashSeed('dev', 2, 1));
  });
});
