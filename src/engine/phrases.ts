// Phrase table v1 (SPEC §8.2): every key maps to a template that outputs words only, never digits
// or symbols. Keys are stable (recorded audio may replace them later). `lint:content` renders
// every phrase with every parameter in range and checks the rules (SPEC §13.2).
import { FOODS, type FoodId } from './foods';
import { capitalize, numberToWords as w } from './numberWords';
import type { Token } from './types';

export type ParamKind = 'n' | 'food';
interface PhraseDef {
  params: Record<string, ParamKind>;
  /** Shown as a caption too, so ≤ 8 words unless `ticket` (≤ 12, SPEC §13.2). */
  ticket?: boolean;
  text: (p: PhraseParams) => string;
}
export type PhraseParams = Record<string, number | string>;

const n = (p: PhraseParams, k: string): string => w(Number(p[k]));
const N = (p: PhraseParams, k: string): string => capitalize(n(p, k));
const plural = (p: PhraseParams): string => FOODS[p.food as FoodId].plural;

const TOKEN_WORDS: Record<Exclude<Token, number>, string> = {
  '+': 'plus',
  '−': 'minus',
  '=': 'equals',
  '?': 'what',
};

/** Unwrapped sentence for a ticket (SPEC §4): "Eight plus five equals what?". */
export function sentenceOf(display: readonly Token[]): string {
  const words = display.map((t) => (typeof t === 'number' ? w(t) : TOKEN_WORDS[t]));
  return `${capitalize(words.join(' '))}?`;
}

export const PHRASES = {
  // Result forms are wrapped in the café frame with the food (SPEC §4); the ticket stays numerals.
  'order.add': {
    params: { a: 'n', b: 'n', food: 'food' },
    ticket: true,
    text: (p) => `${N(p, 'a')} plus ${n(p, 'b')} ${plural(p)}, please!`,
  },
  'order.sub': {
    params: { a: 'n', b: 'n', food: 'food' },
    ticket: true,
    text: (p) => `${N(p, 'a')} minus ${n(p, 'b')} ${plural(p)}, please!`,
  },

  // A requeue is the same monster coming back (SPEC §4.1 step 7); names arrive with M7 renaming.
  'order.back': { params: {}, text: () => "I'm back! Still hungry!" },

  'count.n': { params: { n: 'n' }, text: (p) => n(p, 'n') },

  // PlateCount (SPEC §5.5, D30): the monster counts what was served, then names what it wanted.
  'plate.oneMore': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `I see ${n(p, 'seen')}… I wanted ${n(p, 'wanted')}. One more!`,
  },
  'plate.oneLess': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `I see ${n(p, 'seen')}… I wanted ${n(p, 'wanted')}. One less!`,
  },
  'plate.off': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `I see ${n(p, 'seen')}… I wanted ${n(p, 'wanted')}.`,
  },
  // Missing-number forms at S3/S2 (D104): the monster talks about the orange group, the answer
  // ("Two more… I wanted three. One more!"), never the tray total.
  'plate.more.oneMore': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')} more… I wanted ${n(p, 'wanted')}. One more!`,
  },
  'plate.more.oneLess': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')} more… I wanted ${n(p, 'wanted')}. One less!`,
  },
  'plate.more.off': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')} more… I wanted ${n(p, 'wanted')} more.`,
  },
  'plate.away.oneMore': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')} taken away… I wanted ${n(p, 'wanted')}. One more!`,
  },
  'plate.away.oneLess': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')} taken away… I wanted ${n(p, 'wanted')}. One less!`,
  },
  'plate.away.off': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')} taken away… I wanted ${n(p, 'wanted')}.`,
  },
  'plate.echo': {
    params: { seen: 'n', wanted: 'n' },
    text: (p) => `${N(p, 'seen')}? I wanted ${n(p, 'wanted')}.`,
  },

  // Help offer after the second miss (D89).
  'offer.help': { params: {}, text: () => 'Want Pip to help? Or try again?' },

  // CountTogether (SPEC §5.5).
  'ct.start': { params: {}, text: () => "Let's count together." },
  'ct.more': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} more!` },
  'ct.left': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} left!` },
  'ct.away': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} taken away!` },
  'ct.total': { params: { n: 'n' }, text: (p) => `${N(p, 'n')}!` },

  // Worked demos (SPEC §5.5, D42b).
  'demo.start': { params: { n: 'n' }, text: (p) => `${N(p, 'n')}.` },
  'demo.total': { params: { n: 'n' }, text: (p) => `${N(p, 'n')}!` },
  'demo.left': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} left!` },
  'demo.doubles.blue': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} blue.` },
  'demo.doubles.orange': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} orange. The same!` },
  'demo.doubles.sum': {
    params: { a: 'n', sum: 'n' },
    text: (p) => `${N(p, 'a')} and ${n(p, 'a')} is ${n(p, 'sum')}.`,
  },
  'demo.near.know': {
    params: { a: 'n', sum: 'n' },
    text: (p) => `You know ${n(p, 'a')} and ${n(p, 'a')} is ${n(p, 'sum')}.`,
  },
  'demo.near.more': { params: { n: 'n' }, text: (p) => `One more makes ${n(p, 'n')}!` },
  'demo.away': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} taken away!` },
  // Make ten (A3, SPEC §5.5, D98).
  'demo.ten.gap': { params: { n: 'n' }, text: (p) => `${N(p, 'n')} empty spots.` },
  'demo.ten.gap1': { params: {}, text: () => 'One empty spot.' },
  'demo.ten.make': {
    params: { a: 'n', b: 'n' },
    text: (p) => `${N(p, 'a')} and ${n(p, 'b')} more makes ten!`,
  },

  // Warm-up order (SPEC §5.4, D26): Pip says what to do while the ghost hand points at the bell.
  'warm.bell': { params: {}, text: () => 'Ring the bell to serve!' },

  // FollowMe (SPEC §5.5).
  'follow.start': { params: {}, text: () => 'Your turn! Follow me.' },
  'follow.bell': { params: {}, text: () => 'Now ring the bell!' },
  'follow.type': { params: {}, text: () => 'Now type the number.' },

  // Correct serve (the full eat sequence is M2).
  'serve.yum': { params: { n: 'n' }, text: (p) => `Yum! ${N(p, 'n')}!` },
  /** The total named after the last row flies into the mouth (SPEC §5.6, "Eight!"). */
  'eat.total': { params: { n: 'n' }, text: (p) => `${N(p, 'n')}!` },
  'service.closed': { params: {}, text: () => 'All done! Thank you, chef!' },
  // Results tally (SPEC §5.7): said once the silent count-up lands on the total.
  'results.total': {
    params: { n: 'n' },
    text: (p) => `You earned ${n(p, 'n')} ${Number(p.n) === 1 ? 'coin' : 'coins'}! Great job, chef!`,
  },
} as const satisfies Record<string, PhraseDef>;

export type PhraseKey = keyof typeof PHRASES;

export function phrase(key: PhraseKey, params: PhraseParams = {}): string {
  return (PHRASES[key] as PhraseDef).text(params);
}

export function phraseDef(key: PhraseKey): PhraseDef {
  return PHRASES[key] as PhraseDef;
}
