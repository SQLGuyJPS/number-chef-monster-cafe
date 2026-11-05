import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { cspPlugin } from './scripts/vite-csp-plugin';
import { APP_NAME, APP_SHORT_NAME, THEME_COLOR, BACKGROUND_COLOR } from './src/app/identity';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'nogit';
  }
}

export default defineConfig({
  // Pages project site lives under /<repo>/ and has no SPA rewrite (SPEC §15).
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(`${pkg.version}+${gitSha()}`),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    target: 'es2020',
    // Font subsets must stay files: a data: font would be blocked by the CSP's font-src fallback (D37).
    assetsInlineLimit: 0,
  },
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      registerType: 'prompt',
      // The default inline registration script would violate the CSP (D58).
      injectRegister: null,
      manifest: {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'landscape',
        background_color: BACKGROUND_COLOR,
        theme_color: THEME_COLOR,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Shared github.io origin: every cache name carries the ncmc prefix (SPEC §11.5).
        cacheId: 'ncmc',
        globPatterns: ['**/*.{js,css,html,woff2,woff,png,svg,json,webmanifest}'],
        navigateFallback: 'index.html',
        clientsClaim: true,
        skipWaiting: false,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { host: true },
});
