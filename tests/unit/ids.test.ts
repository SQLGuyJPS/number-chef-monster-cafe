import { describe, expect, it } from 'vitest';
import { newId } from '../../src/storage/ids';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function fakeCrypto(fill: (u: Uint8Array) => void): Crypto {
  const c = {
    getRandomValues<T extends ArrayBufferView | null>(a: T): T {
      fill(a as unknown as Uint8Array);
      return a;
    },
  };
  // Cast: only getRandomValues is needed by newId (CryptoLike).
  return c as unknown as Crypto;
}

describe('newId', () => {
  it('uses randomUUID when present', () => {
    const c = {
      randomUUID: () => 'fixed-uuid',
      getRandomValues: () => {
        throw new Error('should not be called');
      },
    } as unknown as Crypto;
    expect(newId(c)).toBe('fixed-uuid');
  });

  it('falls back to a v4-format UUID when randomUUID is missing (plain-http LAN)', () => {
    let seed = 7;
    const fake = fakeCrypto((u) => {
      for (let i = 0; i < u.length; i++) {
        seed = (seed * 31 + 17) % 256;
        u[i] = seed;
      }
    });
    expect(newId(fake)).toMatch(V4);
  });

  it('fallback forces version and variant bits for all-0x00 and all-0xff input', () => {
    for (const fill of [0x00, 0xff]) {
      expect(newId(fakeCrypto((u) => u.fill(fill)))).toMatch(V4);
    }
  });

  it('1000 fallback ids are unique with real getRandomValues', () => {
    const real = fakeCrypto((u) => {
      globalThis.crypto.getRandomValues(new Uint8Array(u.buffer as ArrayBuffer, u.byteOffset, u.length));
    });
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const id = newId(real);
      expect(id).toMatch(V4);
      ids.add(id);
    }
    expect(ids.size).toBe(1000);
  });

  it('default crypto yields a UUID-shaped id', () => {
    expect(newId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
