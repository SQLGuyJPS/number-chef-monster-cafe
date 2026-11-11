import { describe, expect, it } from 'vitest';
import { plateCountLine } from '../../src/engine/attempt';
import { countTogetherTicks, missingTicks } from '../../src/engine/countTogether';
import { pool } from '../../src/engine/generators';
import { phrase } from '../../src/engine/phrases';
import type { Order } from '../../src/engine/session';
import { eatenPlate, spokenCount, startState, tapBin, toTrayTask } from '../../src/engine/tray';
import type { Stage } from '../../src/engine/types';
import { ServiceController, type ServiceDeps } from '../../src/game/service/controller';

// D104, D105: on missing-number forms the orange group is the answer, everywhere.
const find = (s: string) => pool('A3').find((p) => p.display.join('') === s)!;

function rig(problems: string[], stage: Stage) {
  const log: string[] = [];
  let clock = 0;
  let timers: (() => void)[] = [];
  const deps: ServiceDeps = {
    speak: (t) => (log.push(`say:${t}`), Promise.resolve()),
    countAloud: (t) => void log.push(`count:${t}`),
    hush: () => {},
    sfx: {
      place: () => void log.push('tone'),
      remove: () => void log.push('tone'),
      bell: () => {},
      correct: () => {},
      hm: () => {},
      wobble: () => {},
      munch: () => {},
      burp: () => {},
      coin: () => {},
      arrive: () => {},
    },
    now: () => (clock += 1000),
    wall: () => 0,
    newId: () => 'x',
    timeScale: () => 0,
    setTimeout: (f) => timers.push(f),
    clearTimeout: () => {},
  };
  const monsters = ['blobbo', 'gruffles', 'zibbit', 'mimsy', 'chompers', 'wobbleton'];
  const orders: Order[] = problems.map((d, i) => ({ problem: find(d), food: 'cookie', stage, monster: monsters[i]! }));
  const c = new ServiceController({ orders, svc: 's', dev: 'd', onDone: () => {} }, deps);
  const tick = async (n = 1) => {
    for (let i = 0; i < n; i++) {
      const t = timers;
      timers = [];
      t.forEach((f) => f());
      await new Promise((r) => setTimeout(r, 0));
    }
  };
  return { c, log, tick };
}

describe('missing-number forms: the orange group is the answer (D104)', () => {
  it('the guided tray marks the unknown; S1 needs no mark', () => {
    expect(toTrayTask(find('7+?=10'), 3).unknown).toEqual({ from: 7, to: 10 });
    expect(toTrayTask(find('?+3=10'), 2).unknown).toEqual({ from: 3, to: 10 });
    expect(toTrayTask(find('10−?=6'), 3).unknown).toEqual({ from: 6, to: 10 });
    expect(toTrayTask(find('7+?=10'), 1).unknown).toBeUndefined();
    expect(toTrayTask(find('10−4=?'), 3).unknown).toBeUndefined();
  });

  it('S3 counts the orange group from one; result forms still count the tray', () => {
    const t = toTrayTask(find('7+?=10'), 3);
    const r = tapBin(startState(t));
    expect(spokenCount(t, { count: 8 }, r.state)).toBe(1);
    const res = toTrayTask(find('10−4=?'), 3);
    expect(spokenCount(res, { count: 9 }, startState(res))).toBe(9);
  });

  it('the monster eats the answer: the orange group, the taken-away row, or the whole plate', () => {
    expect(eatenPlate(toTrayTask(find('7+?=10'), 3), 3)).toEqual({ source: 'tray', from: 7, count: 3 });
    expect(eatenPlate(toTrayTask(find('10−?=6'), 2), 4)).toEqual({ source: 'taken', count: 4 });
    expect(eatenPlate(toTrayTask(find('7+?=10'), 1), 3)).toEqual({ source: 'tray', from: 0, count: 3 });
    expect(eatenPlate(toTrayTask(find('10−4=?'), 3), 6)).toEqual({ source: 'tray', from: 0, count: 6 });
    expect(eatenPlate(toTrayTask(find('7+?=10'), 0), 3, true)).toEqual({ source: 'pad', count: 3 });
  });

  it('PlateCount talks about the orange group', () => {
    const say = (l: ReturnType<typeof plateCountLine>) => phrase(l.key, l.params);
    expect(say(plateCountLine(2, 3, 3, 'more'))).toBe('Only two? I wanted three. One more please!');
    expect(say(plateCountLine(4, 3, 2, 'more'))).toBe('Four? I wanted three. One less please!');
    expect(say(plateCountLine(1, 5, 3, 'more'))).toBe('Only one? I wanted five. Four more please!');
    expect(say(plateCountLine(3, 4, 3, 'away'))).toBe('Only three? I wanted four. One more please!');
    expect(say(plateCountLine(6, 4, 3, 'away'))).toBe('Six? I wanted four. Two less please!');
    expect(say(plateCountLine(7, 8, 3))).toBe('I see seven… I wanted eight. One more!');
  });

  it('the model bubble tells the same story and ends on the answer (D105)', () => {
    const add = missingTicks(find('7+?=10'), 3);
    expect(add.map((t) => phrase(t.key, t.params))).toEqual([
      'Seven.',
      'Three empty spots.',
      'one',
      'two',
      'three',
      'Seven and three more makes ten!',
    ]);
    expect(add[0]!.cells.filter((c) => c.spot)).toHaveLength(3);
    expect(add.at(-1)!.cells.filter((c) => c.role === 'child' && !c.spot)).toHaveLength(3);
    const sub = missingTicks(find('10−?=6'), 2);
    expect(sub.map((t) => phrase(t.key, t.params))).toEqual([
      'Ten.',
      'one',
      'two',
      'three',
      'four',
      'Six left!',
      'Four taken away!',
    ]);
    expect(sub.at(-1)!.cells.filter((c) => c.gone)).toHaveLength(4);
    // CountTogether: "Let's count together." then the same story; no second count to the total.
    const ct = countTogetherTicks(find('?+3=10'), 3).map((t) => phrase(t.key, t.params));
    expect(ct[0]).toBe("Let's count together.");
    expect(ct.slice(1)).toEqual(missingTicks(find('?+3=10'), 3).map((t) => phrase(t.key, t.params)));
  });

  it('S1: the bubble shows only the answer, as the child builds it (D111)', () => {
    const add = missingTicks(find('7+?=10'), 1);
    expect(add.map((t) => phrase(t.key, t.params))).toEqual([
      'Three empty spots.',
      'one',
      'two',
      'three',
      'Three more makes ten!',
    ]);
    for (const t of add) expect(t.cells).toHaveLength(3);
    expect(add[0]!.cells.every((c) => c.spot && c.role === 'child')).toBe(true);
    const sub = missingTicks(find('10−?=6'), 1);
    expect(sub.map((t) => phrase(t.key, t.params))).toEqual(['one', 'two', 'three', 'four', 'Four taken away!']);
    expect(sub.at(-1)!.cells.every((c) => c.role === 'child' && !c.spot && !c.gone)).toBe(true);
    const ct = countTogetherTicks(find('10−?=6'), 1).map((t) => phrase(t.key, t.params));
    expect(ct).toEqual(["Let's count together.", 'one', 'two', 'three', 'four', 'Four taken away!']);
  });
});

