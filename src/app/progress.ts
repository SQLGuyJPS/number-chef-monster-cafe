// The app's progress: the event log on disk, its derived state in memory (SPEC §11.1–§11.3). The
// in-memory derived state is the read source; every write updates it first, synchronously, so the
// coin jar and the next service never wait for IndexedDB, then goes to disk in order.
import { useSyncExternalStore } from 'react';
import {
  buyEvent,
  coinAdjustEvent,
  crateEvent,
  equipEvent,
  skillConfigEvent,
  type Evt,
} from '../engine/events';
import type { DecorSlot } from '../engine/economy';
import { canBuy, crateEntries, dueCrate, entryOf, equippedKey, forcedCrate, isOwned } from '../engine/shop';
import {
  applyEvent,
  coinAdjustTo,
  emptyDerived,
  inOrder,
  DERIVED_SHAPE,
  replay,
  type Derived,
} from '../engine/replay';
import { parseResume, type ResumeSnapshot } from '../engine/resume';
import type { Ops, SkillId, Stage } from '../engine/types';
import { newId } from '../storage/ids';
import type { StorageBoot } from '../storage/open';
import type { Storage } from '../storage/types';
import { DEBUG_SKILL_CONFIG_KEY, sanitize } from './skillConfig';

export interface ProgressDeps {
  now(): number;
  newId(): string;
}

const browserDeps: ProgressDeps = { now: () => Date.now(), newId: () => newId() };

function isDerived(v: unknown): v is Derived {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return d['shape'] === DERIVED_SHAPE && typeof d['count'] === 'number' && typeof d['facts'] === 'object' && typeof d['ends'] === 'object';
}

export class Progress {
  private d: Derived = emptyDerived();
  /** An event arrived out of (t, id) order (device clock set back): the cache is left to rebuild. */
  private stale = false;
  private chain: Promise<void> = Promise.resolve();
  private listeners = new Set<() => void>();
  /** The last write that failed, for the grown-ups' screen; play goes on from memory. */
  writeError: string | null = null;

  private constructor(
    readonly storage: Storage,
    readonly deviceId: string,
    private readonly deps: ProgressDeps,
  ) {}

  /**
   * Boot (SPEC §11.3): use the `state` cache when it covers exactly the stored events; otherwise
   * replay the log and rewrite the cache. Then turn the pre-M3a playtest picker into events.
   */
  static async load(storage: Storage, deviceId: string, deps: ProgressDeps = browserDeps): Promise<Progress> {
    const p = new Progress(storage, deviceId, deps);
    const [cache, count] = await Promise.all([storage.getState(), storage.countEvents()]);
    const c = cache as { throughEventCount?: unknown; derived?: unknown } | undefined;
    if (c && c.throughEventCount === count && isDerived(c.derived) && c.derived.count === count) {
      p.d = c.derived;
    } else {
      p.d = replay(await storage.loadEvents());
      await storage.commit({ state: { throughEventCount: p.d.count, derived: p.d } });
    }
    await p.adoptDebugConfig();
    return p;
  }

  /**
   * Before M3a the playtest picker kept stage and operations in a per-device setting (D52). They
   * become `skillConfig` events once, so the owner's playtest settings carry over, and the
   * setting is deleted (D125).
   */
  private async adoptDebugConfig(): Promise<void> {
    const raw = await this.storage.getSetting(DEBUG_SKILL_CONFIG_KEY);
    if (raw === undefined) return;
    const old = sanitize(raw);
    const ctx = this.ctx();
    const events = (Object.entries(old) as [SkillId, { stage: Stage; ops: Ops }][])
      .filter(([skill]) => this.d.config[skill] === undefined)
      .map(([skill, c]) => skillConfigEvent(ctx, { skill, ...c }));
    if (events.length > 0) this.append(events);
    await this.flush();
    await this.storage.deleteSetting(DEBUG_SKILL_CONFIG_KEY);
  }

  ctx() {
    return { id: this.deps.newId, now: this.deps.now, dev: this.deviceId };
  }

  get derived(): Derived {
    return this.d;
  }

  subscribe = (f: () => void): (() => void) => {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  };
  getDerived = (): Derived => this.d;

