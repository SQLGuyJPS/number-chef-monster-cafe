// Basket side (SPEC §5.4, §12, D115): a per-device setting, right by default. Stored in the
// `settings` store; set in the playtest tools until M3b moves it to the parent area.
import type { BasketSide } from './metrics';
import type { Storage } from '../storage/types';

export const BASKET_SIDE_KEY = 'basketSide';
export const DEFAULT_BASKET_SIDE: BasketSide = 'right';

export async function loadBasketSide(storage: Storage): Promise<BasketSide> {
  try {
    return (await storage.getSetting(BASKET_SIDE_KEY)) === 'left' ? 'left' : DEFAULT_BASKET_SIDE;
  } catch {
    return DEFAULT_BASKET_SIDE;
  }
}

export function saveBasketSide(storage: Storage, side: BasketSide): Promise<void> {
  return storage.setSetting(BASKET_SIDE_KEY, side);
}
