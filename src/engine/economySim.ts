// Shop-economy simulator (owner's economy review, 2026-11-21). Plays weeks of sittings with a
// seeded rng and a model child who earns coins as SPEC §9 pays them and spends them in the shop by
// one of three habits. Answers: when is the first purchase, when is the shop bought out, how often
// does a sitting end with something new, and how long are the dry spells. Pure: no clock.
import { COINS_PER_PROBLEM, SERVICE_TIP } from './config';
import type { ShopEntry } from './economy';
import type { Rng } from './rng';

export interface PlayProfile {
  minutesPerWeek: number;
  /** One sitting, uniform in [lo, hi] minutes. */
  sessionMinutes: readonly [number, number];
  /** A full service of `orders` orders, first order to CLOSED, uniform in [lo, hi]. */
  serviceMinutes: readonly [number, number];
  orders: number;
  /** Results tally, menu board and taps between services. */
  betweenServicesMinutes: number;
  /** Time in the shop at the end of a sitting that has something to buy. */
  shopMinutes: number;
  /** Chance of exactly one / exactly two requeues in a service (SPEC §4.1 step 7). */
  requeueOne: number;
  requeueTwo: number;
  /** Chance the child closes the café early: some monsters served, no tip (SPEC §5.8). */
  partialRate: number;
  /** A new service starts only with at least this much of the sitting left. */
  minMinutesToStart: number;
}

export const DEFAULT_PROFILE: PlayProfile = {
  minutesPerWeek: 60,
  sessionMinutes: [15, 20],
  serviceMinutes: [3, 4],
  orders: 6,
  betweenServicesMinutes: 0.5,
  shopMinutes: 1.5,
  requeueOne: 0.2,
  requeueTwo: 0.05,
  partialRate: 0.05,
  minMinutesToStart: 2,
};

/**
 * impulse: buys something random she can afford (at most `maxBuysPerVisit` a sitting).
 * cheapest: buys the cheapest things first, as many as she can (worst case for late dry spells).
 * saver: picks a wish at random and buys it as soon as she can (the wish-item milestone).
 */
export type BuyPolicy = 'impulse' | 'cheapest' | 'saver';

export interface Wave {
  id: string;
  /** The week the update with this content reaches the device. */
  opensWeek: number;
  entries: readonly ShopEntry[];
}

/** New stock arrives in crates of `size` items every `everyMonsters` monsters served. */
export interface CrateRule {
  everyMonsters: number;
  size: number;
  /** Hold a due crate while this many unowned items are already in the shop (no pile-up). */
  holdAtStock?: number;
}

export interface SimInput {
  profile: PlayProfile;
  policy: BuyPolicy;
  maxBuysPerVisit: number;
  /** In the shop from day one (free entries are ignored). */
  starting: readonly ShopEntry[];
  /** Later content. With `crates`, a wave joins the crate queue when it opens (the first crate
   * arrives at once, the rest every N monsters); without, all of it appears when it opens. */
  waves: readonly Wave[];
  crates?: CrateRule;
  weeks: number;
  /** Shop-stock, purchase-share and waiting figures count from this week (default 0). */
  measureFromWeek?: number;
}

export interface WeekStat {
  week: number;
  sessions: number;
  services: number;
  monsters: number;
  coins: number;
  purchases: number;
  minutes: number;
}

export interface SimResult {
  weeks: WeekStat[];
  /** Sitting (1-based) and services played before the first purchase. */
  firstPurchaseSession: number | null;
  firstPurchaseServices: number | null;
  /** Week (fractional, from the sitting's position in its week) when the day-one stock is all owned. */
  startingBoughtOutWeek: number | null;
  /** Week when every entry of every wave is owned (all waves opened and delivered). */
  allBoughtOutWeek: number | null;
  sessions: number;
  /** The rest are counted only until everything is owned, while more content is still to come. */
  activeSessions: number;
  /** Sittings that ended with at least one purchase. */
  purchaseSessions: number;
  /** Longest run of sittings with no purchase while something unowned was in the shop. */
  longestDry: number;
  /** Sittings that ended with nothing in the shop to buy, waiting for a crate or an update. */
  emptyShopSessions: number;
  /** Mean unowned entries in the shop at each visit. */
  meanStock: number;
  coins: number;
  monsters: number;
  totalSpent: number;
}

