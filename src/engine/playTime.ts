// How long play takes, read back from the progress log (D189). The game has timed every order
// (`attempt.ms`) and every service (`serviceEnd.activeMs`) since M1 (SPEC §11.2); this turns a backup's
// events into the figures the economy simulation assumes (`PlayProfile`, D150), so its guesses can
// be replaced by measured play. Pure: the caller formats dates.
import { percentile } from './economySim';
import type { Evt, ServiceEndEvt } from './events';
import type { SkillId, Stage } from './types';

/** Gap between two recorded moments that starts a new sitting. */
export const SITTING_GAP_MIN = 15;

const MIN = 60_000;

export interface Spread {
  n: number;
  median: number;
  p10: number;
  p90: number;
}

function spread(values: readonly number[]): Spread | null {
  if (values.length === 0) return null;
  return {
    n: values.length,
    median: percentile(values, 50)!,
    p10: percentile(values, 10)!,
    p90: percentile(values, 90)!,
  };
}

/** One dish at one support level: seconds from the monster's arrival to the served order. */
export interface OrderTimes {
  skill: SkillId;
  stage: Stage;
  /** Seconds per order (attempt.ms). The warm-up order writes no attempt (D26), so is not here. */
  seconds: Spread;
  firstTry: number;
}

/** Finished services of one dish at one support level, in minutes. */
export interface ServiceTimes {
  skill: SkillId;
  stage: Stage | null;
  minutes: Spread;
  /** The same services scaled to 6 orders (the sim's service, D150). */
  minutesPer6: Spread;
  orders: number;
}

export interface Sitting {
  start: number;
  end: number;
  minutes: number;
  services: number;
  /** Services served to the end (not closed early). */
  finished: number;
  monsters: number;
  coins: number;
  purchases: number;
}

export interface PlayTime {
  orders: OrderTimes[];
  services: ServiceTimes[];
  sittings: Sitting[];
  /** Minutes between one service's end and the next one's start within a sitting. */
  between: { plain: Spread | null; withShop: Spread | null };
  totals: {
    sittingMinutes: number;
    serviceMinutes: number;
    coins: number;
    monsters: number;
    services: number;
    coinsPerMinute: number | null;
    /** Only with at least two weeks between the first and the last sitting. */
    minutesPerWeek: number | null;
  };
  /** Measured values for `economy:sim`'s flags (null where there is too little to say). */
  suggest: {
    serviceMinutes: [number, number] | null;
    sessionMinutes: [number, number] | null;
    betweenServicesMinutes: number | null;
    shopMinutes: number | null;
  };
}

/** Parent-only events (settings, the playtest coin jar) are not play. */
const PLAY_KINDS = new Set<Evt['k']>(['attempt', 'coin', 'serviceEnd', 'buy', 'equip', 'crate']);
const SHOP_KINDS = new Set<Evt['k']>(['buy', 'equip', 'crate']);

const round1 = (x: number) => Math.round(x * 10) / 10;

/** A resumed service can end twice (D39); its last row holds the whole service. */
function lastServiceRows(events: readonly Evt[]): ServiceEndEvt[] {
  const bySvc = new Map<string, ServiceEndEvt>();
  for (const e of events) {
    if (e.k !== 'serviceEnd') continue;
    const had = bySvc.get(e.svc);
    if (!had || e.t > had.t) bySvc.set(e.svc, e);
  }
  return [...bySvc.values()].sort((a, b) => a.t - b.t);
}

const startOf = (e: Evt) => (e.k === 'serviceEnd' ? e.t - e.activeMs : e.t);

