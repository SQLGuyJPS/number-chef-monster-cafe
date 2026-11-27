import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

// Guards the lint rules that enforce SPEC §2.1 / §2.2 / §11.5 so a config edit cannot silently
// weaken them. Files need not exist: lintText only needs the path to pick the config block.

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd: repoRoot });
}, 60_000);

async function rules(code: string, rel: string): Promise<string[]> {
  const [res] = await eslint.lintText(code, { filePath: join(repoRoot, rel) });
  return res!.messages.filter((m) => m.severity === 2).map((m) => m.ruleId ?? 'parse-error');
}

const T = 60_000;

describe('ESLint guard rails', () => {
  it('forbids localStorage.clear in src, tests and scripts', { timeout: T }, async () => {
    for (const f of ['src/app/x.ts', 'tests/unit/x.test.ts', 'scripts/x.ts']) {
      expect(await rules('localStorage.clear();\n', f), f).toContain('no-restricted-properties');
    }
    expect(await rules('sessionStorage.clear();\n', 'src/app/x.ts')).toContain(
      'no-restricted-properties',
    );
  });

  it('forbids raw clientX outside src/game/input', { timeout: T }, async () => {
    const code = 'export const f = (e: PointerEvent) => e.clientX;\n';
    expect(await rules(code, 'src/app/x.ts')).toContain('no-restricted-properties');
    expect(await rules(code, 'src/game/input/x.ts')).toEqual([]);
  });

  it('engine: no React imports', { timeout: T }, async () => {
    const out = await rules("import React from 'react';\nexport const x = React;\n", 'src/engine/x.ts');
    expect(out).toContain('no-restricted-imports');
  });

  it('engine: no Math.random / Date.now / new Date()', { timeout: T }, async () => {
    expect(await rules('export const r = Math.random();\n', 'src/engine/x.ts')).toContain(
      'no-restricted-properties',
    );
    expect(await rules('export const r = Date.now();\n', 'src/engine/x.ts')).toContain(
      'no-restricted-properties',
    );
    expect(await rules('export const r = new Date();\n', 'src/engine/x.ts')).toContain(
      'no-restricted-syntax',
    );
  });

  it('engine: no window / document globals', { timeout: T }, async () => {
    expect(await rules('export const a = window.foo;\n', 'src/engine/x.ts')).toContain(
      'no-restricted-globals',
    );
    expect(await rules('export const a = document.body;\n', 'src/engine/x.ts')).toContain(
      'no-restricted-globals',
    );
  });

  it('engine: a pure function file is clean', { timeout: T }, async () => {
    const code = 'export function add(a: number, b: number): number {\n  return a + b;\n}\n';
    expect(await rules(code, 'src/engine/x.ts')).toEqual([]);
  });
});
