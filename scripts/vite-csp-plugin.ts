import type { Plugin } from 'vite';

// SPEC §2: inline styles are needed for React style props; nothing else may leave 'self'.
export const CSP =
  "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; worker-src 'self'";

/**
 * Emits the CSP meta tag in production builds only: the React plugin's inline dev
 * preamble would violate it under `vite dev` (D37).
 */
export function cspPlugin(): Plugin {
  return {
    name: 'ncmc-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler() {
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ];
      },
    },
  };
}
