import { mkdtempSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, createServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CSP } from '../../scripts/vite-csp-plugin';

// SPEC §2, D37, CLAUDE.md: the production build carries the CSP, has no e2e hooks, no inline
// scripts, a correct manifest, ncmc-prefixed caches, and font files (never data: fonts).

const repo = fileURLToPath(new URL('../../', import.meta.url));
const configFile = join(repo, 'vite.config.ts');
const BUILD_TIMEOUT = 180_000;

let out = '';
const TEXT_EXT = /\.(js|html|css|webmanifest|json|mjs)$/;

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

describe('production build', () => {
  let savedE2E: string | undefined;
  let files: string[] = [];

  beforeAll(async () => {
    savedE2E = process.env.VITE_E2E;
    delete process.env.VITE_E2E;
    out = mkdtempSync(join(tmpdir(), 'ncmc-build-'));
    await build({
      configFile,
      root: repo,
      logLevel: 'silent',
      build: { outDir: out, emptyOutDir: true },
    });
    files = walk(out);
  }, BUILD_TIMEOUT);

  afterAll(() => {
    if (savedE2E !== undefined) process.env.VITE_E2E = savedE2E;
    if (out) rmSync(out, { recursive: true, force: true });
  });

  it('index.html carries the exact CSP meta', () => {
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    expect(html).toContain('http-equiv="Content-Security-Policy"');
    const decoded = html.replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    expect(decoded).toContain(`content="${CSP}"`);
  });

  it('index.html has no inline scripts', () => {
    const html = readFileSync(join(out, 'index.html'), 'utf8');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const [, attrs, body] of scripts) {
      expect(attrs, 'script tag must have src').toMatch(/\bsrc=/);
      expect((body ?? '').trim()).toBe('');
    }
  });

  it('no e2e hook name (__ncmc) leaks into any text file', () => {
    const leaks = files
      .filter((f) => TEXT_EXT.test(f))
      .filter((f) => readFileSync(f, 'utf8').includes('__ncmc'))
      .map((f) => relative(out, f));
    expect(leaks).toEqual([]);
  });

  it('manifest is landscape standalone with relative start_url and scope', () => {
    const p = join(out, 'manifest.webmanifest');
    expect(existsSync(p)).toBe(true);
    const m = JSON.parse(readFileSync(p, 'utf8')) as Record<string, unknown>;
    expect(m.orientation).toBe('landscape');
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('./');
    expect(m.scope).toBe('./');
    // Every icon the manifest and index.html reference is in the build (scripts/make-icons.ts).
    const icons = (m.icons as { src: string }[]).map((i) => i.src);
    for (const src of [...icons, 'icons/apple-touch-icon-180.png']) {
      expect(existsSync(join(out, src)), src).toBe(true);
    }
  });

  it('service worker exists and uses the ncmc cache id', () => {
    const sw = join(out, 'sw.js');
    expect(existsSync(sw)).toBe(true);
    const candidates = files.filter((f) => /(^|[\\/])(sw|workbox-[^\\/]*)\.js$/.test(f));
    expect(candidates.some((f) => readFileSync(f, 'utf8').includes('ncmc'))).toBe(true);
  });

  it('fonts ship as .woff2 files and CSS never inlines them as data URIs', () => {
    expect(files.some((f) => f.endsWith('.woff2'))).toBe(true);
    for (const f of files.filter((p) => p.endsWith('.css'))) {
      const css = readFileSync(f, 'utf8');
      expect(css).not.toMatch(/data:font/);
      expect(css).not.toMatch(/data:application\/font/);
    }
  });
});

describe('dev server', () => {
  it('does not inject the CSP (the React preamble is inline; D37)', async () => {
    const server = await createServer({
      configFile,
      root: repo,
      logLevel: 'silent',
      server: { middlewareMode: true },
    });
    try {
      const html = await server.transformIndexHtml('/', readFileSync(join(repo, 'index.html'), 'utf8'));
      expect(html).not.toContain('Content-Security-Policy');
    } finally {
      await server.close();
    }
  }, 60_000);
});
