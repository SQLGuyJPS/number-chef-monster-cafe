import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DEFAULT_PROFILE, IDB_VERSION, STORE_NAMES, type StoreName } from './names';
import type { Evt } from '../engine/events';
import type { Commit, KeyedRow, MetaKey, MetaRecord, Snapshot, Storage } from './types';

const RESUME_KEY = 'current';
const STATE_KEY = 'derived';
const SNAPSHOT_ID = 'latest';

/** Events are stored with the profile column (D9); it is not part of the event shape, so strip it. */
function stripProfile(row: Evt & { profileId?: string }): Evt {
  const { profileId: _p, ...e } = row;
  return e as Evt;
}

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
  async loadEvents(): Promise<Evt[]> {
    // The `t` index returns rows by time, then by primary key: replay order (SPEC §11.2).
    const rows = (await this.db.getAllFromIndex('events', 't')) as (Evt & { profileId?: string })[];
    return rows.map(stripProfile);
  }
  countEvents(): Promise<number> {
    return this.db.count('events');
  }
  /**
   * Every put is issued synchronously on one transaction and only `tx.done` is awaited: awaiting
   * anything else inside it lets Safari auto-commit half the work (SPEC §11.3).
   */
  async commit(c: Commit): Promise<void> {
    const tx = this.db.transaction(['events', 'resume', 'state'], 'readwrite');
    const events = tx.objectStore('events');
    for (const e of c.events ?? []) void events.put({ ...e, profileId: DEFAULT_PROFILE });
    if (c.resume === null) void tx.objectStore('resume').delete(RESUME_KEY);
    else if (c.resume !== undefined)
      void tx.objectStore('resume').put({ key: RESUME_KEY, value: c.resume, profileId: DEFAULT_PROFILE });
    if (c.state) void tx.objectStore('state').put({ key: STATE_KEY, value: c.state, profileId: DEFAULT_PROFILE });
    await tx.done;
  }
  getResume(): Promise<unknown> {
    return this.getRow('resume', RESUME_KEY);
  }
  getState(): Promise<unknown> {
    return this.getRow('state', STATE_KEY);
  }
  async allSettings(): Promise<Record<string, unknown>> {
    const rows = (await this.db.getAll('settings')) as KeyedRow[];
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }
  async putSnapshot(s: Snapshot): Promise<void> {
    await this.db.put('snapshots', { id: SNAPSHOT_ID, ...s, profileId: DEFAULT_PROFILE });
  }
  async getSnapshot(): Promise<Snapshot | undefined> {
    const row = (await this.db.get('snapshots', SNAPSHOT_ID)) as (Snapshot & { id?: string; profileId?: string }) | undefined;
    if (!row) return undefined;
    const { id: _i, profileId: _p, ...s } = row;
    return s;
  }
  close(): void {
    this.db.close();
  }
}
