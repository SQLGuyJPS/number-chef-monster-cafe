// One place for logical sizes (CLAUDE.md). Logical px live inside the 1280×720 safe box (SPEC §2.2).
export const STAGE_W = 1280;
export const STAGE_H = 720;

/** Minimums in logical px; at 844×390 the scale is ≈ 0.54, so 88 → ≈ 47.5 CSS px (SPEC §2.2). */
export const CELL = 88;
export const CELL_GAP = 8;
export const FRAME_PADDING = 12;
export const BUTTON_MIN = 112;
export const BIG_BUTTON = 160;
/** The grown-ups' gear (SPEC §5.2, D95): ≈ 47 CSS px at 844×390, so a finger can tell it hit it. */
export const GEAR_SIZE = 88;

/** Asserted by e2e at 844×390 (CLAUDE.md child-safety invariants). */
export const MIN_CELL_CSS_PX = 44;
export const MIN_BUTTON_CSS_PX = 56;

/** Rotated-stage turn cue duration (SPEC §2.2). */
export const TURN_CUE_MS = 6000;

/** Hold time on the gear popup's circle before the grown-ups' screen opens (SPEC §5.2, D94, D95). */
export const GEAR_LONG_PRESS_MS = 2000;
/**
 * Gear popup hold target (D95), logical px: the light circle is wider than a fingertip at every
 * size, and the ring is drawn just outside it so the finger never covers the progress.
 */
export const GEAR_HOLD = { svg: 264, circle: 216, ringR: 120, ringW: 18 } as const;

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

// ---------------------------------------------------------------------------------------------
// Over-the-counter layout: PROPOSAL for the layout mock (`?mock`), not used by the service yet.
// The child stands behind the counter: a status bar on top, the café room with the monster behind
// the counter in the middle, and the counter top as the bottom band holding tray, basket, Pip's
// hat and the bell in one row. Basket on the dominant-hand side; Pip and the bell on the other.
// All counter-band rects below are for a right-handed child; `mirrorX` gives the left-handed ones.
// ---------------------------------------------------------------------------------------------

export type BasketSide = 'right' | 'left';
export type MonsterCut = 'full' | 'waist';

/** Status bar bottom and the counter's far edge (stage y). */
export const BAR_H = 120;
export const COUNTER_Y = 432;
/** Pip's hat and the bell in the counter row (≈ 65 CSS px at 844×390; ≥ BUTTON_MIN). */
const ROW_BTN = 120;
/** Vertical centre of the counter band (y 448–712). */
const ROW_MID = 580;
const rowY = (h: number) => ROW_MID - h / 2;

export const mirrorX = (r: Rect): Rect => ({ ...r, x: STAGE_W - r.x - r.w });

const C_TRAY1: Rect = { x: 364, y: rowY(FRAME.h), w: FRAME.w, h: FRAME.h };
const C_TRAY2_W = 2 * FRAME.w + FRAMES_GAP; // 1016
/** Alternative A: the same 88-px cells with tighter gaps and padding. */
export const TIGHT = { cell: CELL, gap: 4, pad: 8, framesGap: 12 } as const;
const TIGHT_FRAME = frameSize(TIGHT.cell, TIGHT.gap, TIGHT.pad); // 472 × 196
/** Alternative C: the counter edge for skills that use two frames. */
export const COUNTER_Y_TWO_ROW = 370;

