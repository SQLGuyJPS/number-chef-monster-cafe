import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DEFAULT_PROFILE, IDB_VERSION, STORE_NAMES, type StoreName } from './names';
import type { KeyedRow, MetaKey, MetaRecord, Storage } from './types';

type Db = IDBPDatabase<unknown>;

/** Creates every store up front (M0 skeleton) so later milestones never need a structural upgrade for them. */
function upgrade(db: Db): void {
  const has = (n: string) => db.objectStoreNames.contains(n);
  if (!has('meta')) db.createObjectStore('meta', { keyPath: 'key' });
  if (!has('events')) db.createObjectStore('events', { keyPath: 'id' }).createIndex('t', 't');
  if (!has('state')) db.createObjectStore('state', { keyPath: 'key' });
  if (!has('settings')) db.createObjectStore('settings', { keyPath: 'key' });
  if (!has('clock')) db.createObjectStore('clock', { keyPath: 'key' });
  if (!has('resume')) db.createObjectStore('resume', { keyPath: 'key' });
  if (!has('snapshots')) db.createObjectStore('snapshots', { keyPath: 'id' });
}

export class IdbStorage implements Storage {
  readonly kind = 'idb' as const;
  private constructor(private readonly db: Db) {}

  static async open(): Promise<IdbStorage> {
    const db = await openDB(DB_NAME, IDB_VERSION, {
      upgrade: (d) => upgrade(d as Db),
    });
    return new IdbStorage(db as Db);
  }

  private async getRow(store: StoreName, key: string): Promise<unknown> {
    const row = (await this.db.get(store, key)) as KeyedRow | undefined;
    return row?.value;
  }
  private async putRow(store: StoreName, key: string, value: unknown): Promise<void> {
    const row: KeyedRow = { key, value, profileId: DEFAULT_PROFILE };
    await this.db.put(store, row);
  }

  async getMeta<K extends MetaKey>(key: K): Promise<MetaRecord[K] | undefined> {
    return (await this.getRow('meta', key)) as MetaRecord[K] | undefined;
  }
  setMeta<K extends MetaKey>(key: K, value: MetaRecord[K]): Promise<void> {
    return this.putRow('meta', key, value);
  }
  async getSetting<T>(key: string): Promise<T | undefined> {
    return (await this.getRow('settings', key)) as T | undefined;
  }
  setSetting(key: string, value: unknown): Promise<void> {
    return this.putRow('settings', key, value);
  }
  async deleteSetting(key: string): Promise<void> {
    await this.db.delete('settings', key);
  }
  async counts(): Promise<Record<StoreName, number>> {
    const entries = await Promise.all(
      STORE_NAMES.map(async (n) => [n, await this.db.count(n)] as const),
    );
    return Object.fromEntries(entries) as Record<StoreName, number>;
  }
  close(): void {
    this.db.close();
  }
}
