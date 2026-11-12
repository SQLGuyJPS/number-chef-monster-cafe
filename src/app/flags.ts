// Query flags are read once at boot (SPEC §2.2); the app has no path routing (SPEC §15).
export interface BootFlags {
  debug: boolean;
  allowRotate: boolean;
  /** `?gallery`: the monster sheet (all expressions), for review and the M2 screenshot grid. */
  gallery: boolean;
  /** `?mock`: the over-the-counter layout mock (look only, owner review before M3a). */
  mock: boolean;
}

export function parseFlags(search: string): BootFlags {
  const q = new URLSearchParams(search);
  return { debug: q.has('debug'), allowRotate: q.get('rotate') !== 'off', gallery: q.has('gallery'), mock: q.has('mock') };
}
