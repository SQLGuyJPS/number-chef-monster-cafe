import { describe, expect, it } from 'vitest';
import { REGULARS } from '../../src/engine/monsters';
import { buildService } from '../../src/engine/session';
import { numberToWords } from '../../src/engine/numberWords';
import {
  ServiceController,
  type ProblemRecord,
  type ServiceDeps,
  type ServiceOptions,
  type ServiceSummary,
} from '../../src/game/service/controller';

// SPEC §5.6, §9, D101: fly → chew → react → coins, any tap skips to the coins, the tip on completion.
function rig(extra: Partial<ServiceOptions> = {}) {
  const log: string[] = [];
  let clock = 0;
  let timers: (() => void)[] = [];
  const done: ServiceSummary[] = [];
  const deps: ServiceDeps = {
    speak: (t, who, m) => (log.push(`say:${who ?? 'monster'}:${m ?? ''}:${t}`), Promise.resolve()),
    countAloud: (t) => void log.push(`count:${t}`),
    hush: () => {},
    sfx: {
      place: () => {},
      remove: () => {},
      bell: () => {},
      correct: () => {},
      hm: () => {},
      wobble: () => {},
      munch: () => void log.push('munch'),
      burp: () => void log.push('burp'),
      coin: () => void log.push('coin'),
      arrive: () => void log.push('arrive'),
    },
    lines: (m) => ({ arrive: `hello from ${m}`, thanks: `thanks from ${m}`, burps: m === 'chompers' }),
    now: () => (clock += 1000), // past the bell's double-press guard
    wall: () => 0,
    newId: () => 'x',
    timeScale: () => 0,
    setTimeout: (f) => timers.push(f),
    clearTimeout: () => {},
  };
  const orders = buildService({
    seed: 4,
    skill: 'A1',
    ops: 'add',
    stage: 3,
    orders: 2,
    boxes: new Map(),
    seen: new Set(),
    monsters: REGULARS,
  }).orders;
  const coins: number[] = [];
  const c = new ServiceController(
    { orders, svc: 's', dev: 'd', onDone: (s) => void done.push(s), onCoins: (n) => void coins.push(n), ...extra },
    deps,
  );
  const tick = async () => {
    const t = timers;
    timers = [];
    t.forEach((f) => f());
    await new Promise((r) => setTimeout(r, 0));
  };
  const serveRight = () => {
    while (c.probe().filled < c.probe().expectedCells) c.tapBin();
    c.serve();
  };
  return { c, log, tick, done, coins, serveRight, orders };
}

describe('eat sequence (SPEC §5.6, D101)', () => {
  it('greets on arrival, flies, says the answer once, chews, reacts, then 3 coins land; tip at the end', async () => {
    const { c, log, tick, done, coins, serveRight, orders } = rig();
    c.start();
    expect(log).toEqual(['arrive']); // the boing before any word (D109)
    await tick();
    expect(log.some((l) => l.endsWith(`:${orders[0]!.monster}:hello from ${orders[0]!.monster}`))).toBe(true);
    serveRight();
    log.length = 0; // the building taps' counts
    const steps = new Set<string>();
    for (let i = 0; i < 60 && c.probe().index === 0; i++) {
      const e = c.getView().eat;
      if (e) steps.add(e.step);
      await tick();
    }
    expect([...steps]).toEqual(['fly', 'chew', 'react', 'coins']);
    // The whole plate goes in at once and the monster says only the answer (D103).
    expect(log.filter((l) => l.startsWith('count:'))).toHaveLength(0);
    const said = numberToWords(orders[0]!.problem.answer);
    expect(log.filter((l) => l.toLowerCase().endsWith(`:${said}!`))).toHaveLength(1);
    expect(log).toContain('munch');
    expect(log.some((l) => l.includes(`thanks from ${orders[0]!.monster}`))).toBe(true);
    expect(log.filter((l) => l === 'coin')).toHaveLength(3);
    // No sound effect while a line plays (D109): the crunch after the answer, the tings after the thanks.
    const at = (f: (l: string) => boolean) => log.findIndex(f);
    expect(at((l) => l === 'munch')).toBeGreaterThan(at((l) => l.toLowerCase().endsWith(`:${said}!`)));
    expect(at((l) => l === 'coin')).toBeGreaterThan(at((l) => l.includes('thanks from')));
    expect(c.getView().landed).toBe(3);

    // Second (last) order: skip at once; coins still land, then the tip and Results.
    serveRight();
    c.skip();
    for (let i = 0; i < 60 && done.length === 0; i++) await tick();
    expect(c.getView().landed).toBe(6);
    expect(coins).toEqual([3, 3, 5]);
    expect(done[0]!.coins).toBe(11);
    // The eaten plate stays off the tray through the closing line (it used to reappear).
    expect(c.getView().finished).toBe(true);
    expect(c.getView().eaten).toEqual({ source: 'tray', from: 0, count: orders[1]!.problem.answer });
  });

  it('a tap skips the flight, chewing and reaction', async () => {
    const { c, log, tick, serveRight } = rig();
    c.start();
    serveRight();
    c.skip();
    const steps = new Set<string>();
    for (let i = 0; i < 40 && c.probe().index === 0; i++) {
      const e = c.getView().eat;
      if (e) steps.add(e.step);
      await tick();
    }
    expect(steps.has('chew')).toBe(false);
    expect(steps.has('react')).toBe(false);
    expect(log).not.toContain('munch');
  });
});

describe('persistence hooks (SPEC §11.3, §11.6)', () => {
  it('each completed problem reports its events and where the service stands; the tip is not a coin event', async () => {
    const records: ProblemRecord[] = [];
    const { c, tick, done, serveRight } = rig({ onRecord: (r) => void records.push(r) });
    c.start();
    serveRight();
    expect(records).toHaveLength(1);
    expect(records[0]!.events.map((e) => e.k)).toEqual(['attempt', 'coin']);
    expect(records[0]).toMatchObject({ nextIndex: 1, results: ['first'], coins: 3 });
    c.skip();
    for (let i = 0; i < 60 && c.probe().index === 0; i++) await tick();
    serveRight();
    c.skip();
    for (let i = 0; i < 60 && done.length === 0; i++) await tick();
    expect(records).toHaveLength(2);
    expect(c.events.filter((e) => e.k === 'coin')).toHaveLength(2);
    expect(done[0]).toMatchObject({ coins: 11, tip: 5, served: 2 });
  });

  it('a resumed service starts at the stored order and counts the coins of the earlier sitting', async () => {
    const { c, tick, done, serveRight } = rig({
      resume: { index: 1, coins: 3, results: ['first'], activeMs: 5000 },
    });
    c.start();
    expect(c.probe().index).toBe(1);
    serveRight();
    c.skip();
    for (let i = 0; i < 60 && done.length === 0; i++) await tick();
    expect(done[0]).toMatchObject({ coins: 11, tip: 5, served: 2 });
    expect(done[0]!.activeMs).toBeGreaterThan(5000);
  });

  it('Close the café before the last order is partial (no tip); after it, the service is finished and tipped', async () => {
    const { c, tick, serveRight } = rig();
    c.start();
    expect(c.summary()).toMatchObject({ served: 0, tip: 0, coins: 0 });
    serveRight();
    expect(c.summary()).toMatchObject({ served: 1, tip: 0, coins: 3 });
    c.skip();
    for (let i = 0; i < 60 && c.probe().index === 0; i++) await tick();
    serveRight();
    // The last monster is still eating, the closing line not yet said: closing now loses nothing.
    expect(c.summary()).toMatchObject({ served: 2, tip: 5, coins: 11 });
  });
});
