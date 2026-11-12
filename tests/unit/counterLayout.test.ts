import { describe, expect, it } from 'vitest';
import {
  BAR_H,
  BUTTON_MIN,
  CELL,
  COUNTER,
  COUNTER_Y,
  COUNTER_Y_TWO_ROW,
  MIN_BUTTON_CSS_PX,
  MIN_CELL_CSS_PX,
  STAGE_H,
  STAGE_W,
  forSide,
  type BasketSide,
  type Rect,
} from '../../src/app/metrics';

// Over-the-counter layout proposal (`?mock`): every variant fits the 1280×720 safe box with no
// overlapping tap targets, on both basket sides, and nothing drops below the 844×390 minimums.
const PHONE_SCALE = Math.min(844 / STAGE_W, 390 / STAGE_H);

const digits = (): Rect[] =>
  Array.from({ length: 10 }, (_, d) => ({
    x: COUNTER.s0.digits.x + d * (BUTTON_MIN + COUNTER.s0.digitGap),
    y: COUNTER.s0.digits.y,
    w: BUTTON_MIN,
    h: BUTTON_MIN,
  }));

/** Counter-band tap targets per variant (right-handed). */
const VARIANTS: Record<string, Rect[]> = {
  s3: [COUNTER.s3.help, COUNTER.s3.bell, COUNTER.s3.tray, COUNTER.s3.bin],
  taken: [COUNTER.s3.help, COUNTER.s3.bell, COUNTER.s3.tray, COUNTER.taken.takenAway],
  frames2a: [COUNTER.frames2a.help, COUNTER.frames2a.bell, COUNTER.frames2a.tray, COUNTER.frames2a.bin],
  frames2b: [COUNTER.frames2b.help, COUNTER.frames2b.bell, COUNTER.frames2b.tray],
  frames2c: [COUNTER.frames2c.help, COUNTER.frames2c.bell, COUNTER.frames2c.tray, COUNTER.frames2c.bin],
  s0: [COUNTER.s0.help, COUNTER.s0.bell, COUNTER.s0.peek, COUNTER.s0.display, COUNTER.s0.backspace, ...digits()],
  cloche: [COUNTER.s3.help, COUNTER.s3.bell, COUNTER.cloche.tray, COUNTER.cloche.lid, COUNTER.cloche.bin],
  offer: [COUNTER.s3.help, COUNTER.s3.bell, COUNTER.offer.yes, COUNTER.offer.no, COUNTER.s3.bin],
};

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('counter layout proposal', () => {
  for (const side of ['right', 'left'] as BasketSide[]) {
    for (const [name, rects] of Object.entries(VARIANTS)) {
      it(`${name}, basket ${side}: inside the counter band, no overlaps`, () => {
        const rs = rects.map((r) => forSide(r, side));
        for (const r of rs) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(STAGE_W);
          expect(r.y).toBeGreaterThanOrEqual(name === 'frames2c' ? COUNTER_Y_TWO_ROW : COUNTER_Y);
          expect(r.y + r.h).toBeLessThanOrEqual(STAGE_H);
        }
        for (let i = 0; i < rs.length; i++)
          for (let j = i + 1; j < rs.length; j++) expect(overlaps(rs[i]!, rs[j]!)).toBe(false);
      });
    }
  }

  it('basket on the dominant side, Pip and the bell on the other', () => {
    for (const side of ['right', 'left'] as BasketSide[]) {
      const bin = forSide(COUNTER.s3.bin, side);
      const bell = forSide(COUNTER.s3.bell, side);
      const tray = forSide(COUNTER.s3.tray, side);
      const binRight = bin.x > tray.x;
      expect(binRight).toBe(side === 'right');
      expect(bell.x > tray.x).toBe(side === 'left');
    }
  });

  it('buttons stay ≥ 56 CSS px and cells ≥ 44 at 844×390', () => {
    expect(CELL * PHONE_SCALE).toBeGreaterThanOrEqual(MIN_CELL_CSS_PX);
    const buttons = [...Object.values(VARIANTS).flat().filter((r) => r.w < 400), COUNTER.bar.door];
    for (const r of buttons) expect(Math.min(r.w, r.h) * PHONE_SCALE).toBeGreaterThanOrEqual(MIN_BUTTON_CSS_PX);
  });

  it('B: the basket on the back counter clears the shorter ticket and the monster', () => {
    const { bin, ticket } = COUNTER.frames2b;
    expect(bin.y + bin.h).toBe(COUNTER_Y);
    expect(overlaps(bin, ticket)).toBe(false);
    expect(overlaps(bin, COUNTER.scene.monsterFull)).toBe(false);
    expect(ticket.y).toBeGreaterThanOrEqual(BAR_H);
  });

  it('C: the room above the raised counter still holds the monster and ticket', () => {
    const { monster, ticket, counterY, tray } = COUNTER.frames2c;
    expect(monster.y).toBeGreaterThanOrEqual(BAR_H);
    expect(monster.y + monster.h).toBe(counterY);
    expect(ticket.y).toBeGreaterThanOrEqual(BAR_H);
    expect(ticket.y + ticket.h).toBeLessThanOrEqual(counterY);
    expect(tray.y).toBeGreaterThanOrEqual(counterY);
  });

  it('status bar and room stay clear of each other and of the counter', () => {
    const { bar, scene } = COUNTER;
    for (const r of [bar.door, bar.jar, bar.line, bar.shop]) expect(r.y + r.h).toBeLessThanOrEqual(BAR_H);
    for (const r of [scene.caption, scene.ticket, scene.bubble, scene.monsterFull]) {
      expect(r.y).toBeGreaterThanOrEqual(BAR_H);
      expect(r.y + r.h).toBeLessThanOrEqual(COUNTER_Y);
    }
    expect(overlaps(scene.ticket, scene.monsterFull)).toBe(false);
    expect(overlaps(scene.ticket, scene.monsterWaist)).toBe(false);
    expect(overlaps(scene.pip, scene.monsterWaist)).toBe(false);
    expect(overlaps(scene.bubble, scene.pipCounting)).toBe(false);
    expect(overlaps(scene.bubble, scene.ticketCounting)).toBe(false);
    expect(overlaps(scene.pipCounting, scene.monsterAside)).toBe(false);
  });
});
