// Tunable constants (SPEC §4.2: constants live here; tuned by playtest).

/** Orders per service (SPEC §0: 4/6/8, default 6). */
export const ORDERS_PER_SERVICE = 6;

/** No-repeat window for factKeys (SPEC §4.1 step 5). */
export const REPEAT_WINDOW = 4;

/** Bell double-press guard (PLAN M1 step 6). */
export const BELL_GUARD_MS = 400;

/**
 * The bell rings before the monster speaks (D86): on iOS, starting speech silences WebAudio, so a
 * line spoken at the moment of the press swallowed the ding.
 */
export const BELL_LEAD_MS = 500;

/** Idle cue while building (SPEC §3.2). The spoken ticket no longer repeats on idle (D81). */
export const HAT_PULSE_IDLE_MS = 10_000;

/** FollowMe step cap (SPEC §5.5). */
export const FOLLOW_ME_MAX_STEPS = 10;

/** Coins per completed problem (SPEC §9). Paid from M2; the event shape is frozen in M1. */
export const COINS_PER_PROBLEM = 3;

/** A1 targets ~55/45 add/sub when ops = both (SPEC §1.2). */
export const A1_ADD_SHARE = 0.55;

/** Sampling weight per fact box 0–4; new facts weigh as box 0 (SPEC §4.1 step 4). */
export const BOX_WEIGHTS: readonly number[] = [5, 3, 2, 1, 0.5];

/** New facts introduced per service, at most (SPEC §4.1 step 4, D29). */
export const MAX_NEW_FACTS = 3;

/** Requeues per service, at most (SPEC §4.1 step 7). */
export const MAX_REQUEUES = 2;

/** The monster asks for a favourite food this often (SPEC §4.1 step 6). */
export const FAVORITE_FOOD_SHARE = 0.7;

/** Warm-up order: the ghost hand shows the next step after this much idle time (SPEC §5.4, D26). */
export const WARMUP_GHOST_IDLE_MS = 4000;
