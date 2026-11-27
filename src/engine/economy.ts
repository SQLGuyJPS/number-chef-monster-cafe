// Shop catalog and price tiers (SPEC §9, §10, D148). Sized for about an hour of play a week: the
// M4 stock lasts about 2 months, the later groups (D149, D157) about 6–9 more. Check a price change with
// `npm run economy:sim` (engine/economySim.ts, D150) before it ships. Earning rates stay in
// engine/config.ts (COINS_PER_PROBLEM, SERVICE_TIP); only spending lives here.

export type DecorSlot =
  'wallpaper' | 'floor' | 'lights' | 'window' | 'counter' | 'wallArt' | 'staff';
export type MonsterSlot = 'hat' | 'skin' | 'accessory';
export type ShopSlot = DecorSlot | MonsterSlot;

/**
 * Price tiers, sized against what a child earns (about 23 coins a service, 4 services a sitting):
 * 1 ≈ one service, 2 ≈ two services, 3 ≈ most of a sitting, 4 ≈ two sittings, 5 ≈ most of a week
 * at an hour a week. Young children save for at most a week or two, so tier 5 stays under that.
 */
export type Tier = 1 | 2 | 3 | 4 | 5;
export const TIER_PRICE: Readonly<Record<Tier, number>> = { 1: 20, 2: 30, 3: 55, 4: 100, 5: 180 };

/**
 * Colour families shared across slots, so a Berry wallpaper, Berry tiles and Berry lanterns match.
 * Values are drafts for the art pass; they sit a step paler than the foreground (SPEC §7.4: muted
 * background). `classic` means the item's one designed look (no family).
 */
export const COLOR_FAMILIES = {
  sunny: { label: 'Sunny', base: '#ffe2a8', accent: '#f0b54a' },
  berry: { label: 'Berry', base: '#f7c4d8', accent: '#d9487f' },
  mint: { label: 'Mint', base: '#c6ecd9', accent: '#3aa57a' },
  sky: { label: 'Sky', base: '#c4e0f6', accent: '#3d86c6' },
  honey: { label: 'Honey', base: '#ffdc85', accent: '#d99a1e' },
  lavender: { label: 'Lavender', base: '#ddd0f4', accent: '#7d5cc4' },
  cocoa: { label: 'Cocoa', base: '#d9b694', accent: '#7a4e2d' },
} as const;
export type ColorFamily = keyof typeof COLOR_FAMILIES;
export type Colorway = ColorFamily | 'classic';

export interface ItemDef {
  /** Stable id stem; each colorway becomes `${slot}.${id}.${colorway}`. */
  id: string;
  slot: ShopSlot;
  name: string;
  tier: Tier;
  /** First entry is the item's original look. Max 3 in M4 (owner, 2026-11-21). */
  colorways: readonly Colorway[];
  /** The slot's free default: its first colorway costs nothing, the others cost tier 1. */
  free?: boolean;
}

/** One purchasable (or free) entry: an item in one colorway. */
export interface ShopEntry {
  key: string;
  slot: ShopSlot;
  item: string;
  name: string;
  colorway: Colorway;
  tier: Tier;
  price: number;
}

export function entryPrice(
  def: ItemDef,
  index: number,
  tiers: Readonly<Record<Tier, number>> = TIER_PRICE,
): number {
  if (def.free) return index === 0 ? 0 : tiers[1];
  // Every colorway costs the item's price, and any of them can be bought first (D177): a cheaper
  // second colour only made sense when the first had to be bought before the others.
  return tiers[def.tier];
}

/**
 * Round-robin across item names, so a crate mixes, say, a wallpaper and a lamp rather than two
 * colours of one thing. Deterministic: the crate order is fixed, never random (D154).
 */
export function interleave<E extends { name: string }>(entries: readonly E[]): E[] {
  const groups = new Map<string, E[]>();
  for (const e of entries) {
    const list = groups.get(e.name) ?? [];
    list.push(e);
    groups.set(e.name, list);
  }
  const lists = [...groups.values()];
  const out: E[] = [];
  for (let i = 0; out.length < entries.length; i++) {
    for (const list of lists) if (i < list.length) out.push(list[i]!);
  }
  return out;
}

