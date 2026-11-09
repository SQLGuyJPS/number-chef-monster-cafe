// MonsterSpec (SPEC §7.2): the versioned data shape for the roster. In Tier 1 the look fields describe
// the hand-authored SVG for `id` and feed `lint:content`; `<Monster>` draws the asset for the id.
import type { FoodId } from '../../engine/foods';

export const MONSTER_SPEC_VERSION = 1;

export const EXPRESSIONS = ['idle', 'delight', 'eat', 'puzzled', 'sleepy'] as const;
export type Expression = (typeof EXPRESSIONS)[number];

/** One celebration per monster (SPEC §7.2 roster); CSS keyframes `react-<id>` in monsters.css. */
export const REACTIONS = ['melt', 'stomp', 'spin', 'hearts', 'burp', 'puddle', 'faint', 'sparkles'] as const;
export type ReactionId = (typeof REACTIONS)[number];

export const BODIES = ['blob', 'tall', 'round', 'square', 'jelly', 'fluffy'] as const;
export const EXTRAS = ['horns', 'antennae', 'ears', 'spikes', 'drips', 'tail'] as const;

export interface MonsterSpec {
  id: string;
  name: string;
  body: (typeof BODIES)[number];
  /** Body and belly must contrast ≥ 3:1 with the eye/mouth ink (lint:content). */
  palette: { body: string; belly: string; accent: string };
  eyes: { count: 1 | 2 | 3; kind: 'round' | 'stalk' | 'sleepy' };
  mouth: 'smile' | 'wide' | 'toothy' | 'tiny';
  extras: (typeof EXTRAS)[number][];
  voice: { pitch: number; rate: number };
  personality: string;
  favorites: [FoodId, FoodId];
  reactions: ReactionId[];
  lines: { arrive: string[]; thanks: string[] };
}

/** Eye and mouth colour on every monster. */
export const INK = '#2b2b3a';

export const MONSTER_SPECS: readonly MonsterSpec[] = [
  {
    id: 'blobbo',
    name: 'Blobbo',
    body: 'blob',
    palette: { body: '#6cc24a', belly: '#b9ec8f', accent: '#3f8f2a' },
    eyes: { count: 1, kind: 'round' },
    mouth: 'smile',
    extras: [],
    voice: { pitch: 1.2, rate: 0.85 },
    personality: 'shy giggler',
    favorites: ['cake', 'strawberry'],
    reactions: ['melt'],
    lines: { arrive: ['Hee hee. Hello!'], thanks: ['Hee hee! Thank you!'] },
  },
  {
    id: 'gruffles',
    name: 'Gruffles',
    body: 'square',
    palette: { body: '#a57ae0', belly: '#dcc8f7', accent: '#f4e3c1' },
    eyes: { count: 2, kind: 'round' },
    mouth: 'toothy',
    extras: ['horns', 'tail'],
    voice: { pitch: 0.6, rate: 0.8 },
    personality: 'big, gentle, deep "Mmm!"',
    favorites: ['burger', 'hotdog'],
    reactions: ['stomp'],
    lines: { arrive: ['Hello, chef!'], thanks: ['Mmm! Thank you!'] },
  },
  {
    id: 'zibbit',
    name: 'Zibbit',
    body: 'tall',
    palette: { body: '#f7943a', belly: '#ffd6a8', accent: '#c2600f' },
    eyes: { count: 3, kind: 'stalk' },
    mouth: 'wide',
    extras: [],
    voice: { pitch: 1.4, rate: 0.95 },
    personality: 'speedy',
    favorites: ['cookie', 'doughnut'],
    reactions: ['spin'],
    lines: { arrive: ['Hi hi hi!'], thanks: ['Thanks thanks thanks!'] },
  },
  {
    id: 'mimsy',
    name: 'Mimsy',
    body: 'fluffy',
    palette: { body: '#f7a8cb', belly: '#ffe0ee', accent: '#d65f95' },
    eyes: { count: 2, kind: 'round' },
    mouth: 'tiny',
    extras: ['ears'],
    voice: { pitch: 1.5, rate: 0.85 },
    personality: 'tiny and polite',
    favorites: ['bread', 'tangerine'],
    reactions: ['hearts'],
    lines: { arrive: ['Hello. May I order, please?'], thanks: ['Thank you very much!'] },
  },
  {
    id: 'chompers',
    name: 'Chompers',
    body: 'round',
    palette: { body: '#5c9eea', belly: '#b9d7f8', accent: '#2f63a8' },
    eyes: { count: 2, kind: 'round' },
    mouth: 'toothy',
    extras: ['spikes'],
    voice: { pitch: 0.9, rate: 0.9 },
    personality: 'messy, big teeth',
    favorites: ['pizza', 'riceball'],
    reactions: ['burp'],
    lines: { arrive: ['Chomp chomp! Hello!'], thanks: ['Chomp! Thanks!'] },
  },
  {
    id: 'wobbleton',
    name: 'Wobbleton',
    body: 'jelly',
    palette: { body: '#f6d743', belly: '#fff3a8', accent: '#d1a90c' },
    eyes: { count: 2, kind: 'round' },
    mouth: 'wide',
    extras: [],
    voice: { pitch: 1.0, rate: 0.8 },
    personality: 'wobbly and cheerful',
    favorites: ['icecream', 'banana'],
    reactions: ['puddle'],
    lines: { arrive: ['Wibble wobble, hello!'], thanks: ['Wobbly thanks!'] },
  },
];

const BY_ID = new Map(MONSTER_SPECS.map((s) => [s.id, s]));

/** Unknown ids (a guest before its art exists) fall back to the first regular. */
export function specFor(id: string): MonsterSpec {
  return BY_ID.get(id) ?? MONSTER_SPECS[0]!;
}
