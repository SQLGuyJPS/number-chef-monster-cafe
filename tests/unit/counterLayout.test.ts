import { describe, expect, it } from 'vitest';
import {
  BAR_H,
  BUTTON_MIN,
  CELL,
  COUNTER,
  COUNTER_Y,
  MIN_BUTTON_CSS_PX,
  MIN_CELL_CSS_PX,
  STAGE_H,
  STAGE_W,
  CRATE_INSET,
  LID_ART_SHIFT,
  PLATE_BLEED,
  forSide,
  mirrorX,
  type BasketSide,
  type Rect,
} from '../../src/app/metrics';
import { cellRect, counterLayout } from '../../src/game/service/counterLayout';

// Over-the-counter service layout (SPEC §5.4, D114–D118): every variant fits the 1280×720 safe box with no
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
  frames2: [COUNTER.frames2.help, COUNTER.frames2.bell, COUNTER.frames2.tray, COUNTER.frames2.bin],
  s0: [COUNTER.s0.help, COUNTER.s0.bell, COUNTER.s0.peek, COUNTER.s0.display, COUNTER.s0.backspace, ...digits()],
  cloche: [COUNTER.s3.help, COUNTER.s3.bell, COUNTER.cloche.tray, COUNTER.cloche.lid, COUNTER.cloche.bin],
  offer: [COUNTER.s3.help, COUNTER.s3.bell, COUNTER.offer.yes, COUNTER.offer.no, COUNTER.s3.bin],
};

const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('counter layout table', () => {
  for (const side of ['right', 'left'] as BasketSide[]) {
    for (const [name, rects] of Object.entries(VARIANTS)) {
      it(`${name}, basket ${side}: inside the counter band, no overlaps`, () => {
        const rs = rects.map((r) => forSide(r, side));
        for (const r of rs) {
          expect(r.x).toBeGreaterThanOrEqual(0);
          expect(r.x + r.w).toBeLessThanOrEqual(STAGE_W);
          expect(r.y).toBeGreaterThanOrEqual(COUNTER_Y);
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

  it('status bar and room stay clear of each other and of the counter', () => {
    const { bar, scene } = COUNTER;
    for (const r of [bar.door, bar.jar, bar.line, bar.shop]) expect(r.y + r.h).toBeLessThanOrEqual(BAR_H);
    for (const r of [scene.caption, scene.ticket, scene.bubble, scene.monsterFull]) {
      expect(r.y).toBeGreaterThanOrEqual(BAR_H);
      expect(r.y + r.h).toBeLessThanOrEqual(COUNTER_Y);
    }
    expect(overlaps(scene.ticket, scene.monsterFull)).toBe(false);
    expect(overlaps(scene.pip, scene.monsterFull)).toBe(false);
    expect(overlaps(scene.bubble, scene.pipCounting)).toBe(false);
    expect(overlaps(scene.bubble, scene.ticketCounting)).toBe(false);
    expect(overlaps(scene.pipCounting, scene.monsterAside)).toBe(false);
  });
});

describe('service counter layout (counterLayout)', () => {
  const base = { frames2: false, takenAwayRow: false, stage0: false, padMode: false };

  it('mirrors the counter row for a left-handed child, not the digits', () => {
    const r = counterLayout({ ...base, side: 'right' });
    const l = counterLayout({ ...base, side: 'left' });
    expect(l.bin).toEqual(mirrorX(r.bin!));
    expect(l.help).toEqual(mirrorX(r.help));
    expect(l.tray).toEqual(mirrorX(r.tray));
    expect(l.digit(0)).toEqual(r.digit(0));
    expect(l.digit(0).x).toBeLessThan(l.digit(9).x);
  });

  it('the taken-away row takes the basket’s place (D117)', () => {
    for (const side of ['right', 'left'] as BasketSide[]) {
      const L = counterLayout({ ...base, side, takenAwayRow: true });
      expect(L.bin).toBeNull();
      const withBin = counterLayout({ ...base, side });
      expect(Math.sign(L.takenAway.x - L.tray.x)).toBe(Math.sign(withBin.bin!.x - withBin.tray.x));
    }
  });

  it('every tray cell sits inside the tray, both layouts, and no two overlap', () => {
    for (const frames2 of [false, true]) {
      const L = counterLayout({ ...base, side: 'right', frames2 });
      const cells = Array.from({ length: frames2 ? 20 : 10 }, (_, i) => cellRect(i, L.tray, L.frame));
      for (const c of cells) {
        expect(c.x).toBeGreaterThanOrEqual(L.tray.x);
        expect(c.x + c.w).toBeLessThanOrEqual(L.tray.x + L.tray.w);
        expect(c.y + c.h).toBeLessThanOrEqual(L.tray.y + L.tray.h);
      }
      for (let i = 0; i < cells.length; i++)
        for (let j = i + 1; j < cells.length; j++) expect(overlaps(cells[i]!, cells[j]!)).toBe(false);
      expect(L.tallBin).toBe(frames2);
    }
  });

  it('the lifted lid sits centred between the plate rim and the crate side, both sides (D120)', () => {
    for (const side of ['right', 'left'] as BasketSide[]) {
      const L = counterLayout({ ...base, side, stage0: true });
      const right = side === 'right';
      const plateEdge = right ? L.tray.x + L.tray.w + PLATE_BLEED : L.tray.x - PLATE_BLEED;
      const crateEdge = right ? L.bin!.x + CRATE_INSET : L.bin!.x + L.bin!.w - CRATE_INSET;
      // The drawing sits LID_ART_SHIFT toward the basket from the tap box.
      const art = { ...L.lid, x: L.lid.x + (right ? LID_ART_SHIFT : -LID_ART_SHIFT) };
      const gapTray = right ? art.x - plateEdge : plateEdge - (art.x + art.w);
      const gapCrate = right ? crateEdge - (art.x + art.w) : art.x - crateEdge;
      expect(Math.abs(gapTray - gapCrate)).toBeLessThanOrEqual(1);
      expect(Math.min(gapTray, gapCrate)).toBeGreaterThanOrEqual(12);
    }
  });

  it('the waiting line walks left into the little café; jar and leave sign stay clear on the right (D120, D121)', () => {
    const { bar } = COUNTER;
    expect(bar.shop.x).toBeLessThan(bar.line.x);
    expect(bar.line.x).toBeGreaterThanOrEqual(bar.shop.x + bar.shop.w);
    expect(bar.jar.x).toBeGreaterThanOrEqual(bar.line.x + bar.line.w);
    expect(bar.door.x).toBeGreaterThanOrEqual(bar.jar.x + bar.jar.w);
    expect(bar.door.x + bar.door.w).toBeLessThanOrEqual(STAGE_W);
  });

  it('S0 uses the pad row for Pip and the bell; the lifted cloche uses the shifted tray', () => {
    const pad = counterLayout({ ...base, side: 'right', stage0: true, padMode: true });
    expect(pad.help).toEqual(COUNTER.s0.help);
    const lifted = counterLayout({ ...base, side: 'right', stage0: true });
    expect(lifted.tray).toEqual(COUNTER.cloche.tray);
    expect(lifted.bin).toEqual(COUNTER.cloche.bin);
    expect(overlaps(lifted.lid, lifted.tray)).toBe(false);
    expect(overlaps(lifted.lid, lifted.bin!)).toBe(false);
  });
});
