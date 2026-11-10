// Roster data the engine needs (SPEC §7.2): ids and favourite foods drive the session builder
// (§4.1 step 6). The look and voice live with the art (MonsterSpec, M2 art step).
import type { FoodId } from './foods';

export interface MonsterRef {
  id: string;
  favorites: readonly [FoodId, FoodId];
}

/** The six regulars. Guests (Spindle, Drizzle) join after the 5th and 15th service (SPEC §7.2). */
export const REGULARS: readonly MonsterRef[] = [
  { id: 'blobbo', favorites: ['cake', 'strawberry'] },
  { id: 'gruffles', favorites: ['burger', 'hotdog'] },
  { id: 'zibbit', favorites: ['cookie', 'doughnut'] },
  { id: 'mimsy', favorites: ['bread', 'tangerine'] },
  { id: 'chompers', favorites: ['pizza', 'riceball'] },
  { id: 'wobbleton', favorites: ['icecream', 'banana'] },
];

export const GUESTS: readonly MonsterRef[] = [
  { id: 'spindle', favorites: ['croissant', 'apple'] },
  { id: 'drizzle', favorites: ['taco', 'carrot'] },
];
