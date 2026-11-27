import { describe, expect, it } from 'vitest';
import { REGULARS } from '../../src/engine/monsters';
import { MONSTER_SPECS, REACTIONS, specFor } from '../../src/art/monsters/specs';
import { DRAWINGS } from '../../src/art/monsters/roster';

describe('MonsterSpec roster (SPEC §7.2)', () => {
  it('matches the engine roster: same ids and favourites, in order', () => {
    expect(MONSTER_SPECS.map((s) => [s.id, s.favorites])).toEqual(REGULARS.map((r) => [r.id, [...r.favorites]]));
  });
  it('every spec has a hand-authored drawing and a known reaction', () => {
    for (const s of MONSTER_SPECS) {
      expect(DRAWINGS[s.id]).toBeTypeOf('function');
      expect(s.reactions.length).toBeGreaterThan(0);
      for (const r of s.reactions) expect(REACTIONS).toContain(r);
    }
  });
  it('unknown ids fall back to a drawn monster', () => {
    expect(DRAWINGS[specFor('nobody').id]).toBeTypeOf('function');
  });
});
