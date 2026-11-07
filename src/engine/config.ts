// Tunable constants (SPEC §4.2: constants live here; tuned by playtest).

/** Orders per service (SPEC §0: 4/6/8, default 6). */
export const ORDERS_PER_SERVICE = 6;

/** No-repeat window for factKeys (SPEC §4.1 step 5). */
export const REPEAT_WINDOW = 4;

/** Bell double-press guard (PLAN M1 step 6). */
export const BELL_GUARD_MS = 400;

/** Idle cue while building (SPEC §3.2). The spoken ticket no longer repeats on idle (D81). */
export const HAT_PULSE_IDLE_MS = 10_000;

/** FollowMe step cap (SPEC §5.5). */
export const FOLLOW_ME_MAX_STEPS = 10;

/** Coins per completed problem (SPEC §9). Paid from M2; the event shape is frozen in M1. */
export const COINS_PER_PROBLEM = 3;

/** A1 targets ~55/45 add/sub when ops = both (SPEC §1.2). */
export const A1_ADD_SHARE = 0.55;
