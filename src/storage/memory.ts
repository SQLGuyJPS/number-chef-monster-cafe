import { STORE_NAMES, type StoreName } from './names';
import type { MetaKey, MetaRecord, Storage } from './types';

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
  close(): void {}
}
