// Food allowlist (SPEC §7.1): Unicode ≤ 9.0, each glyph reads as one countable unit (D35).
// `lint:content` checks every glyph against scripts/emoji-versions.json.
export const FOOD_IDS = [
  'cookie',
  'doughnut',
  'pizza',
  'burger',
  'hotdog',
  'croissant',
  'bread',
  'cake',
  'strawberry',
  'apple',
  'banana',
  'tangerine',
  'riceball',
  'icecream',
  'carrot',
  'taco',
] as const;

export type FoodId = (typeof FOOD_IDS)[number];

export interface Food {
  glyph: string;
  singular: string;
  plural: string;
}

export const FOODS: Readonly<Record<FoodId, Food>> = {
  cookie: { glyph: '\u{1F36A}', singular: 'cookie', plural: 'cookies' },
  doughnut: { glyph: '\u{1F369}', singular: 'doughnut', plural: 'doughnuts' },
  pizza: { glyph: '\u{1F355}', singular: 'pizza slice', plural: 'pizza slices' },
  burger: { glyph: '\u{1F354}', singular: 'burger', plural: 'burgers' },
  hotdog: { glyph: '\u{1F32D}', singular: 'hot dog', plural: 'hot dogs' },
  croissant: { glyph: '\u{1F950}', singular: 'croissant', plural: 'croissants' },
  bread: { glyph: '\u{1F35E}', singular: 'loaf of bread', plural: 'loaves of bread' },
  cake: { glyph: '\u{1F370}', singular: 'slice of cake', plural: 'slices of cake' },
  strawberry: { glyph: '\u{1F353}', singular: 'strawberry', plural: 'strawberries' },
  apple: { glyph: '\u{1F34E}', singular: 'apple', plural: 'apples' },
  banana: { glyph: '\u{1F34C}', singular: 'banana', plural: 'bananas' },
  tangerine: { glyph: '\u{1F34A}', singular: 'orange', plural: 'oranges' },
  riceball: { glyph: '\u{1F359}', singular: 'rice ball', plural: 'rice balls' },
  icecream: { glyph: '\u{1F366}', singular: 'ice cream', plural: 'ice creams' },
  carrot: { glyph: '\u{1F955}', singular: 'carrot', plural: 'carrots' },
  taco: { glyph: '\u{1F32E}', singular: 'taco', plural: 'tacos' },
};
