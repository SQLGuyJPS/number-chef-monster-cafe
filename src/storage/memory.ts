import { STORE_NAMES, type StoreName } from './names';
import type { Evt } from '../engine/events';
import type { Commit, MetaKey, MetaRecord, Snapshot, Storage } from './types';

/** Rows are copied in and out, as IndexedDB's structured clone would, so callers never share objects. */
const clone = <T>(v: T): T => (v === undefined ? v : (structuredClone(v) as T));

/** In-memory fallback when IndexedDB cannot open (private mode, old WebKit; SPEC §11.3). */
export class MemoryStorage implements Storage {
  readonly kind = 'memory' as const;
  private stores = new Map<StoreName, Map<string, unknown>>(
    STORE_NAMES.map((n) => [n, new Map<string, unknown>()]),
  );

  private store(n: StoreName): Map<string, unknown> {
    return this.stores.get(n)!;
  }

  async getMeta<K extends MetaKey>(key: K): Promise<MetaRecord[K] | undefined> {
    return this.store('meta').get(key) as MetaRecord[K] | undefined;
  }
  async setMeta<K extends MetaKey>(key: K, value: MetaRecord[K]): Promise<void> {
    this.store('meta').set(key, value);
  }
  async getSetting<T>(key: string): Promise<T | undefined> {
    return this.store('settings').get(key) as T | undefined;
  }
  async setSetting(key: string, value: unknown): Promise<void> {
    this.store('settings').set(key, value);
  }
  async deleteSetting(key: string): Promise<void> {
    this.store('settings').delete(key);
  }
  async counts(): Promise<Record<StoreName, number>> {
    return Object.fromEntries(STORE_NAMES.map((n) => [n, this.store(n).size])) as Record<
      StoreName,
      number
    >;
  }
  async loadEvents(): Promise<Evt[]> {
    return [...this.store('events').values()]
      .map((e) => clone(e as Evt))
      .sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }
  async countEvents(): Promise<number> {
    return this.store('events').size;
  }
  async commit(c: Commit): Promise<void> {
    for (const e of c.events ?? []) this.store('events').set(e.id, clone(e));
    if (c.resume === null) this.store('resume').delete('current');
    else if (c.resume !== undefined) this.store('resume').set('current', clone(c.resume));
    if (c.state) this.store('state').set('derived', clone(c.state));
  }
  async getResume(): Promise<unknown> {
    return clone(this.store('resume').get('current'));
  }
  async getState(): Promise<unknown> {
    return clone(this.store('state').get('derived'));
  }
  async allSettings(): Promise<Record<string, unknown>> {
    return clone(Object.fromEntries(this.store('settings')));
  }
  async putSnapshot(s: Snapshot): Promise<void> {
    this.store('snapshots').set('latest', clone(s));
  }
  async getSnapshot(): Promise<Snapshot | undefined> {
    return clone(this.store('snapshots').get('latest') as Snapshot | undefined);
  }
  close(): void {}
}
