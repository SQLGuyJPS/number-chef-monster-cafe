// Which `COUNTER` rects the service uses for the order on the counter (SPEC §5.4, D114–D117).
// Pure, so the screen and its drag handlers agree on where things are; mirrored for a left-handed
// child (D115).
import {
  CELL,
  CELL_GAP,
  COUNTER,
  FRAME_PADDING,
  FRAMES_GAP,
  TIGHT,
  forSide,
  frameSize,
  type BasketSide,
  type Rect,
} from '../../app/metrics';

export interface FrameGeometry {
  cell: number;
  gap: number;
  pad: number;
  framesGap: number;
}

export interface CounterRects {
  help: Rect;
  bell: Rect;
  tray: Rect;
  frame: FrameGeometry;
  /** Absent while the taken-away row stands in the basket's place (D117). */
  bin: Rect | null;
  /** Two-frame tray: the basket is an upright crate (D116). */
  tallBin: boolean;
  takenAway: Rect;
  lid: Rect;
  offerYes: Rect;
  offerNo: Rect;
  peek: Rect;
  display: Rect;
  backspace: Rect;
  /** Digit `d` of the S0 row; 0–9 left to right on both sides (a small number line, D115). */
  digit: (d: number) => Rect;
}

const WIDE: FrameGeometry = { cell: CELL, gap: CELL_GAP, pad: FRAME_PADDING, framesGap: FRAMES_GAP };

export function counterLayout(o: {
  side: BasketSide;
  frames2: boolean;
  takenAwayRow: boolean;
  stage0: boolean;
  padMode: boolean;
}): CounterRects {
  const s = (r: Rect) => forSide(r, o.side);
  const { s3, s0, frames2, cloche, offer, taken } = COUNTER;
  const buttons = o.frames2 ? frames2 : o.padMode ? s0 : s3;
  const tray = o.frames2 ? frames2.tray : o.stage0 ? cloche.tray : s3.tray;
  const bin = o.frames2 ? frames2.bin : o.stage0 ? cloche.bin : s3.bin;
  return {
    help: s(buttons.help),
    bell: s(buttons.bell),
    tray: s(tray),
    frame: o.frames2 ? TIGHT : WIDE,
    bin: o.takenAwayRow ? null : s(bin),
    tallBin: o.frames2,
    takenAway: s(taken.takenAway),
    lid: s(cloche.lid),
    offerYes: s(offer.yes),
    offerNo: s(offer.no),
    peek: s(s0.peek),
    display: s(s0.display),
    backspace: s(s0.backspace),
    digit: (d) => ({
      x: s0.digits.x + d * (s0.digits.h + s0.digitGap),
      y: s0.digits.y,
      w: s0.digits.h,
      h: s0.digits.h,
    }),
  };
}

/** Logical rect of tray cell `i` (reading order, frame 1 first). */
export function cellRect(i: number, tray: Rect, g: FrameGeometry): Rect {
  const fw = frameSize(g.cell, g.gap, g.pad).w;
  const frame = Math.floor(i / 10);
  const j = i % 10;
  return {
    x: tray.x + frame * (fw + g.framesGap) + g.pad + (j % 5) * (g.cell + g.gap),
    y: tray.y + g.pad + Math.floor(j / 5) * (g.cell + g.gap),
    w: g.cell,
    h: g.cell,
  };
}
