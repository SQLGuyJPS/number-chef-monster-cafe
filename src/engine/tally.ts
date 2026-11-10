// Results tally (SPEC §5.7): the coin count ticks up by one, silently but for a coin "ting" per
// step, then the total is said once. Spoken counting was dropped after playtest: speech could not
// finish one number before the next.

/** First step: about three numbers a second, slow enough to follow the first few. */
export const TALLY_START_MS = 333;
/** Cap: ten a second. Faster than this and the numbers blur. */
export const TALLY_FLOOR_MS = 100;
/** How quickly the pace eases from start to cap (steps per e-fold). 23 coins ≈ 3.8 s. */
const TALLY_EASE_STEPS = 7;

/** Delay before step `i` (i = 0 is the step from 1 to 2): eases exponentially down to the cap. */
export function tallyDelayMs(i: number): number {
  return Math.round(TALLY_FLOOR_MS + (TALLY_START_MS - TALLY_FLOOR_MS) * Math.exp(-i / TALLY_EASE_STEPS));
}

export interface TallyStep {
  n: number;
  /** Time from the start of the count; the first number shows at 0. */
  atMs: number;
}

/** Every number from 1 to `total`, each with its time. Empty for 0 (straight to the end). */
export function tallySchedule(total: number): TallyStep[] {
  const out: TallyStep[] = [];
  let at = 0;
  for (let n = 1; n <= total; n++) {
    out.push({ n, atMs: at });
    at += tallyDelayMs(n - 1);
  }
  return out;
}