describe('service controller on missing-number forms', () => {
  it('S3: counts one, two, three; a short plate is named by the orange group; eats only the three', async () => {
    const { c, log, tick } = rig(['7+?=10', '9+?=10'], 3);
    c.start();
    await tick();
    log.length = 0;
    c.tapBin();
    c.tapBin();
    expect(log).toEqual(['count:one', 'count:two']);
    c.serve();
    await tick(4);
    expect(log.some((l) => l === 'say:Only two? I wanted three. One more please!')).toBe(true);
    c.tapBin();
    c.serve();
    expect(c.getView().eat?.plate).toEqual({ source: 'tray', from: 7, count: 3 });
  });

  it('S1: Worked plays in the bubble; the child\'s tray stays empty, then FollowMe builds the answer', async () => {
    const { c, tick } = rig(['7+?=10', '9+?=10'], 1);
    c.start();
    await tick();
    c.tapBin();
    c.serve(); // first miss
    await tick(4);
    c.help(); // Help after a miss plays Worked (D89)
    expect(c.getView().attempt.phase).toBe('worked');
    for (let i = 0; i < 30 && c.getView().attempt.phase === 'worked'; i++) {
      expect(c.getView().tray.filled).toBe(0);
      expect(c.getView().demoTray).toBe(false);
      await tick();
    }
    const v = c.getView();
    expect(v.attempt.phase).toBe('followMe');
    // D111: the S1 bubble shows only the answer, as the child builds it.
    expect(v.bubble?.filter((x) => x.role === 'prefill')).toHaveLength(0);
    expect(v.bubble).toHaveLength(3);
    expect(v.task.expected.cells).toBe(3);
    expect(v.cue).toBe('place');
  });

  it('a returning monster joins the line only when the next monster comes in (D108)', async () => {
    const { c, tick } = rig(['7+?=10', '9+?=10', '?+5=10', '6+?=10', '?+2=10'], 3);
    c.start();
    await tick();
    const before = c.getView().remaining;
    // Three misses: PlateCount, offer (yes), Worked, FollowMe → assisted.
    c.serve(); // start state: the bell wobbles, nothing happens
    c.tapBin();
    c.serve();
    await tick(4);
    c.serve();
    await tick(4);
    c.help();
    for (let i = 0; i < 40 && c.getView().attempt.phase !== 'followMe'; i++) await tick();
    while (c.getView().cue === 'place') c.tapBin();
    c.serve();
    expect(c.getView().remaining).toBe(before); // planned, but not in line yet
    expect(c.getView().queueJoin).toBe(0);
    for (let i = 0; i < 60 && c.getView().index === 0; i++) await tick();
    expect(c.getView().queueJoin).toBe(1);
    expect(c.getView().remaining).toBe(before); // one went to the counter, one joined
  });
});
