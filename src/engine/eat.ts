// Eat sequence timing (SPEC §5.6): food flies into the mouth in groups, ≤ 5 items one by one
// (each counted aloud), more by rows of five with the total spoken at the end; 3 chews; the
// monster's reaction. Eat + react must stay ≤ 4 s for every answer the tray can hold (D101).

/** One item flying in (answers ≤ 5, counted aloud). */
export const EAT_ITEM_MS = 260;
/** One row of up to five (answers > 5). */
export const EAT_ROW_MS = 380;
/** Three chews (monsters.css `m-chew` is 0.35 s × 3). */
export const CHEW_MS = 1050;
/** The monster's reaction (monsters.css reactions are ≈ 1.3–1.4 s). */
export const REACT_MS = 1300;
/** Coins fly to the jar one by one after the reaction (SPEC §9), outside the 4 s budget. */
export const COIN_GAP_MS = 220;
export const COIN_FLY_MS = 450;

export const EAT_BUDGET_MS = 4000;

/** Group sizes in flight order: singles up to 5, else rows of five (the ten-frame rows). */
export function eatGroups(n: number): number[] {
  if (n <= 5) return Array.from({ length: Math.max(0, n) }, () => 1);
  const out: number[] = [];
  for (let left = n; left > 0; left -= 5) out.push(Math.min(5, left));
  return out;
}

export const flyMs = (n: number): number => (n <= 5 ? EAT_ITEM_MS : EAT_ROW_MS);

/** Eat + react duration for an answer of `n` (the bell lead before it is not part of it). */
export const eatReactMs = (n: number): number => eatGroups(n).length * flyMs(n) + CHEW_MS + REACT_MS;
