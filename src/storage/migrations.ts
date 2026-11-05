// Event upcasters (SPEC §11.3). Tier 1 ships schemaVersion 1 with an empty list and its harness
// (D36); the first schema change adds a migration here, bumps SCHEMA_VERSION and adds a fixture test.

export const SCHEMA_VERSION = 1;

export interface Migration {
  from: number;
  to: number;
  upcast(event: unknown): unknown;
}

export const migrations: readonly Migration[] = [];

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
