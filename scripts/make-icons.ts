// Rasterizes the placeholder monster into the PWA icons with the Playwright Chromium already
// installed for e2e (PLAN §4 M0 step 8; no `sharp`, D59). Output is committed under public/icons.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { placeholderMonsterSvg } from '../src/art/monsterSvg';
import { BACKGROUND_COLOR } from '../src/app/identity';

const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url));

interface IconJob {
  file: string;
  size: number;
  /** Fraction of the canvas the monster fills; maskable icons keep it inside the 80% safe zone. */
  fill: number;
  background: string | null;
}

const jobs: IconJob[] = [
  { file: 'icon-192.png', size: 192, fill: 0.92, background: BACKGROUND_COLOR },
  { file: 'icon-512.png', size: 512, fill: 0.92, background: BACKGROUND_COLOR },
  { file: 'icon-maskable-512.png', size: 512, fill: 0.68, background: BACKGROUND_COLOR },
  // iOS draws its own rounded mask and shows transparency as black, so it gets a full background.
  { file: 'apple-touch-icon-180.png', size: 180, fill: 0.86, background: BACKGROUND_COLOR },
];

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const job of jobs) {
      const inner = Math.round(job.size * job.fill);
      await page.setViewportSize({ width: job.size, height: job.size });
      await page.setContent(
        `<html><body style="margin:0;width:${job.size}px;height:${job.size}px;display:grid;place-items:center;background:${job.background ?? 'transparent'}">${placeholderMonsterSvg({ size: inner })}</body></html>`,
      );
      await page.screenshot({ path: outDir + job.file, omitBackground: job.background === null });
      console.log(`wrote public/icons/${job.file}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
