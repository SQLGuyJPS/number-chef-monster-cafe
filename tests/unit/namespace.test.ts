import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as names from '../../src/storage/names';

// SPEC §11.5, D18: the app shares a github.io origin with other apps, so every persistent name
// is ncmc-prefixed and cleanup code may only touch ncmc* names.

const repo = fileURLToPath(new URL('../../', import.meta.url));

/** Identifiers from names.ts that are allowed as the first argument of a storage call. */
const ALLOWED_IDENTIFIERS = new Set(['DB_NAME', 'CACHE_ID', 'NAME_PREFIX']);

const CALL_RE =
  /(?<![\w$])(caches\.delete|indexedDB\.deleteDatabase|openDB|(?:localStorage|sessionStorage)\.(?:setItem|getItem|removeItem)|new\s+BroadcastChannel)\s*\(\s*([^,)]*)/g;
const CLEAR_RE = /\b(?:localStorage|sessionStorage)\s*\.\s*clear\b/;

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

interface Violation {
  call: string;
  arg: string;
}

/** Returns storage call sites whose first argument is neither an ncmc literal nor a names.ts constant. */
export function findNameViolations(source: string): Violation[] {
  const out: Violation[] = [];
  for (const m of stripComments(source).matchAll(CALL_RE)) {
    const call = m[1]!;
    const arg = m[2]!.trim();
    const literalOk = /^['"`]ncmc/.test(arg);
    const identOk = ALLOWED_IDENTIFIERS.has(arg) || /^names\.(DB_NAME|CACHE_ID|NAME_PREFIX)$/.test(arg);
    if (!literalOk && !identOk) out.push({ call, arg });
  }
  return out;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry)) files.push(p);
  }
  return files;
}

const srcFiles = walk(join(repo, 'src'));

describe('namespace hygiene (SPEC §11.5, D18)', () => {
  it('finds source files to scan', () => {
    expect(srcFiles.length).toBeGreaterThan(5);
  });

  it('every name constant in names.ts starts with ncmc', () => {
    expect(names.DB_NAME.startsWith('ncmc')).toBe(true);
    expect(names.CACHE_ID.startsWith('ncmc')).toBe(true);
    expect(names.NAME_PREFIX.startsWith('ncmc')).toBe(true);
  });

  it('vite.config.ts sets the workbox cacheId to ncmc', () => {
    const cfg = readFileSync(join(repo, 'vite.config.ts'), 'utf8');
    expect(cfg).toContain("cacheId: 'ncmc'");
    expect(names.CACHE_ID).toBe('ncmc');
  });

  it('all storage call sites in src use ncmc-prefixed names or names.ts constants', () => {
    const bad: string[] = [];
    for (const f of srcFiles) {
      for (const v of findNameViolations(readFileSync(f, 'utf8'))) {
        bad.push(`${relative(repo, f)}: ${v.call}(${v.arg})`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('src never calls localStorage.clear / sessionStorage.clear', () => {
    const bad = srcFiles
      .filter((f) => CLEAR_RE.test(stripComments(readFileSync(f, 'utf8'))))
      .map((f) => relative(repo, f));
    expect(bad).toEqual([]);
  });

  describe('matcher self-test', () => {
    it('flags unprefixed or computed names', () => {
      const samples = [
        "caches.delete('workbox-precache')",
        "indexedDB.deleteDatabase('other-app')",
        "openDB('mydb', 1)",
        'openDB(name, 1)',
        "localStorage.setItem('volume', '1')",
        "window.localStorage.getItem('x')",
        "sessionStorage.removeItem(key)",
        "new BroadcastChannel('chan')",
        'caches.delete(k)',
      ];
      for (const s of samples) {
        expect(findNameViolations(s), s).toHaveLength(1);
      }
    });

    it('accepts ncmc literals and names.ts constants', () => {
      const samples = [
        "caches.delete('ncmc-precache')",
        'indexedDB.deleteDatabase(DB_NAME)',
        'await openDB(DB_NAME, IDB_VERSION, {})',
        'caches.delete(CACHE_ID)',
        "localStorage.setItem('ncmc.debug', '1')",
        'localStorage.getItem(`ncmc.${k}`)',
        "new BroadcastChannel('ncmc-sync')",
        'localStorage.removeItem(NAME_PREFIX)',
      ];
      for (const s of samples) {
        expect(findNameViolations(s), s).toEqual([]);
      }
    });

    it('ignores imports and commented-out code', () => {
      expect(findNameViolations("import { openDB } from 'idb';")).toEqual([]);
      expect(findNameViolations("// caches.delete('x')")).toEqual([]);
      expect(findNameViolations("/* openDB('x') */")).toEqual([]);
    });

    it('catches clear() via the clear regex', () => {
      expect(CLEAR_RE.test('localStorage.clear()')).toBe(true);
      expect(CLEAR_RE.test('window.sessionStorage.clear()')).toBe(true);
      expect(CLEAR_RE.test("localStorage.removeItem('ncmc.x')")).toBe(false);
    });
  });
});
