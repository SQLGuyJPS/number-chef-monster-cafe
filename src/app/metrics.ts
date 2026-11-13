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

/** Pip sinks back behind the counter (D91); matches `.pip-slot.leaving` in service.css. */
export const PIP_EXIT_MS = 500;

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

const centeredX = (w: number) => Math.round((STAGE_W - w) / 2);
const TICKET_W = 360;
const TICKET_COUNTING_X = STAGE_W - 16 - TICKET_W;

// ---------------------------------------------------------------------------------------------
// Service screen layout (SPEC §5.4, D114–D118), seen from behind the counter; `?mock` shows every
// variant without playing. The child stands behind the counter: a status bar on top, the café room with the monster behind
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
/** Two-frame tray: the same 88-px cells with tighter gaps and padding. */
export const TIGHT = { cell: CELL, gap: 4, pad: 8, framesGap: 12 } as const;
const TIGHT_FRAME = frameSize(TIGHT.cell, TIGHT.gap, TIGHT.pad); // 472 × 196

/** The cloche's plate shows this far past the tray on each side (service.css .cloche-plate). */
export const PLATE_BLEED = 20;
/** The crate is drawn this far inside the basket's tap box (service.css .bin-crate). */
export const CRATE_INSET = 10;
const CLOCHE_TRAY: Rect = { x: 304, y: rowY(FRAME.h), w: FRAME.w, h: FRAME.h };
const CLOCHE_BIN: Rect = { x: 960, y: rowY(130), w: 300, h: 130 };
/**
 * The lid's drawing (the tilted dome plus its "123" badge) reaches further toward the basket than
 * toward the tray, so what the eye sees is centred this far toward the basket from its tap box.
 */
export const LID_ART_SHIFT = 16;
const CLOCHE_LID_X = Math.round(
  (CLOCHE_TRAY.x + CLOCHE_TRAY.w + PLATE_BLEED + CLOCHE_BIN.x + CRATE_INSET) / 2 - BUTTON_MIN / 2 - LID_ART_SHIFT,
);

/** One layout per mock variant; every rect a tap target or a band the child must see. */
export const COUNTER = {
  /**
   * Status bar (y 0–120): leave sign, coin jar, the little café, and the waiting line walking left
   * into it (D120), the way monsters come in at the room's door on the left. The jar keeps one spot
   * on every screen that shows it.
   */
  bar: {
    door: { x: 8, y: 4, w: BUTTON_MIN, h: BUTTON_MIN },
    jar: { x: 136, y: 14, w: 176, h: 92 },
    shop: { x: 328, y: 8, w: 112, h: 108 },
    line: { x: 448, y: 8, w: 824, h: 108 },
    /** Mini monsters in the line (real monsters, small), front of the line at the café, on the left. */
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
   * Two-frame tray (A5+, owner's pick of three, "A"): two full frames plus a 300-px basket and two
   * buttons need more than 1280 px. The frames keep 88-px cells with tighter gaps and padding, Pip's
   * hat sits on the bell in one column, and the basket is an upright crate with a two-row heap
   * (a third row perched on top looked precarious).
   */
  frames2: {
    help: { x: 8, y: 460, w: BUTTON_MIN, h: BUTTON_MIN },
    bell: { x: 8, y: 588, w: BUTTON_MIN, h: BUTTON_MIN },
    tray: { x: 132, y: rowY(TIGHT_FRAME.h), w: 2 * TIGHT_FRAME.w + TIGHT.framesGap, h: TIGHT_FRAME.h },
    bin: { x: 1100, y: rowY(200), w: 172, h: 200 },
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
  /**
   * S0 cloche lifted: the tray shifts toward Pip and the basket toward the edge, and the lid sits
   * centred between what the eye sees (D120): the plate's rim and the crate's side.
   */
  cloche: {
    tray: CLOCHE_TRAY,
    lid: { x: CLOCHE_LID_X, y: rowY(BUTTON_MIN), w: BUTTON_MIN, h: BUTTON_MIN },
    bin: CLOCHE_BIN,
  },
  /** Help offer: two 220-px picture buttons over the (hidden) tray. */
  offer: {
    yes: { x: 362, y: rowY(220), w: 220, h: 220 },
    no: { x: 642, y: rowY(220), w: 220, h: 220 },
  },
} as const;

/** A counter-band rect for the child's basket side. */
export const forSide = (r: Rect, side: BasketSide): Rect => (side === 'left' ? mirrorX(r) : r);
