// Query flags are read once at boot (SPEC §2.2); the app has no path routing (SPEC §15).
export interface BootFlags {
  debug: boolean;
  allowRotate: boolean;
  /** M1 layout mock frame (VITE_E2E builds only, see main.tsx). */
  mock: string | null;
}

export function parseFlags(search: string): BootFlags {
  const q = new URLSearchParams(search);
  return { debug: q.has('debug'), allowRotate: q.get('rotate') !== 'off', mock: q.get('mock') };
}
