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

/** Bell beside a tray, vertically centred on the tray band (D63). */
const BELL = 144;
const bellRightOf = (trayRight: number): Rect => ({
  x: trayRight + 32,
  y: TRAY_TOP + Math.round((FRAME.h - BELL) / 2),
  w: BELL,
  h: BELL,
});
const FRAMES2_W = 2 * FRAME.w + FRAMES_GAP;
const FRAMES2_X = 40;
const BUBBLE_W = 2 * MINI_FRAME.w + 12 + 16; // two mini frames + gap + padding; used for one frame too

/**
 * Service screen layout (SPEC §5.4 as amended by D63; S0 band per D48/D62). Fixed by the M1 layout
 * mock. Bands: ticket (centre) and monster (right) y 40–300 · tray y 311–519 · bottom y 570–700.
 * The ticket sits straight above the tray so the problem and the plate read as one column; the bell
 * sits beside the tray so serving reads as "send this plate" (D63).
 */
export const SERVICE = {
  door: { x: 16, y: 16, w: 112, h: 112 },
  /** Waiting monsters line up by the door (left); the served monster walks to the counter (right). */
  queue: { x: 0, y: 150, w: 400, h: 150 },
  ticket: { x: centeredX(380), y: 50, w: 380, h: 220 },
  monsterZone: { x: 880, y: 40, w: 360, h: 260 },
  trayFrames1: { x: centeredX(FRAME.w), y: TRAY_TOP, w: FRAME.w, h: FRAME.h },
  /** M5: the two-frame tray shifts left so the bell still fits beside it. */
  trayFrames2: { x: FRAMES2_X, y: TRAY_TOP, w: FRAMES2_W, h: FRAME.h },
  bell: bellRightOf(centeredX(FRAME.w) + FRAME.w),
  bellFrames2: bellRightOf(FRAMES2_X + FRAMES2_W),
  /** Left of a centred frames1 tray (the bell has the right side); missing-subtrahend forms only. */
  takenAway: {
    x: centeredX(FRAME.w) - 28 - TAKEN_FRAME.w,
    y: TRAY_TOP + Math.round((FRAME.h - TAKEN_FRAME.h) / 2),
    w: TAKEN_FRAME.w,
    h: TAKEN_FRAME.h,
  },
  help: { x: 40, y: 576, w: 140, h: 124 },
  /** Bin centred under the tray; "take one back" right of it (add mode only). */
  bin: { x: centeredX(300), y: 570, w: 300, h: 130 },
  takeBack: { x: centeredX(300) + 320, y: 582, w: 124, h: 112 },
  /** S0 (D48, D62, D63): Peek · display · backspace · bell in one row above the digit row. */
  s0Peek: { x: 376, y: 292, w: 128, h: 112 },
  s0Display: { x: 520, y: 292, w: 240, h: 112 },
  s0Backspace: { x: 776, y: 292, w: 128, h: 112 },
  s0Bell: { x: 928, y: 288, w: 120, h: 120 },
  s0Digits: { x: centeredX(10 * BUTTON_MIN + 9 * 8), y: 414, w: 10 * BUTTON_MIN + 9 * 8, h: BUTTON_MIN },
  s0DigitGap: 8,
  /** Lifted cloche lid left of the S3 tray; tapping it closes the cloche and brings the digits back (D62). */
  clocheLid: { x: 200, y: 330, w: 150, h: 150 },
  /** CountTogether bubble in the monster zone, one width for one or two frames; the monster shrinks below its tail (D63). */
  bubble: { x: STAGE_W - 6 - BUBBLE_W, y: 40, w: BUBBLE_W, h: 196 },
  monsterAside: { x: 1172, y: 240, w: 64, h: 64 },
} as const satisfies Record<string, Rect | number>;