  /**
   * Appends events (and optionally sets or clears the resume row) in one transaction (SPEC §11.3:
   * one per completed problem). Memory first, so what the child sees is what is kept.
   */
  append(events: readonly Evt[], resume?: ResumeSnapshot | null): void {
    let d = this.d;
    for (const e of events) {
      if (!inOrder(d, e)) this.stale = true;
      d = applyEvent(d, e);
    }
    this.d = d;
    if (events.length > 0) this.listeners.forEach((f) => f());
    const state = this.stale ? undefined : { throughEventCount: d.count, derived: d };
    this.write({ events, ...(resume !== undefined ? { resume } : {}), ...(state ? { state } : {}) });
  }

  setResume(resume: ResumeSnapshot | null): void {
    this.write({ resume });
  }

  async getResume(): Promise<ResumeSnapshot | null> {
    await this.flush();
    return parseResume(await this.storage.getResume());
  }

  setSkillConfig(skill: SkillId, stage: Stage, ops: Ops): void {
    this.append([skillConfigEvent(this.ctx(), { skill, stage, ops })]);
  }

  /**
   * A confirmed purchase (SPEC §10): `buy` and `equip` in one transaction, only if the engine says
   * it may be bought, so a double tap or an old screen can never charge twice or go below zero.
   */
  buy(key: string): boolean {
    const e = entryOf(key);
    if (!e || canBuy(this.d, key) !== 'ok') return false;
    const ctx = this.ctx();
    this.append([
      buyEvent(ctx, { item: key, price: e.price }),
      equipEvent(ctx, { slot: e.slot, items: [key] }),
    ]);
    return true;
  }

  /** Re-equips an owned entry, free (SPEC §10); nothing is written if it is already on. */
  equip(slot: DecorSlot, key: string): void {
    if (!isOwned(this.d, key) || entryOf(key)?.slot !== slot) return;
    if (equippedKey(this.d, slot) === key) return;
    this.append([equipEvent(this.ctx(), { slot, items: [key] })]);
  }

  /** On opening the shop: records at most one due crate (D154) and returns its number. */
  deliverCrate(): number | null {
    const c = dueCrate(this.d);
    if (!c) return null;
    this.append([crateEvent(this.ctx(), c)]);
    return c.n;
  }

  /** Playtest (D179): sets the jar to `target` coins with one `coinAdjust`; nothing if it already shows it. */
  setCoins(target: number): void {
    const n = coinAdjustTo(this.d, target);
    if (n !== 0) this.append([coinAdjustEvent(this.ctx(), { n })]);
  }

  /** Playtest (D180): records the next crate now, skipping the wait and the hold. */
  forceCrate(): number | null {
    const c = forcedCrate(this.d);
    if (!c) return null;
    this.append([crateEvent(this.ctx(), c)]);
    return c.n;
  }

  /** Playtest (D180): records every crate left in one transaction; returns the entries they brought. */
  deliverAllCrates(): string[] {
    let d = this.d;
    const events: Evt[] = [];
    const keys: string[] = [];
    const ctx = this.ctx();
    for (let c = forcedCrate(d); c; c = forcedCrate(d)) {
      const e = crateEvent(ctx, c);
      events.push(e);
      keys.push(...crateEntries(c.n));
      d = applyEvent(d, e);
    }
    this.append(events);
    return keys;
  }

  /** Resolves once every queued write has reached storage. */
  flush(): Promise<void> {
    return this.chain;
  }

  private write(c: Parameters<Storage['commit']>[0]): void {
    this.chain = this.chain
      .then(() => this.storage.commit(c))
      .then(
        () => {
          this.writeError = null;
        },
        (e: unknown) => {
          this.writeError = e instanceof Error ? e.message : String(e);
        },
      );
  }
}

// ---------- app-wide instance ----------

let current: Promise<Progress> | null = null;
let loaded: Progress | null = null;
const readyListeners = new Set<() => void>();

export function startProgress(boot: Promise<StorageBoot>): Promise<Progress> {
  current = boot.then((b) => Progress.load(b.storage, b.deviceId));
  void current.then((p) => {
    loaded = p;
    readyListeners.forEach((f) => f());
  });
  return current;
}
export const getProgress = (): Promise<Progress> | null => current;
export const loadedProgress = (): Progress | null => loaded;

const subscribeReady = (f: () => void) => {
  readyListeners.add(f);
  return () => readyListeners.delete(f);
};
const noop = () => () => undefined;
const EMPTY = emptyDerived();

/** The derived state for React; empty until the log has loaded. */
export function useDerived(): Derived {
  const p = useSyncExternalStore(subscribeReady, loadedProgress);
  return useSyncExternalStore(p ? p.subscribe : noop, p ? p.getDerived : () => EMPTY);
}
