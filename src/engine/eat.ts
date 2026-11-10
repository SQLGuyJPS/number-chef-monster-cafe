// Eat sequence timing (SPEC §5.6): the whole plate flies into the mouth together and the monster
// says the answer once; 3 chews; the monster's reaction. Eat + react must stay ≤ 4 s for every
// answer the tray can hold (D101). Counting each item aloud was dropped: the words came 0.26 s
// apart and tripped over each other (D103).

/** Each item leaves this much after the one before it, so the plate streams in rather than jumps. */
export const EAT_STAGGER_MS = 20;
/** One item's flight (service.css `eat-fly`). */
export const EAT_FLIGHT_MS = 340;
/** Three chews (monsters.css `m-chew` is 0.35 s × 3). */
export const CHEW_MS = 1050;
/** The monster's reaction (monsters.css reactions are ≈ 1.3–1.4 s). */
export const REACT_MS = 1300;
/** Coins fly to the jar one by one after the reaction (SPEC §9), outside the 4 s budget. */
export const COIN_GAP_MS = 220;
export const COIN_FLY_MS = 450;

export const EAT_BUDGET_MS = 4000;

/** Time until the last of `n` items reaches the mouth. */
export const flyMs = (n: number): number => Math.max(0, n - 1) * EAT_STAGGER_MS + EAT_FLIGHT_MS;

/** Eat + react duration for an answer of `n` (the bell lead before it is not part of it). */
export const eatReactMs = (n: number): number => flyMs(n) + CHEW_MS + REACT_MS;
