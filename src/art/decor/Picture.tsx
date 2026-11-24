// A shop picture of one entry (SPEC §10): the café cropped to the entry's slot, with the entry in
// place and everything else on the café's defaults, drawn still. Used on the shelf tiles, the
// confirm card and the delivery. A free default shows the café as it is.
import type { Rect } from '../../app/metrics';
import type { DecorSlot } from '../../engine/economy';
import { CounterScene } from '../CounterScene';
import type { DecorLook } from './StandIn';

/**
 * What each slot's picture shows, in stage coordinates, at the pictures' 5:4: the wall above the
 * monster, a stretch of floor, the right run of lights with the ceiling pieces, the whole window,
 * the counter-top spot on its edge, and the wall-art spot.
 */
const CROP: Readonly<Record<Exclude<DecorSlot, 'staff'>, Rect>> = {
  wallpaper: { x: 552, y: 122, w: 176, h: 141 },
  floor: { x: 576, y: 331, w: 128, h: 102 },
  lights: { x: 870, y: 104, w: 260, h: 208 },
  window: { x: 196, y: 122, w: 238, h: 190 },
  counter: { x: 1148, y: 320, w: 152, h: 122 },
  wallArt: { x: 530, y: 76, w: 220, h: 176 },
};

/**
 * Items much smaller than their slot get a closer crop: one swag of a string, the ceiling pieces,
 * the clock. Keyed `slot.item`.
 */
const ITEM_CROP: Readonly<Record<string, Rect>> = {
  'lights.string-lights': { x: 825, y: 112, w: 160, h: 128 },
  'lights.paper-lanterns': { x: 825, y: 112, w: 160, h: 128 },
  'lights.disco-ball': { x: 940, y: 112, w: 120, h: 96 },
  'lights.star-chandelier': { x: 916, y: 106, w: 168, h: 134 },
  'wallArt.giant-clock': { x: 580, y: 116, w: 120, h: 96 },
};

export function DecorPicture({ look, free = false }: { look: DecorLook; free?: boolean }) {
  if (look.slot === 'staff') return null;
  const crop = ITEM_CROP[`${look.slot}.${look.item}`] ?? CROP[look.slot];
  return <CounterScene decor={free ? {} : { [look.slot]: look }} crop={crop} />;
}
