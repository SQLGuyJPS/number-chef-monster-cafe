import { describe, expect, it } from 'vitest';
import { REGULARS } from '../../src/engine/monsters';
import { buildService } from '../../src/engine/session';
import type { Stage } from '../../src/engine/types';
import { ServiceController, type ServiceDeps } from '../../src/game/service/controller';

// D91: a tray tap gets a spoken count or a tone, never both; Pip's demo has no tones.
function rig(stage: Stage) {
  const log: string[] = [];
  const timers: (() => void)[] = [];
  const deps: ServiceDeps = {
    speak: () => Promise.resolve(),
    countAloud: (t) => void log.push(`count:${t}`),
    hush: () => {},
    sfx: {
      place: () => void log.push('place'),
      remove: () => void log.push('remove'),
      bell: () => {},
      correct: () => {},
      hm: () => {},
      wobble: () => {},
      munch: () => {},
      burp: () => {},
      coin: () => {},
      arrive: () => {},
    },
    now: () => 0,
    wall: () => 0,
    newId: () => 'x',
    timeScale: () => 0,
    setTimeout: (f) => timers.push(f),
    clearTimeout: () => {},
  };
  const orders = buildService({
    seed: 7,
    skill: 'A1',
    ops: 'add',
    stage,
    orders: 3,
    boxes: new Map(),
    seen: new Set(),
    monsters: REGULARS,
  }).orders;
  const c = new ServiceController({ orders, svc: 's', dev: 'd', onDone: () => {} }, deps);
  return { c, log, flush: () => timers.splice(0).forEach((f) => f()) };
}

describe('service sounds (D91)', () => {
  it('S3 taps count aloud with no place tone', () => {
    const { c, log } = rig(3);
    c.tapBin();
    expect(log).toHaveLength(1);
    expect(log[0]).toMatch(/^count:/);
  });

  it('S2 taps play the tone and say nothing', () => {
    const { c, log } = rig(2);
    c.tapBin();
    expect(log).toEqual(['place']);
  });

  it("Pip's worked demo plays no place/remove tones", async () => {
    const { c, log, flush } = rig(2);
    const settle = async () => {
      for (let i = 0; i < 40; i++) {
        flush();
        await new Promise((r) => setTimeout(r, 0));
      }
    };
    c.help(); // CountTogether before any serve
    await settle();
    // Build one past the answer: a wrong serve that is still allowed (not the start state).
    while (c.probe().filled <= c.probe().expectedCells) c.tapBin();
    log.length = 0;
    expect(c.getView().canServe).toBe(true);
    c.serve(); // a wrong serve after help goes straight to Worked (D29)
    await settle();
    expect(c.getView().attempt.phase).toBe('followMe');
    expect(log.filter((l) => l === 'place' || l === 'remove')).toEqual([]);
  });
});