export function expandCatalog(
  defs: readonly ItemDef[],
  tiers: Readonly<Record<Tier, number>> = TIER_PRICE,
): ShopEntry[] {
  return defs.flatMap((def) =>
    def.colorways.map((colorway, i) => ({
      key: `${def.slot}.${def.id}.${colorway}`,
      slot: def.slot,
      item: def.id,
      name: def.name,
      colorway,
      tier: def.tier,
      price: entryPrice(def, i, tiers),
    })),
  );
}

/**
 * M4 shop: SPEC §10's items with tiers, plus 2–3 colorways on items where paint makes sense.
 * No colorways on scenes (windows), named looks (Brick, Starry Night, Rainbow), metal or glass
 * (Disco Ball, Chandelier, Fish Bowl, Trophies), or the menu board (chalk). The serve bell is not a
 * shop item: the child always needs it to serve, so it is never swapped out (D159). Families are spread so every family appears in several slots. The staff slot
 * (Pip as its free default plus five animals) moved to M18 (D157); it is planned in LATER_GROUPS.
 */
export const M4_ITEMS: readonly ItemDef[] = [
  // Wallpaper
  {
    id: 'plain',
    slot: 'wallpaper',
    name: 'Plain Paint',
    tier: 1,
    colorways: ['sunny', 'berry', 'lavender'],
    free: true,
  },
  {
    id: 'polka-dots',
    slot: 'wallpaper',
    name: 'Polka Dots',
    tier: 2,
    colorways: ['berry', 'sky', 'lavender'],
  },
  {
    id: 'stripes',
    slot: 'wallpaper',
    name: 'Stripes',
    tier: 2,
    colorways: ['mint', 'honey', 'berry'],
  },
  { id: 'brick', slot: 'wallpaper', name: 'Brick', tier: 3, colorways: ['classic'] },
  { id: 'starry-night', slot: 'wallpaper', name: 'Starry Night', tier: 4, colorways: ['classic'] },
  { id: 'rainbow', slot: 'wallpaper', name: 'Rainbow', tier: 4, colorways: ['classic'] },
  // Floor
  {
    id: 'wood',
    slot: 'floor',
    name: 'Wood',
    tier: 1,
    // Classic is the floor the café art already has (D152).
    colorways: ['classic', 'honey', 'cocoa'],
    free: true,
  },
  {
    id: 'checkerboard',
    slot: 'floor',
    name: 'Checkerboard',
    tier: 2,
    colorways: ['classic', 'berry', 'mint'],
  },
  { id: 'tiles', slot: 'floor', name: 'Tiles', tier: 2, colorways: ['berry', 'sky', 'mint'] },
  {
    id: 'cloud-carpet',
    slot: 'floor',
    name: 'Cloud Carpet',
    tier: 4,
    colorways: ['sky', 'lavender', 'berry'],
  },
  // Lights
  { id: 'none', slot: 'lights', name: 'No Lights', tier: 1, colorways: ['classic'], free: true },
  {
    id: 'string-lights',
    slot: 'lights',
    name: 'String Lights',
    tier: 2,
    colorways: ['honey', 'berry', 'sky'],
  },
  {
    id: 'paper-lanterns',
    slot: 'lights',
    name: 'Paper Lanterns',
    tier: 3,
    colorways: ['berry', 'mint', 'honey'],
  },
  { id: 'disco-ball', slot: 'lights', name: 'Disco Ball', tier: 4, colorways: ['classic'] },
  {
    id: 'star-chandelier',
    slot: 'lights',
    name: 'Star Chandelier',
    tier: 5,
    colorways: ['classic'],
  },
  // Window
  { id: 'street', slot: 'window', name: 'Street', tier: 1, colorways: ['classic'], free: true },
  { id: 'garden', slot: 'window', name: 'Garden', tier: 3, colorways: ['classic'] },
  { id: 'moonlit', slot: 'window', name: 'Moonlit', tier: 3, colorways: ['classic'] },
  { id: 'snowy', slot: 'window', name: 'Snowy', tier: 3, colorways: ['classic'] },
  // The daytime streets drawn with the free Street (Little Shops), each sold as its own scene (D185).
  // Tier 4, the top décor tier: they are far more detailed than the other windows (D186).
  { id: 'town-houses', slot: 'window', name: 'Town Houses', tier: 4, colorways: ['classic'] },
  { id: 'park', slot: 'window', name: 'Park', tier: 4, colorways: ['classic'] },
  { id: 'hilltop-town', slot: 'window', name: 'Hilltop Town', tier: 4, colorways: ['classic'] },
  { id: 'seaside', slot: 'window', name: 'Seaside', tier: 4, colorways: ['classic'] },
  // Counter-top
  // The counter-top's default is a clear counter; the serve bell is a control, not decor (D159).
  {
    id: 'none',
    slot: 'counter',
    name: 'Clear Counter',
    tier: 1,
    colorways: ['classic'],
    free: true,
  },
  {
    id: 'flower-vase',
    slot: 'counter',
    name: 'Flower Vase',
    tier: 1,
    colorways: ['berry', 'sky', 'honey'],
  },
  { id: 'cake-stand', slot: 'counter', name: 'Cake Stand', tier: 2, colorways: ['berry', 'mint'] },
  {
    id: 'cookie-jar',
    slot: 'counter',
    name: 'Cookie Jar',
    tier: 2,
    colorways: ['sky', 'lavender'],
  },
  { id: 'fish-bowl', slot: 'counter', name: 'Fish Bowl', tier: 3, colorways: ['classic'] },
  { id: 'tiny-robot', slot: 'counter', name: 'Tiny Robot', tier: 4, colorways: ['sky', 'berry'] },
  // Wall art: the wall starts bare; the Menu Board is a tier-1 buy, since it was never drawn (D160).
  { id: 'none', slot: 'wallArt', name: 'Bare Wall', tier: 1, colorways: ['classic'], free: true },
  { id: 'menu-board', slot: 'wallArt', name: 'Menu Board', tier: 1, colorways: ['classic'] },
  {
    id: 'neon-open',
    slot: 'wallArt',
    name: 'Neon OPEN',
    tier: 2,
    colorways: ['berry', 'sky', 'mint'],
  },
  {
    id: 'giant-clock',
    slot: 'wallArt',
    name: 'Giant Clock',
    tier: 3,
    colorways: ['honey', 'lavender'],
  },
  {
    id: 'monster-portraits',
    slot: 'wallArt',
    name: 'Monster Portraits',
    tier: 3,
    colorways: ['classic'],
  },
  { id: 'trophy-shelf', slot: 'wallArt', name: 'Trophy Shelf', tier: 4, colorways: ['classic'] },
];

