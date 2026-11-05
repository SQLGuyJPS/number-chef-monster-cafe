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

/**
 * All storage access goes through this interface (CLAUDE.md). M0 ships the skeleton: meta,
 * per-device settings and store counts. Events, resume, clock and snapshots arrive in M3a/M3b.
 */
export interface Storage {
  readonly kind: 'idb' | 'memory';
  getMeta<K extends MetaKey>(key: K): Promise<MetaRecord[K] | undefined>;
  setMeta<K extends MetaKey>(key: K, value: MetaRecord[K]): Promise<void>;
  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;
  deleteSetting(key: string): Promise<void>;
  counts(): Promise<Record<StoreName, number>>;
  close(): void;
}

export interface KeyedRow {
  key: string;
  value: unknown;
  profileId: string;
}
