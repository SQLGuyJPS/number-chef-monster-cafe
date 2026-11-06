// One place for logical sizes (CLAUDE.md). Logical px live inside the 1280×720 safe box (SPEC §2.2).
export const STAGE_W = 1280;
export const STAGE_H = 720;

/** Minimums in logical px; at 844×390 the scale is ≈ 0.54, so 88 → ≈ 47.5 CSS px (SPEC §2.2). */
export const CELL = 88;
export const CELL_GAP = 8;
export const FRAME_PADDING = 12;
export const BUTTON_MIN = 112;
export const BIG_BUTTON = 160;
export const GEAR_SIZE = 44;

/** Asserted by e2e at 844×390 (CLAUDE.md child-safety invariants). */
export const MIN_CELL_CSS_PX = 44;
export const MIN_BUTTON_CSS_PX = 56;

/** Rotated-stage turn cue duration (SPEC §2.2). */
export const TURN_CUE_MS = 6000;

/** A rectangle in logical stage px. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Ten-frame geometry (SPEC §3.3): 2 rows × 5 cells. */
export const frameSize = (cell: number, gap: number, pad: number) => ({
  w: 5 * cell + 4 * gap + 2 * pad,
  h: 2 * cell + gap + 2 * pad,
});
export const FRAME = frameSize(CELL, CELL_GAP, FRAME_PADDING); // 496 × 208
export const FRAMES_GAP = 24;

/** CountTogether mini frames (SPEC §5.5: cells 36 logical). Gap and padding trimmed so two fit ≈ 412 px. */
export const MINI_CELL = 36;
export const MINI_GAP = 3;
export const MINI_PAD = 4;
export const MINI_FRAME = frameSize(MINI_CELL, MINI_GAP, MINI_PAD); // 200 × 83

/** Taken-away row (SPEC §3.3, D62): a small 2×5 grid that is tapped as one target. */
export const TAKEN_CELL = 56;
export const TAKEN_GAP = 6;
export const TAKEN_PAD = 10;
export const TAKEN_FRAME = frameSize(TAKEN_CELL, TAKEN_GAP, TAKEN_PAD); // 324 × 138

const TRAY_TOP = 311;
const centeredX = (w: number) => Math.round((STAGE_W - w) / 2);

const BIN: Rect = { x: centeredX(300), y: 570, w: 300, h: 130 };
const TAKE_BACK: Rect = { x: BIN.x + BIN.w + 20, y: 582, w: 124, h: 112 };
/** The bell sits right of the bin, or right of "take one back" when that button shows (D64). */
const bellAfter = (r: Rect): Rect => ({ x: r.x + r.w + 20, y: 562, w: 144, h: 144 });
const BUBBLE_W = 2 * MINI_FRAME.w + 12 + 16; // two mini frames + gap + padding; used for one frame too
const MONSTER: Rect = { x: centeredX(240), y: 52, w: 240, h: 240 };
const TICKET_W = 360;
// Centred over the monster's spot, top at y 8 so it clears the waiting line on the left.
const BUBBLE: Rect = { x: centeredX(BUBBLE_W), y: 8, w: BUBBLE_W, h: 210 };

/**
 * Service screen layout (SPEC §5.4 as amended by D63–D65; S0 band per D48/D62). Fixed by the M1
 * layout mock. Bands: monster (centre) with the ticket right beside it, y 40–300 · tray y 311–519 ·
 * bottom y 570–700 (Pip's hat, bin, take one back, bell). The monster is in the middle so the child
 * feels they are serving it; the ticket sits beside it so order and customer read as one (D65).
 */
export const SERVICE = {
  door: { x: 16, y: 16, w: 112, h: 112 },
  /**
   * Caption bubble just left of the monster, its tail pointing at it (D70 as amended by D76). It
   * hides while the CountTogether bubble is up, which replaces it.
   */
  caption: { x: 250, y: 16, w: 270, h: 124 },
  /** Waiting monsters line up by the door, left of the monster at the counter. */
  queue: { x: 0, y: 150, w: 340, h: 150 },
  monsterZone: MONSTER,
  /** Right beside the centred monster (D65). */
  ticket: { x: MONSTER.x + MONSTER.w + 24, y: 50, w: TICKET_W, h: 220 },
  /** During CountTogether the ticket slides right to make room for the bubble (D65). */
  ticketCounting: { x: STAGE_W - 16 - TICKET_W, y: 50, w: TICKET_W, h: 220 },
  trayFrames1: { x: centeredX(FRAME.w), y: TRAY_TOP, w: FRAME.w, h: FRAME.h },
  trayFrames2: {
    x: centeredX(2 * FRAME.w + FRAMES_GAP),
    y: TRAY_TOP,
    w: 2 * FRAME.w + FRAMES_GAP,
    h: FRAME.h,
  },
  /** Left of a centred frames1 tray; missing-subtrahend forms only (D63). */
  takenAway: {
    x: centeredX(FRAME.w) - 28 - TAKEN_FRAME.w,
    y: TRAY_TOP + Math.round((FRAME.h - TAKEN_FRAME.h) / 2),
    w: TAKEN_FRAME.w,
    h: TAKEN_FRAME.h,
  },
  help: { x: 40, y: 576, w: 140, h: 124 },
  /** Bin centred under the tray; "take one back" right of it (add mode only). */
  bin: BIN,
  takeBack: TAKE_BACK,
  /** Bell when "take one back" shows (add mode) … */
  bell: bellAfter(TAKE_BACK),
  /** … and when it does not (remove mode, and S0, where the bell keeps the same spot, D64). */
  bellNoTakeBack: bellAfter(BIN),
  /** S0 (D48, D62): Peek · display · backspace in one row above the digit row. */
  s0Peek: { x: 360, y: 292, w: 128, h: 112 },
  s0Display: { x: 520, y: 292, w: 240, h: 112 },
  s0Backspace: { x: 776, y: 292, w: 128, h: 112 },
  s0Digits: { x: centeredX(10 * BUTTON_MIN + 9 * 8), y: 414, w: 10 * BUTTON_MIN + 9 * 8, h: BUTTON_MIN },
  s0DigitGap: 8,
  /** Lifted cloche lid left of the S3 tray; tapping it closes the cloche and brings the digits back (D62). */
  clocheLid: { x: 200, y: 330, w: 150, h: 150 },
  /** CountTogether bubble over the monster's spot, one width for one or two frames; the monster shrinks below its tail. */
  bubble: BUBBLE,
  monsterAside: { x: BUBBLE.x + BUBBLE.w - 92, y: BUBBLE.y + BUBBLE.h + 22, w: 64, h: 64 },
} as const satisfies Record<string, Rect | number>;