/**
 * The M4 shop opens with this shelf (D151, D182): the first colour of every tier 1–2 item, ten
 * entries. With crate 1 (always on the first visit, D176) that is 12 unbought, so crate 2 comes
 * after about 7 buys (≈ 190 coins, about two weeks at an hour a week) instead of 15.
 */
export const STARTER_SHELF: readonly string[] = [
  'wallpaper.polka-dots.berry',
  'wallpaper.stripes.mint',
  'floor.checkerboard.classic',
  'floor.tiles.berry',
  'lights.string-lights.honey',
  'counter.flower-vase.berry',
  'counter.cake-stand.berry',
  'counter.cookie-jar.sky',
  'wallArt.neon-open.berry',
  'wallArt.menu-board.classic',
];
/**
 * The entries D182 took off the starter shelf come first in the crate queue, in this order, one
 * recolour and one thing to save for a crate: crate 1 (the first visit) brings Plain Paint Berry
 * and the Garden window, so every slot has something new by the end of the first visit.
 */
export const EARLY_CRATES: readonly string[] = [
  'wallpaper.plain.berry',
  'window.garden.classic',
  'floor.wood.honey',
  'counter.tiny-robot.sky',
  'wallpaper.plain.lavender',
  'lights.disco-ball.classic',
  'floor.wood.cocoa',
  'lights.star-chandelier.classic',
];

