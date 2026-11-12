// Query flags are read once at boot (SPEC §2.2); the app has no path routing (SPEC §15).
export interface BootFlags {
  debug: boolean;
  allowRotate: boolean;
  /** `?gallery`: the monster sheet (all expressions), for review and the M2 screenshot grid. */
  gallery: boolean;
  /** `?speedtest` (D112): the device speed test; `?speedtest=quick` runs a short version. */
  speedtest: false | 'full' | 'quick';
  /** `?mock`: the over-the-counter layout mock (look only, owner review before M3a). */
  mock: boolean;
}

export function parseFlags(search: string): BootFlags {
  const q = new URLSearchParams(search);
  const st = q.get('speedtest');
  return {
    debug: q.has('debug'),
    allowRotate: q.get('rotate') !== 'off',
    gallery: q.has('gallery'),
    speedtest: st === null ? false : st === 'quick' ? 'quick' : 'full',
    mock: q.has('mock'),
  };
}