/** One layout per mock variant; every rect a tap target or a band the child must see. */
export const COUNTER = {
  /** Status bar (y 0–120): leave sign, coin jar, waiting line walking to the café door icon. */
  bar: {
    door: { x: 8, y: 4, w: BUTTON_MIN, h: BUTTON_MIN },
    jar: { x: 136, y: 14, w: 176, h: 92 },
    line: { x: 328, y: 8, w: 824, h: 108 },
    shop: { x: 1160, y: 8, w: 112, h: 108 },
    /** Mini monsters in the line (real monsters, small), back of the line on the left. */
    mini: 76,
    miniStep: 84,
  },
  /** Room (y 120–432): monster behind the counter, caption left of it, ticket right of it. */
  scene: {
    caption: { x: 226, y: 140, w: 270, h: 124 },
    ticket: { x: 808, y: 140, w: TICKET_W, h: 220 },
    ticketCounting: { x: TICKET_COUNTING_X, y: 140, w: TICKET_W, h: 220 },
    /** Full height: whole body, standing on the counter's far edge. */
    monsterFull: { x: 520, y: COUNTER_Y - 240, w: 240, h: 240 },
    /** Waist: bigger, the lower 30 % (feet and lower belly) hidden behind the counter. */
    monsterWaist: { x: 490, y: COUNTER_Y - 210, w: 300, h: 300 },
    /** Pip pops up behind the counter, under the caption, clear of the waist-size monster. */
    pip: { x: 344, y: COUNTER_Y - 150, w: 124, h: 155 },
    /** CountTogether: Pip and the shrunken monster step left, the bubble fills to the ticket. */
    pipCounting: { x: 262, y: COUNTER_Y - 150, w: 124, h: 155 },
    monsterAside: { x: 120, y: COUNTER_Y - 120, w: 120, h: 120 },
    bubble: { x: 404, y: 140, w: TICKET_COUNTING_X - 16 - 404, h: 282 },
  },
  /** Counter band (y 448–712), right-handed. */
  s3: {
    help: { x: 24, y: rowY(ROW_BTN), w: ROW_BTN, h: ROW_BTN },
    bell: { x: 160, y: rowY(ROW_BTN), w: ROW_BTN, h: ROW_BTN },
    tray: C_TRAY1,
    bin: { x: 924, y: rowY(130), w: 300, h: 130 },
  },
  /**
   * Missing-subtrahend forms: the taken-away row takes the basket's place. On these forms the
   * basket has no job of its own (tapping it does exactly what tapping the row does, D42a), and
   * removed items fly to the row.
   */
  taken: {
    takenAway: { x: 908, y: rowY(TAKEN_FRAME.h), w: TAKEN_FRAME.w, h: TAKEN_FRAME.h },
  },
  /**
   * Two-frame tray (A5+): 1016 px leaves no room for a 300-px basket beside Pip and the bell.
   * Three alternatives for the owner to choose from (none drops below a minimum):
   * A — tighter tray: cell gaps 4 and padding 8 (cells stay 88), Pip's hat on the bell in one
   *     column, a 172-px upright crate.
   * B — basket on the back counter: full-size basket beside the monster on the dominant side under
   *     a shorter ticket; Pip and the bell side by side in the row with the tray.
   * C — two-row counter: the counter edge rises to y 370 for two-frame skills; the tray spans the
   *     top row; Pip, the bell and a full-width, shallow basket share a bottom row.
   */
  frames2a: {
    help: { x: 8, y: 460, w: BUTTON_MIN, h: BUTTON_MIN },
    bell: { x: 8, y: 588, w: BUTTON_MIN, h: BUTTON_MIN },
    tray: { x: 132, y: rowY(TIGHT_FRAME.h), w: 2 * TIGHT_FRAME.w + TIGHT.framesGap, h: TIGHT_FRAME.h },
    bin: { x: 1100, y: 460, w: 172, h: 240 },
  },
  frames2b: {
    help: { x: 16, y: rowY(BUTTON_MIN), w: BUTTON_MIN, h: BUTTON_MIN },
    bell: { x: 136, y: rowY(BUTTON_MIN), w: BUTTON_MIN, h: BUTTON_MIN },
    tray: { x: 256, y: rowY(FRAME.h), w: C_TRAY2_W, h: FRAME.h },
    /** In the room, on the counter's far edge (y 312–432), under the shorter ticket. */
    bin: { x: 838, y: COUNTER_Y - 120, w: 300, h: 120 },
    ticket: { x: 808, y: 130, w: TICKET_W, h: 176 },
  },
  frames2c: {
    counterY: COUNTER_Y_TWO_ROW,
    help: { x: 32, y: 600, w: BUTTON_MIN, h: BUTTON_MIN },
    bell: { x: 160, y: 600, w: BUTTON_MIN, h: BUTTON_MIN },
    tray: { x: centeredX(C_TRAY2_W), y: COUNTER_Y_TWO_ROW + 12, w: C_TRAY2_W, h: FRAME.h },
    bin: { x: 948, y: 600, w: 300, h: BUTTON_MIN },
    monster: { x: 520, y: COUNTER_Y_TWO_ROW - 240, w: 240, h: 240 },
    ticket: { x: 808, y: 134, w: TICKET_W, h: 220 },
  },
  /** S0 pad: Pip, bell, Peek, display, backspace in the upper row; ten digits below. */
  s0: {
    help: { x: 24, y: 456, w: ROW_BTN, h: ROW_BTN },
    bell: { x: 160, y: 456, w: ROW_BTN, h: ROW_BTN },
    peek: { x: 400, y: 460, w: 128, h: BUTTON_MIN },
    display: { x: 544, y: 460, w: 240, h: BUTTON_MIN },
    backspace: { x: 800, y: 460, w: 128, h: BUTTON_MIN },
    digits: { x: centeredX(10 * BUTTON_MIN + 9 * 8), y: 592, w: 10 * BUTTON_MIN + 9 * 8, h: BUTTON_MIN },
    digitGap: 8,
  },
  /** S0 cloche lifted: the tray shifts toward Pip so the lid fits between it and the basket. */
  cloche: {
    tray: { x: 300, y: rowY(FRAME.h), w: FRAME.w, h: FRAME.h },
    lid: { x: 812, y: rowY(BUTTON_MIN), w: BUTTON_MIN, h: BUTTON_MIN },
    bin: { x: 940, y: rowY(130), w: 300, h: 130 },
  },
  /** Help offer: two 220-px picture buttons over the (hidden) tray. */
  offer: {
    yes: { x: 362, y: rowY(220), w: 220, h: 220 },
    no: { x: 642, y: rowY(220), w: 220, h: 220 },
  },
} as const;

/** A counter-band rect for the child's basket side. */
export const forSide = (r: Rect, side: BasketSide): Rect => (side === 'left' ? mirrorX(r) : r);