/**
 * Entries added to the M4 catalog after its crates shipped (D185): the four daytime streets drawn
 * with the new Street. They join the end of the crate queue in this order, so the crates a device
 * already has keep their contents.
 */
export const LATE_CRATES: readonly string[] = [
  'window.town-houses.classic',
  'window.park.classic',
  'window.hilltop-town.classic',
  'window.seaside.classic',
];

/**
 * Delivery crates (SPEC §10.1, D149, D151): 2 entries every 30 monsters served, held while 6 or
 * more unbought entries are in the shop. A crate is worth about what the child earns between
 * crates (about 3.8 coins a monster), so the shelf neither empties nor piles up.
 */
export const CRATE_SIZE = 2;
export const CRATE_EVERY_MONSTERS = 30;
export const CRATE_HOLD_AT_UNBOUGHT = 6;

/**
 * Later content is not designed yet, so it is planned as counts per tier (owner's milestone split,
 * 2026-11-21). Each group ships as one wave and is delivered in crates (economySim.ts).
 */
export interface PlannedGroup {
  label: string;
  slot: ShopSlot;
  /** The wave (milestone) it ships with; waves open in order. */
  wave: string;
  count: number;
  tier: Tier;
}

/** Regular monsters plus the two guests (SPEC §7.2). */
export const WARDROBE_MONSTERS = 8;

export const LATER_GROUPS: readonly PlannedGroup[] = [
  // Decor wave: 1–2 more colorways on the 15 M4 items that have them (~25, at their own item's price,
  // D177: 11 items at T1–T2, 2 at T3, 2 at T4), and 4 themed sets of 3 new pieces each
  // that complete them alongside M4 items.
  {
    label: 'Colorways round 2 (T1–T2 items)',
    slot: 'wallpaper',
    wave: 'decor',
    count: 17,
    tier: 2,
  },
  {
    label: 'Colorways round 2 (T3 items)',
    slot: 'lights',
    wave: 'decor',
    count: 4,
    tier: 3,
  },
  {
    label: 'Colorways round 2 (T4 items)',
    slot: 'floor',
    wave: 'decor',
    count: 4,
    tier: 4,
  },
  { label: 'Themed-set pieces', slot: 'counter', wave: 'decor', count: 8, tier: 3 },
  { label: 'Themed-set centrepieces', slot: 'wallArt', wave: 'decor', count: 4, tier: 4 },
  // Wardrobe wave, per monster: 3 hats, 4 skins, 3 accessories. A skin changes the whole monster,
  // so it is a top-tier wish like a staff member (M18).
  { label: 'Monster hats', slot: 'hat', wave: 'wardrobe', count: 3 * WARDROBE_MONSTERS, tier: 2 },
  {
    label: 'Monster accessories',
    slot: 'accessory',
    wave: 'wardrobe',
    count: 3 * WARDROBE_MONSTERS,
    tier: 3,
  },
  { label: 'Monster skins', slot: 'skin', wave: 'wardrobe', count: 4 * WARDROBE_MONSTERS, tier: 5 },
  // Staff wave (M18, D157): Bunny Barista (T4); Cat Waiter, Bear Busker, Owl Cashier, Fox Baker (T5).
  // Pip is the slot's free default. Characters that idle and react, so their own milestone.
  { label: 'Staff (T4)', slot: 'staff', wave: 'staff', count: 1, tier: 4 },
  { label: 'Staff (T5)', slot: 'staff', wave: 'staff', count: 4, tier: 5 },
];

export function expandPlanned(
  groups: readonly PlannedGroup[],
  tiers: Readonly<Record<Tier, number>> = TIER_PRICE,
): (ShopEntry & { wave: string })[] {
  return groups.flatMap((g, gi) =>
    Array.from({ length: g.count }, (_, i) => ({
      key: `planned.${gi}.${i}`,
      slot: g.slot,
      item: `planned-${gi}-${i}`,
      name: g.label,
      colorway: 'classic' as const,
      tier: g.tier,
      price: tiers[g.tier],
      wave: g.wave,
    })),
  );
}
