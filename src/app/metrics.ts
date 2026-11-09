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

/**
 * Pip's hand-off back to the monster (D91). Pip's exit and the monster's walk back match the
 * `.pip-slot.leaving` and `.monster-slot` durations in service.css; the waiting line returns only
 * once the monster is back in its spot, so it never appears under the moving monster.
 */
export const PIP_EXIT_MS = 500;
export const MONSTER_MOVE_MS = 550;

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

/**
 * CountTogether model frames (SPEC §5.5, D84): as big as the bubble allows. One frame uses 64-px
 * cells; two frames sit side by side with 42-px cells (≈ 35 / 23 CSS px on an iPhone; was 19).
 */
export const MODEL_ONE = { cell: 64, gap: 4, pad: 6 } as const;
export const MODEL_TWO = { cell: 42, gap: 3, pad: 4 } as const;
export const MODEL_FRAMES_GAP = 12;

/** Taken-away row (SPEC §3.3, D62): a small 2×5 grid that is tapped as one target. */
export const TAKEN_CELL = 56;
export const TAKEN_GAP = 6;
export const TAKEN_PAD = 10;
export const TAKEN_FRAME = frameSize(TAKEN_CELL, TAKEN_GAP, TAKEN_PAD); // 324 × 138

const TRAY_TOP = 311;
const centeredX = (w: number) => Math.round((STAGE_W - w) / 2);

const BIN: Rect = { x: centeredX(300), y: 570, w: 300, h: 130 };
const MONSTER: Rect = { x: centeredX(240), y: 52, w: 240, h: 240 };
const TICKET_W = 360;
const TICKET_COUNTING_X = STAGE_W - 16 - TICKET_W;
/**
 * CountTogether (D84): the monster steps left onto the counter and the bubble fills the space from
 * its right side to the ticket, from the top of the screen down to the counter.
 */
const ASIDE: Rect = { x: 262, y: 172, w: 120, h: 120 };
/**
 * Pip (D90) stands on the counter left of the monster while help is offered or given, under the
 * caption bubble. During CountTogether Pip takes the spot the shrunken monster used, so the model
 * bubble's tail points at Pip, and the monster steps further left (the queue hides while Pip is out).
 */
const PIP: Rect = { x: 262, y: 150, w: 124, h: 155 };
const ASIDE_FOR_PIP: Rect = { x: 120, y: 172, w: 120, h: 120 };
const BUBBLE_X = ASIDE.x + ASIDE.w + 22;
const BUBBLE: Rect = { x: BUBBLE_X, y: 8, w: TICKET_COUNTING_X - 16 - BUBBLE_X, h: 282 };

/**
 * Service screen layout (SPEC §5.4 as amended by D63–D65; S0 band per D48/D62). Fixed by the M1
 * layout mock. Bands: monster (centre) with the ticket right beside it, y 40–300 · tray y 311–519 ·
 * bottom y 570–700 (Pip's hat, bin, bell). The monster is in the middle so the child
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
  ticketCounting: { x: TICKET_COUNTING_X, y: 50, w: TICKET_W, h: 220 },
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
  /** Bin centred under the tray. */
  bin: BIN,
  /** Bell right of the bin at every stage and in every mode (D64; "take one back" removed, D82). */
  bell: { x: BIN.x + BIN.w + 20, y: 562, w: 144, h: 144 },
  /** S0 (D48, D62): Peek · display · backspace in one row above the digit row. */
  s0Peek: { x: 360, y: 292, w: 128, h: 112 },
  s0Display: { x: 520, y: 292, w: 240, h: 112 },
  s0Backspace: { x: 776, y: 292, w: 128, h: 112 },
  s0Digits: { x: centeredX(10 * BUTTON_MIN + 9 * 8), y: 414, w: 10 * BUTTON_MIN + 9 * 8, h: BUTTON_MIN },
  s0DigitGap: 8,
  /** Lifted cloche lid left of the S3 tray; tapping it closes the cloche and brings the digits back (D62). */
  clocheLid: { x: 200, y: 330, w: 150, h: 150 },
  /** Help offer after the second miss (D89): two big picture buttons over the tray band. */
  offerYes: { x: centeredX(2 * 220 + 80), y: 300, w: 220, h: 220 },
  offerNo: { x: centeredX(2 * 220 + 80) + 220 + 80, y: 300, w: 220, h: 220 },
  /** CountTogether bubble right of the shrunken monster, its tail pointing left at it (D84). */
  bubble: BUBBLE,
  monsterAside: ASIDE,
  pip: PIP,
  monsterAsideForPip: ASIDE_FOR_PIP,
} as const satisfies Record<string, Rect | number>;