export function playTime(events: readonly Evt[], gapMin = SITTING_GAP_MIN): PlayTime {
  const play = events.filter((e) => PLAY_KINDS.has(e.k));
  const services = lastServiceRows(play);
  const tipBySvc = new Map<string, number>();
  for (const e of play)
    if (e.k === 'serviceEnd') tipBySvc.set(e.svc, Math.max(tipBySvc.get(e.svc) ?? 0, e.tip));

  // Orders: one row per dish and support level.
  const orderGroups = new Map<
    string,
    { skill: SkillId; stage: Stage; ms: number[]; first: number }
  >();
  const stagesBySvc = new Map<string, Map<Stage, number>>();
  for (const e of play) {
    if (e.k !== 'attempt') continue;
    const key = `${e.skill}:${e.stage}`;
    const g = orderGroups.get(key) ?? { skill: e.skill, stage: e.stage, ms: [], first: 0 };
    g.ms.push(e.ms / 1000);
    if (e.outcome === 'first') g.first++;
    orderGroups.set(key, g);
    const st = stagesBySvc.get(e.svc) ?? new Map<Stage, number>();
    st.set(e.stage, (st.get(e.stage) ?? 0) + 1);
    stagesBySvc.set(e.svc, st);
  }
  const orders: OrderTimes[] = [...orderGroups.values()]
    .sort((a, b) => (a.skill < b.skill ? -1 : a.skill > b.skill ? 1 : b.stage - a.stage))
    .map((g) => ({
      skill: g.skill,
      stage: g.stage,
      seconds: spread(g.ms)!,
      firstTry: g.first / g.ms.length,
    }));

  // Services: finished ones only (a closed-early service says how long she stayed, not how long one takes).
  const stageOf = (svc: string): Stage | null => {
    const st = stagesBySvc.get(svc);
    if (!st) return null;
    return [...st.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]![0];
  };
  const svcGroups = new Map<
    string,
    { skill: SkillId; stage: Stage | null; min: number[]; per6: number[]; orders: number }
  >();
  for (const s of services) {
    if (s.partial || s.served === 0) continue;
    const stage = stageOf(s.svc);
    const key = `${s.skill}:${stage ?? '-'}`;
    const g = svcGroups.get(key) ?? { skill: s.skill, stage, min: [], per6: [], orders: 0 };
    g.min.push(s.activeMs / MIN);
    g.per6.push(((s.activeMs / MIN) * 6) / s.served);
    g.orders += s.served;
    svcGroups.set(key, g);
  }
  const serviceTimes: ServiceTimes[] = [...svcGroups.values()]
    .sort((a, b) =>
      a.skill < b.skill ? -1 : a.skill > b.skill ? 1 : (b.stage ?? -1) - (a.stage ?? -1),
    )
    .map((g) => ({
      skill: g.skill,
      stage: g.stage,
      minutes: spread(g.min)!,
      minutesPer6: spread(g.per6)!,
      orders: g.orders,
    }));

  // Sittings: recorded moments (a service covers its whole span) closer than the gap belong together.
  // The time after the last recorded moment (Results, the menu, closing the app) is not in the log,
  // so a sitting's length is a lower bound.
  const spans = play
    .map((e) => ({ e, from: startOf(e), to: e.t }))
    .sort((a, b) => a.from - b.from || a.to - b.to);
  const groups: { from: number; to: number; evs: Evt[] }[] = [];
  for (const s of spans) {
    const last = groups[groups.length - 1];
    if (last && s.from - last.to <= gapMin * MIN) {
      last.to = Math.max(last.to, s.to);
      last.evs.push(s.e);
    } else groups.push({ from: s.from, to: s.to, evs: [s.e] });
  }
  const lastRow = new Set<Evt>(services);
  const sittings: Sitting[] = groups.map((g) => {
    let coins = 0;
    let monsters = 0;
    let count = 0;
    let finished = 0;
    let purchases = 0;
    for (const e of g.evs) {
      if (e.k === 'coin') coins += e.n;
      else if (e.k === 'buy') purchases++;
      else if (e.k === 'serviceEnd' && lastRow.has(e)) {
        coins += tipBySvc.get(e.svc) ?? 0;
        monsters += e.served;
        count++;
        if (!e.partial) finished++;
      }
    }
    return {
      start: g.from,
      end: g.to,
      minutes: (g.to - g.from) / MIN,
      services: count,
      finished,
      monsters,
      coins,
      purchases,
    };
  });

  // Between services: a gap with a shop event in it is a shop visit as well.
  const plain: number[] = [];
  const withShop: number[] = [];
  const shopTimes = play.filter((e) => SHOP_KINDS.has(e.k)).map((e) => e.t);
  for (let i = 1; i < services.length; i++) {
    const prev = services[i - 1]!;
    const next = services[i]!;
    const gap = startOf(next) - prev.t;
    if (gap < 0 || gap > gapMin * MIN) continue;
    const shopped = shopTimes.some((t) => t > prev.t && t < startOf(next));
    (shopped ? withShop : plain).push(gap / MIN);
  }

  const sittingMinutes = sittings.reduce((a, s) => a + s.minutes, 0);
  const coins = sittings.reduce((a, s) => a + s.coins, 0);
  const span = sittings.length
    ? (sittings[sittings.length - 1]!.end - sittings[0]!.start) / (7 * 24 * 60 * MIN)
    : 0;
  const fullPer6 = services
    .filter((s) => !s.partial && s.served > 0)
    .map((s) => ((s.activeMs / MIN) * 6) / s.served);
  const real = sittings.filter((s) => s.finished > 0).map((s) => s.minutes);
  const plainS = spread(plain);
  const shopS = spread(withShop);
  return {
    orders,
    services: serviceTimes,
    sittings,
    between: { plain: plainS, withShop: shopS },
    totals: {
      sittingMinutes,
      serviceMinutes: services.reduce((a, s) => a + s.activeMs / MIN, 0),
      coins,
      monsters: sittings.reduce((a, s) => a + s.monsters, 0),
      services: services.filter((s) => !s.partial).length,
      coinsPerMinute: sittingMinutes > 0 ? coins / sittingMinutes : null,
      minutesPerWeek: span >= 2 ? sittingMinutes / span : null,
    },
    suggest: {
      serviceMinutes: fullPer6.length
        ? [round1(percentile(fullPer6, 10)!), round1(percentile(fullPer6, 90)!)]
        : null,
      sessionMinutes: real.length
        ? [Math.round(Math.min(...real)), Math.round(Math.max(...real))]
        : null,
      betweenServicesMinutes: plainS ? round1(plainS.median) : null,
      shopMinutes:
        shopS && plainS
          ? round1(Math.max(0, shopS.median - plainS.median))
          : shopS
            ? round1(shopS.median)
            : null,
    },
  };
}
