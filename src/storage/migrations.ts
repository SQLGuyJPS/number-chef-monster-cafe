// Event upcasters (SPEC §11.3). Tier 1 shipped schemaVersion 1 with an empty list and its harness
// (D36); every schema change adds a migration here, bumps SCHEMA_VERSION and adds a fixture test.

/** 2: the `equip` and `crate` event kinds (M4a, D154). 3: the `coinAdjust` kind (D179). */
export const SCHEMA_VERSION = 3;

export interface Migration {
  from: number;
  to: number;
  upcast(event: unknown): unknown;
}

export const migrations: readonly Migration[] = [
  // v1 → v2 adds two event kinds; no v1 event changes shape, so the upcast is the identity. The
  // version still moves, so an older app refuses a log (or a backup) that may hold crates.
  { from: 1, to: 2, upcast: (e) => e },
  // v2 → v3 adds `coinAdjust` (the parent's playtest coin setting); again no event changes shape.
  { from: 2, to: 3, upcast: (e) => e },
];

export class UnknownSchemaVersionError extends Error {
  constructor(public readonly version: number, public readonly supported: number) {
    super(`Data is from a newer app version (schema ${version}); this app supports up to ${supported}.`);
    this.name = 'UnknownSchemaVersionError';
  }
}

/** Throws if the chain has a gap or does not reach `target`, so a bad list fails in tests, not on a device. */
export function validateChain(list: readonly Migration[], target: number): void {
  let v = 1;
  for (const m of list) {
    if (m.from !== v || m.to !== v + 1) {
      throw new Error(`Migration chain broken at ${m.from}→${m.to} (expected ${v}→${v + 1})`);
    }
    v = m.to;
  }
  if (v !== target) throw new Error(`Migration chain ends at ${v}, schema is ${target}`);
}

export function migrateEvents(
  events: readonly unknown[],
  fromVersion: number,
  list: readonly Migration[] = migrations,
  target: number = SCHEMA_VERSION,
): unknown[] {
  if (!Number.isInteger(fromVersion) || fromVersion < 1) {
    throw new Error(`Invalid schema version ${fromVersion}`);
  }
  if (fromVersion > target) throw new UnknownSchemaVersionError(fromVersion, target);
  validateChain(list, target);
  let out = [...events];
  for (const m of list) {
    if (m.from >= fromVersion) out = out.map((e) => m.upcast(e));
  }
  return out;
}
