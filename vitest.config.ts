import { defineConfig } from 'vitest/config';

// No Vite plugins on purpose: unit tests must not depend on the PWA/CSP build pipeline.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
  },
});
