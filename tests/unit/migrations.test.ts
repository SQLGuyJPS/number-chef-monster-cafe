import { describe, expect, it } from 'vitest';
import {
  SCHEMA_VERSION,
  UnknownSchemaVersionError,
  migrateEvents,
  migrations,
  validateChain,
  type Migration,
} from '../../src/storage/migrations';

interface Ev {
  n: number;
  tags: string[];
}

const step1: Migration = {
  from: 1,
  to: 2,
  upcast: (e) => ({ ...(e as Ev), tags: [...(e as Ev).tags, 'v2'] }),
};
const step2: Migration = {
  from: 2,
  to: 3,
  upcast: (e) => ({ ...(e as Ev), tags: [...(e as Ev).tags, 'v3'] }),
};
const chain: Migration[] = [step1, step2];

describe('migration harness (D36)', () => {
  it('ships schema 1 with no migrations', () => {
    expect(SCHEMA_VERSION).toBe(1);
    expect(migrations).toHaveLength(0);
    expect(() => validateChain(migrations, SCHEMA_VERSION)).not.toThrow();
  });

  it('is the identity at v1 but returns a new array', () => {
    const input = [{ a: 1 }, { a: 2 }];
    const out = migrateEvents(input, 1);
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
  });

  it('rejects data from a newer schema with UnknownSchemaVersionError', () => {
    expect(() => migrateEvents([], 2)).toThrow(UnknownSchemaVersionError);
    let caught: unknown;
    try {
      migrateEvents([], 5);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(UnknownSchemaVersionError);
    expect((caught as UnknownSchemaVersionError).version).toBe(5);
    expect((caught as UnknownSchemaVersionError).supported).toBe(1);
  });

  it.each([0, 1.5, -1, NaN])('rejects invalid version %s', (v) => {
    expect(() => migrateEvents([], v)).toThrow(/Invalid schema version/);
  });

  it('applies both upcasters in order from v1', () => {
    const out = migrateEvents([{ n: 1, tags: [] }], 1, chain, 3);
    expect(out).toEqual([{ n: 1, tags: ['v2', 'v3'] }]);
  });

  it('applies only the second upcaster from v2', () => {
    const out = migrateEvents([{ n: 1, tags: [] }], 2, chain, 3);
    expect(out).toEqual([{ n: 1, tags: ['v3'] }]);
  });

  it('applies nothing when already at target', () => {
    const out = migrateEvents([{ n: 1, tags: [] }], 3, chain, 3);
    expect(out).toEqual([{ n: 1, tags: [] }]);
  });

  it('does not mutate the input events', () => {
    const input: Ev[] = [{ n: 1, tags: [] }];
    migrateEvents(input, 1, chain, 3);
    expect(input).toEqual([{ n: 1, tags: [] }]);
  });

  describe('validateChain', () => {
    it('accepts a complete chain', () => {
      expect(() => validateChain(chain, 3)).not.toThrow();
    });
    it('rejects gaps', () => {
      expect(() => validateChain([step2], 3)).toThrow(/broken/);
      expect(() => validateChain([step1, { from: 3, to: 4, upcast: (e) => e }], 4)).toThrow(
        /broken/,
      );
    });
    it('rejects steps that skip a version', () => {
      expect(() => validateChain([{ from: 1, to: 3, upcast: (e) => e }], 3)).toThrow(/broken/);
    });
    it('rejects chains not reaching the target', () => {
      expect(() => validateChain([step1], 3)).toThrow(/ends at 2/);
      expect(() => validateChain([], 2)).toThrow(/ends at 1/);
    });
    it('migrateEvents surfaces a bad chain', () => {
      expect(() => migrateEvents([], 1, [step1], 3)).toThrow();
    });
  });
});
