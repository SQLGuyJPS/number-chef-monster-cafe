// Every persistent name on the shared github.io origin carries the ncmc prefix (SPEC §11.5, D18).
// The namespace unit test checks that storage call sites only use names from this file.
export const NAME_PREFIX = 'ncmc';
export const DB_NAME = 'ncmc-v1';
/** IndexedDB structural version (object stores). Distinct from the event `schemaVersion`. */
export const IDB_VERSION = 1;
export const CACHE_ID = 'ncmc';

export const STORE_NAMES = [
  'meta',
  'events',
  'state',
  'settings',
  'clock',
  'resume',
  'snapshots',
] as const;
export type StoreName = (typeof STORE_NAMES)[number];

/** Reserved for profiles (D9, M11): a store column only, not part of the event shape. */
export const DEFAULT_PROFILE = 'default';
