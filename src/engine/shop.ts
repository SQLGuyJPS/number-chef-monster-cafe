// The coin shop's rules over the event log (SPEC §10, §10.1, §11.2): what is owned, what is on the
// shelf, what each slot shows, and when a delivery crate is due. Pure reads of `Derived`; the UI
// writes the events these functions call for and never decides any of it itself.
import {
  CRATE_EVERY_MONSTERS,
  CRATE_HOLD_AT_UNBOUGHT,
  CRATE_SIZE,
  expandCatalog,
  interleave,
  M4_ITEMS,
  EARLY_CRATES,
  STARTER_SHELF,
  type DecorSlot,
  type ShopEntry,
} from './economy';
import { balance, servedMonsters, type Derived } from './replay';

/** The six M4 slots in tab order (SPEC §10); Staff & pets joins in M18 (D157). */
export const DECOR_SLOTS: readonly DecorSlot[] = [
  'wallpaper',
  'floor',
  'lights',
  'window',
  'counter',
  'wallArt',
];

/** Every M4 entry, free ones included, in catalog order. */
export const CATALOG: readonly ShopEntry[] = expandCatalog(M4_ITEMS);
const BY_KEY = new Map(CATALOG.map((e) => [e.key, e]));
export const entryOf = (key: string): ShopEntry | undefined => BY_KEY.get(key);

/** A slot's free default (SPEC §10): the first colorway of its free item. */
export function freeDefault(slot: DecorSlot): ShopEntry {
  const e = CATALOG.find((x) => x.slot === slot && x.price === 0);
  if (!e) throw new Error(`slot ${slot} has no free default`);
  return e;
}

const STARTER = new Set(STARTER_SHELF);

const EARLY = new Set(EARLY_CRATES);

/**
 * The fixed crate order (D154, D182): the early crates first, then every other paid entry not on
 * the starter shelf, in catalog order, round-robin across items. Crate n holds entries 2n−1 and
 * 2n. Later updates append here.
 */
export const CRATE_QUEUE: readonly string[] = [
  ...EARLY_CRATES,
  ...interleave(CATALOG.filter((e) => e.price > 0 && !STARTER.has(e.key) && !EARLY.has(e.key))).map(
    (e) => e.key,
  ),
];

/** The entries delivered by crate `n` (1-based). */
export const crateEntries = (n: number): string[] =>
  CRATE_QUEUE.slice((n - 1) * CRATE_SIZE, n * CRATE_SIZE);

export const isOwned = (d: Derived, key: string): boolean =>
  key in d.bought || entryOf(key)?.price === 0;

/** Delivered crate numbers, ascending (distinct `crate.n`). */
export const deliveredCrates = (d: Derived): number[] =>
  Object.keys(d.crates)
    .map(Number)
    .sort((a, b) => a - b);

/**
 * Keys on the shelf, in catalog order: the free defaults, the starter shelf, everything a
 * delivered crate brought, and anything owned (a purchase merged in from another device).
 */
export function shelfKeys(d: Derived): string[] {
  const on = new Set<string>(STARTER);
  for (const n of deliveredCrates(d)) for (const k of crateEntries(n)) on.add(k);
  return CATALOG.filter((e) => e.price === 0 || on.has(e.key) || e.key in d.bought).map(
    (e) => e.key,
  );
}

/** Paid entries on the shelf not yet bought: the hold counts these (CRATE_HOLD_AT_UNBOUGHT). */
export const unboughtOnShelf = (d: Derived): string[] =>
  shelfKeys(d).filter((k) => !isOwned(d, k));

/**
 * The crate to record on this shop visit, or null (SPEC §11.2, D154): one per visit, if queued
 * entries remain, the monsters served have reached the due point (the first crate is due at
 * once), and fewer than 6 unbought entries are on the shelf. The very first crate skips the hold
 * (D176), so the delivery moment is part of her first shop visit, not ~450 coins later. `next` keeps the pace at 30 monsters
 * from the due point, but never in the past, so a backlog arrives one visit at a time.
 */
export function dueCrate(d: Derived): { n: number; next: number } | null {
  const done = deliveredCrates(d);
  const last = done.length > 0 ? done[done.length - 1]! : 0;
  const n = last + 1;
  if (crateEntries(n).length === 0) return null;
  const due = last === 0 ? 0 : d.crates[last]!;
  const served = servedMonsters(d);
  if (served < due) return null;
  if (last > 0 && unboughtOnShelf(d).length >= CRATE_HOLD_AT_UNBOUGHT) return null;
  return { n, next: Math.max(due + CRATE_EVERY_MONSTERS, served + 1) };
}

/**
 * A crate the parent sent from the playtest tools (D180): the next one in the queue, skipping the
 * 30-monster wait and the hold, with the pace restarted from now (`next` = served + 30). Null once
 * the queue is empty.
 */
export function forcedCrate(d: Derived): { n: number; next: number } | null {
  const done = deliveredCrates(d);
  const n = (done.length > 0 ? done[done.length - 1]! : 0) + 1;
  if (crateEntries(n).length === 0) return null;
  return { n, next: servedMonsters(d) + CRATE_EVERY_MONSTERS };
}

/** Crates left in the queue after those delivered (D180, the playtest tools' status line). */
export const cratesLeft = (d: Derived): number => {
  const done = deliveredCrates(d);
  const last = done.length > 0 ? done[done.length - 1]! : 0;
  return Math.max(0, Math.ceil(CRATE_QUEUE.length / CRATE_SIZE) - last);
};

/** What a slot shows: its latest `equip` if that entry is owned, else the free default. */
export function equippedKey(d: Derived, slot: DecorSlot): string {
  const k = d.equipped[slot]?.[0];
  return k !== undefined && entryOf(k)?.slot === slot && isOwned(d, k) ? k : freeDefault(slot).key;
}

export type BuyCheck = 'ok' | 'owned' | 'short' | 'unknown';

/** Whether a purchase may be written: never twice, never below the price (SPEC §10). */
export function canBuy(d: Derived, key: string): BuyCheck {
  const e = entryOf(key);
  if (!e) return 'unknown';
  if (isOwned(d, key)) return 'owned';
  return balance(d) >= e.price ? 'ok' : 'short';
}

/** The shelf of one slot grouped by item: one tile per item, its colorways as dots (SPEC §10). */
export interface ShelfItem {
  item: string;
  name: string;
  /** This item's entries on the shelf, in colorway order. */
  entries: ShopEntry[];
}

export function slotShelf(d: Derived, slot: DecorSlot): ShelfItem[] {
  const out: ShelfItem[] = [];
  for (const k of shelfKeys(d)) {
    const e = entryOf(k)!;
    if (e.slot !== slot) continue;
    const last = out[out.length - 1];
    if (last && last.item === e.item) last.entries.push(e);
    else out.push({ item: e.item, name: e.name, entries: [e] });
  }
  return out;
}
