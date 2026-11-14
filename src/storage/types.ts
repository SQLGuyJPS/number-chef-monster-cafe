import type { Evt } from '../engine/events';
import type { Derived } from '../engine/replay';
import type { StoreName } from './names';

export interface MetaRecord {
  schemaVersion: number;
  deviceId: string;
  createdAt: number;
  deviceLabel: string;
  lastBackupAt: number;
  /** First-ever warm-up order shown (D26, M2). */
  warmupShown: boolean;
}
export type MetaKey = keyof MetaRecord;

/** The derived-state cache (SPEC §11.3): valid while `throughEventCount` equals the event count. */
export interface StateCache {
  throughEventCount: number;
  derived: Derived;
}

/** Everything written for one completed problem goes in one transaction (SPEC §11.3). */
export interface Commit {
  events?: readonly Evt[];
  /** A snapshot to store, or `null` to clear it. Left out: unchanged. */
  resume?: unknown;
  state?: StateCache;
}

/**
 * The latest full copy of the data (SPEC §11.3, Tier 1 keeps one), written before a migration and,
 * from M3b, before an import, replace or reset.
 */
export interface Snapshot {
  takenAt: number;
  reason: 'migration' | 'import' | 'replace' | 'reset';
  schemaVersion: number;
  deviceId: string;
  events: Evt[];
  settings: Record<string, unknown>;
}

/**
 * All storage access goes through this interface (CLAUDE.md). The `clock` store is used only from
 * M12 (D124).
 */
export interface Storage {
  readonly kind: 'idb' | 'memory';
  getMeta<K extends MetaKey>(key: K): Promise<MetaRecord[K] | undefined>;
  setMeta<K extends MetaKey>(key: K, value: MetaRecord[K]): Promise<void>;
  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  counts(): Promise<Record<StoreName, number>>;
  /** In replay order: by `t`, then by `id`. */
  loadEvents(): Promise<Evt[]>;
  countEvents(): Promise<number>;
  /** One transaction: append events, set or clear the resume row, update the state cache. */
  commit(c: Commit): Promise<void>;
  getResume(): Promise<unknown>;
  getState(): Promise<unknown>;
  allSettings(): Promise<Record<string, unknown>>;
  putSnapshot(s: Snapshot): Promise<void>;
  getSnapshot(): Promise<Snapshot | undefined>;
  close(): void;
}

export interface KeyedRow {
  key: string;
  value: unknown;
  profileId: string;
}
