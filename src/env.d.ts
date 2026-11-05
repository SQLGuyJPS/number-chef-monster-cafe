/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  /** '1' only in the e2e build (CLAUDE.md): exposes window.__ncmc. */
  readonly VITE_E2E?: string;
}
