import { defineConfig, devices } from '@playwright/test';

// SPEC §13.5. E2E runs against the production build with VITE_E2E=1 (CLAUDE.md). The full matrix
// from M2: Chromium iPad Pro 11 and Pixel 7 landscape, WebKit iPad gen 7 and iPhone 13 landscape,
// and portrait variants for the rotated stage. Long flows run on the two iPads; the matrix spec
// (m2-matrix) runs on every project, with CDP drag on every Chromium one (D36).
const PORT = 4173;

const chromiumAs = (d: (typeof devices)[string]) => ({
  ...d,
  browserName: 'chromium' as const,
  defaultBrowserType: 'chromium' as const,
});

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}/`,
    hasTouch: true,
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [
    { name: 'chromium-ipad-pro-11', use: chromiumAs(devices['iPad Pro 11 landscape']) },
    { name: 'webkit-ipad-gen7', use: { ...devices['iPad (gen 7) landscape'] } },
    // SPEC §2.2/§13.5 size the phone as an installed (standalone) app: 844×390, not Safari's 750×342.
    {
      name: 'webkit-iphone-13',
      use: { ...devices['iPhone 13 landscape'], viewport: { width: 844, height: 390 } },
    },
    { name: 'chromium-pixel-7', use: chromiumAs(devices['Pixel 7 landscape']) },
    { name: 'chromium-ipad-portrait', use: chromiumAs(devices['iPad Pro 11']) },
    {
      name: 'webkit-iphone-portrait',
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npm run build:e2e && npm run preview:e2e',
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