const uniform = (rng: Rng, [lo, hi]: readonly [number, number]): number =>
  lo + rng.next() * (hi - lo);

/** Round-robin across names so a crate mixes, say, a hat, a skin and a colorway. */
export function interleave(entries: readonly ShopEntry[]): ShopEntry[] {
  const groups = new Map<string, ShopEntry[]>();
  for (const e of entries) {
    const list = groups.get(e.name) ?? [];
    list.push(e);
    groups.set(e.name, list);
  }
  const lists = [...groups.values()];
  const out: ShopEntry[] = [];
  for (let i = 0; out.length < entries.length; i++) {
    for (const list of lists) if (i < list.length) out.push(list[i]!);
  }
  return out;
}

export function simulate(input: SimInput, rng: Rng): SimResult {
  const p = input.profile;
  const shop = new Map<string, ShopEntry>();
  for (const e of input.starting) if (e.price > 0) shop.set(e.key, e);
  const startingKeys = [...shop.keys()];
  const owned = new Set<string>();
  const allKeys = new Set<string>([
    ...startingKeys,
    ...input.waves.flatMap((w) => w.entries.map((e) => e.key)),
  ]);

  let coins = 0;
  let totalSpent = 0;
  let monsters = 0;
  let servicesEver = 0;
  let sessionsEver = 0;
  let activeSessions = 0;
  let purchaseSessions = 0;
  let dry = 0;
  let longestDry = 0;
  let emptyShopSessions = 0;
  let stockSum = 0;
  let firstPurchaseSession: number | null = null;
  let firstPurchaseServices: number | null = null;
  let startingBoughtOutWeek: number | null = startingKeys.length === 0 ? 0 : null;
  let allBoughtOutWeek: number | null = null;
  let wish: string | null = null;

  const queue: ShopEntry[] = [];
  const opened = new Set<string>();
  let nextCrateAt = Infinity;
  const weeks: WeekStat[] = [];

  const openWaves = (week: number) => {
    for (const w of input.waves) {
      if (opened.has(w.id) || w.opensWeek > week) continue;
      opened.add(w.id);
      if (!input.crates) {
        for (const e of w.entries) shop.set(e.key, e);
        continue;
      }
      const wasEmpty = queue.length === 0;
      queue.push(...interleave(w.entries));
      if (wasEmpty) nextCrateAt = monsters; // an update brings a crate straight away
    }
  };
  const deliverCrates = () => {
    if (!input.crates) return;
    const hold = input.crates.holdAtStock ?? Infinity;
    while (queue.length > 0 && monsters >= nextCrateAt && unowned().length < hold) {
      for (const e of queue.splice(0, input.crates.size)) shop.set(e.key, e);
      nextCrateAt = Math.max(nextCrateAt + input.crates.everyMonsters, monsters + 1);
    }
    if (queue.length === 0) nextCrateAt = Infinity;
  };
  const unowned = () => [...shop.values()].filter((e) => !owned.has(e.key));
  const buy = (e: ShopEntry) => {
    owned.add(e.key);
    coins -= e.price;
    totalSpent += e.price;
  };

  const visitShop = (): number => {
    let bought = 0;
    const can = () => unowned().filter((e) => e.price <= coins);
    if (input.policy === 'impulse') {
      while (bought < input.maxBuysPerVisit) {
        const options = can();
        if (options.length === 0) break;
        buy(rng.pick(options));
        bought++;
      }
    } else if (input.policy === 'cheapest') {
      for (;;) {
        const options = can().sort((a, b) => a.price - b.price || a.key.localeCompare(b.key));
        if (options.length === 0) break;
        buy(options[0]!);
        bought++;
      }
    } else {
      for (;;) {
        if (wish === null || owned.has(wish)) {
          const left = unowned();
          wish = left.length > 0 ? rng.pick(left).key : null;
        }
        const target = wish === null ? undefined : shop.get(wish);
        if (!target || target.price > coins) break;
        buy(target);
        bought++;
      }
    }
    return bought;
  };

  for (let week = 0; week < input.weeks; week++) {
    openWaves(week);
    const stat: WeekStat = {
      week,
      sessions: 0,
      services: 0,
      monsters: 0,
      coins: 0,
      purchases: 0,
      minutes: 0,
    };
    let weekLeft = p.minutesPerWeek;
    while (weekLeft >= p.minMinutesToStart + p.serviceMinutes[0]) {
      const length = Math.min(uniform(rng, p.sessionMinutes), weekLeft);
      let used = 0;
      sessionsEver++;
      stat.sessions++;
      while (length - used >= p.minMinutesToStart) {
        const perMonster = uniform(rng, p.serviceMinutes) / p.orders;
        let served: number;
        let tip: number;
        if (rng.chance(p.partialRate)) {
          served = rng.int(1, p.orders - 1);
          tip = 0;
        } else {
          const r = rng.next();
          served = p.orders + (r < p.requeueTwo ? 2 : r < p.requeueTwo + p.requeueOne ? 1 : 0);
          tip = SERVICE_TIP;
        }
        // The first-ever service starts with the warm-up order (SPEC §5.4, D26), which pays too.
        const warmUp = servicesEver === 0 ? 1 : 0;
        const earned = (served + warmUp) * COINS_PER_PROBLEM + tip;
        coins += earned;
        monsters += served;
        servicesEver++;
        used += (served + warmUp) * perMonster + p.betweenServicesMinutes;
        stat.services++;
        stat.monsters += served;
        stat.coins += earned;
        deliverCrates();
      }
      deliverCrates(); // a held crate lands once purchases make room
      const stock = unowned();
      const active = allBoughtOutWeek === null && week >= (input.measureFromWeek ?? 0);
      if (active) {
        activeSessions++;
        stockSum += stock.length;
      }
      if (stock.length === 0) {
        if (active) emptyShopSessions++;
        dry = 0;
      } else {
        used += p.shopMinutes;
        const bought = visitShop();
        stat.purchases += bought;
        if (bought > 0) {
          if (active) purchaseSessions++;
          dry = 0;
          if (firstPurchaseSession === null) {
            firstPurchaseSession = sessionsEver;
            firstPurchaseServices = servicesEver;
          }
        } else {
          dry++;
          longestDry = Math.max(longestDry, dry);
        }
      }
      weekLeft -= used;
      stat.minutes += used;
      const when = week + Math.min(1, stat.minutes / p.minutesPerWeek);
      if (startingBoughtOutWeek === null && startingKeys.every((k) => owned.has(k)))
        startingBoughtOutWeek = when;
      if (
        allBoughtOutWeek === null &&
        opened.size === input.waves.length &&
        queue.length === 0 &&
        [...allKeys].every((k) => owned.has(k))
      ) {
        allBoughtOutWeek = when;
      }
    }
    weeks.push(stat);
  }

  return {
    weeks,
    firstPurchaseSession,
    firstPurchaseServices,
    startingBoughtOutWeek,
    allBoughtOutWeek,
    sessions: sessionsEver,
    activeSessions,
    purchaseSessions,
    longestDry,
    emptyShopSessions,
    meanStock: activeSessions === 0 ? 0 : stockSum / activeSessions,
    coins: weeks.reduce((s, w) => s + w.coins, 0),
    monsters,
    totalSpent,
  };
}

/** p-th percentile (0–100) of numbers; nulls (never happened) sort last and read as null. */
export function percentile(values: readonly (number | null)[], pct: number): number | null {
  const sorted = [...values].sort((a, b) => (a === null ? 1 : b === null ? -1 : a - b));
  if (sorted.length === 0) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((pct / 100) * (sorted.length - 1))));
  return sorted[i] ?? null;
}
