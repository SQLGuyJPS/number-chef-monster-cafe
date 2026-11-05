// Query flags are read once at boot (SPEC §2.2); the app has no path routing (SPEC §15).
export interface BootFlags {
  debug: boolean;
  allowRotate: boolean;
}

export function parseFlags(search: string): BootFlags {
  const q = new URLSearchParams(search);
  return { debug: q.has('debug'), allowRotate: q.get('rotate') !== 'off' };
}
