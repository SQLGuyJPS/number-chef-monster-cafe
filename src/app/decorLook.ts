// From a catalog entry to what the café draws (SPEC §7.4, D148): colours come from the shared
// families; an item's one designed look ('classic') gets a neutral stand-in pair until M4b draws it.
import { COLOR_FAMILIES, type DecorSlot, type ShopEntry } from '../engine/economy';
import type { DecorLook } from '../art/decor/StandIn';

const CLASSIC = { base: '#ece3d2', accent: '#9a8468' } as const;

export function lookFor(e: ShopEntry): DecorLook {
  const c = e.colorway === 'classic' ? CLASSIC : COLOR_FAMILIES[e.colorway];
  return { slot: e.slot as DecorSlot, item: e.item, name: e.name, base: c.base, accent: c.accent };
}

export const swatchOf = (e: ShopEntry): string =>
  e.colorway === 'classic' ? CLASSIC.accent : COLOR_FAMILIES[e.colorway].accent;
