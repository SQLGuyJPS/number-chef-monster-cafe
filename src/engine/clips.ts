// Recorded voices (SPEC §8.4, D139–D141, D143): which clips make up a spoken line. Pure: the
// player (src/audio/voice.ts), the recording script (scripts/audio-todo.ts) and the clip build
// (scripts/audio-build.ts) all read these tables. A line plays recorded only when every clip it
// needs exists for that voice; otherwise the whole line is TTS (D139e).
import { FOOD_IDS, FOODS, type FoodId } from './foods';
import { capitalize, numberToWords } from './numberWords';
import { phrase, sentenceOf, type PhraseKey, type PhraseParams } from './phrases';
import type { Token } from './types';
import { REGULARS } from './monsters';

// ---------- lines ----------

/** Where a line came from. Captions use `lineText`; the voice layer uses `lineClips`. */
export type Line =
  | { kind: 'phrase'; key: PhraseKey; params: PhraseParams }
  /** The generator's unwrapped ticket sentence for missing-number forms (SPEC §4). */
  | { kind: 'ticket'; display: readonly Token[] }
  /** A monster's own arrive/thanks line (MonsterSpec.lines, SPEC §7.2), recorded whole. */
  | { kind: 'monster'; monster: string; which: 'arrive' | 'thanks'; index: number; text: string }
  /** Never recorded: text with the child's name or a renamed monster (D139e), debug lines. */
  | { kind: 'text'; text: string };

export const phraseLine = (key: PhraseKey, params: PhraseParams = {}): Line => ({
  kind: 'phrase',
  key,
  params,
});

export function lineText(line: Line): string {
  switch (line.kind) {
    case 'phrase':
      return phrase(line.key, line.params);
    case 'ticket':
      return sentenceOf(line.display);
    case 'monster':
    case 'text':
      return line.text;
  }
}

// ---------- speakers and voices ----------

export type SpeakerKind = 'monster' | 'pip' | 'narrator';

/** Who says each phrase (D141b). A monster phrase is spoken in the voice of the monster on stage. */
export const PHRASE_SPEAKERS: Readonly<Record<PhraseKey, SpeakerKind>> = {
  'order.add': 'monster',
  'order.sub': 'monster',
  'order.back': 'monster',
  'count.n': 'pip',
  'plate.oneMore': 'monster',
  'plate.oneLess': 'monster',
  'plate.off': 'monster',
  'plate.more.oneMore': 'monster',
  'plate.more.oneLess': 'monster',
  'plate.more.off': 'monster',
  'plate.away.oneMore': 'monster',
  'plate.away.oneLess': 'monster',
  'plate.away.off': 'monster',
  'plate.echo': 'monster',
  'offer.help': 'monster',
  'ct.start': 'pip',
  'ct.more': 'pip',
  'ct.left': 'pip',
  'ct.away': 'pip',
  'ct.total': 'pip',
  'demo.start': 'pip',
  'demo.total': 'pip',
  'demo.left': 'pip',
  'demo.doubles.blue': 'pip',
  'demo.doubles.orange': 'pip',
  'demo.doubles.sum': 'pip',
  'demo.near.know': 'pip',
  'demo.near.more': 'pip',
  'demo.away': 'pip',
  'demo.ten.gap': 'pip',
  'demo.ten.gap1': 'pip',
  'demo.ten.make': 'pip',
  'warm.bell': 'pip',
  'follow.start': 'pip',
  'follow.bell': 'pip',
  'follow.type': 'pip',
  'serve.yum': 'monster',
  'eat.total': 'monster',
  'service.closed': 'monster',
  'resume.ask': 'pip',
  'results.total': 'narrator',
};

/** Voice folders under `audio/` (D141a): one per regular monster, Pip and the narrator. */
export const MONSTER_VOICES: readonly string[] = REGULARS.map((m) => m.id);
export const VOICE_IDS: readonly string[] = [...MONSTER_VOICES, 'pip', 'narrator'];

/** The voice a speaker uses; a monster phrase needs the monster on stage. */
export function voiceFor(who: SpeakerKind, monster?: string): string {
  if (who === 'monster') return monster ?? MONSTER_VOICES[0]!;
  return who;
}

/**
 * The offline pitch shift per voice (D140a, D145): semitones and tempo for the `rubberband` filter.
 * Derived from the TTS pitch/rate in MonsterSpec (12·log2(pitch), rate / 0.85), pulled in where a
 * big shift would sound odd; the narrator is the owner's own voice. The listening test tunes these.
 */
export const VOICE_SHIFTS: Readonly<Record<string, { semitones: number; tempo: number }>> = {
  narrator: { semitones: 0, tempo: 1 },
  pip: { semitones: 6, tempo: 1 },
  blobbo: { semitones: 2, tempo: 1 },
  gruffles: { semitones: -5, tempo: 0.94 },
  zibbit: { semitones: 4, tempo: 1.1 },
  mimsy: { semitones: 5, tempo: 1 },
  chompers: { semitones: -2, tempo: 1.05 },
  wobbleton: { semitones: -1, tempo: 0.94 },
};

// ---------- clips ----------

/**
 * Number forms by position (D139b): `lead` starts a phrase, `mid` sits inside one, `end` closes a
 * statement or exclamation, `ask` closes a question ("Two?", "…equals ten?", D143).
 */
export type NumberForm = 'lead' | 'mid' | 'end' | 'ask';
export const NUMBER_FORMS: readonly NumberForm[] = ['lead', 'mid', 'end', 'ask'];

/**
 * What the listening test (M13 step 2) can change without new code (D139d): which recorded form
 * stands in for each position, and which counting lines use one-take pair clips ("Two more!").
 */
export interface ClipPolicy {
  forms: Readonly<Record<NumberForm, NumberForm>>;
  pairs: boolean;
}
export const CLIP_POLICY: ClipPolicy = {
  forms: { lead: 'lead', mid: 'mid', end: 'end', ask: 'ask' },
  pairs: false,
};

/**
 * Connecting words and short phrases (`w.<slug>`). The punctuation is the intonation: "more!" and
 * "more…" are different recordings.
 */
export const WORDS = {
  plus: 'plus',
  minus: 'minus',
  equals: 'equals',
  what: 'what',
  'what-ask': 'what?',
  'i-see': 'I see',
  'i-wanted': 'I wanted',
  'one-more': 'One more!',
  'one-less': 'One less!',
  more: 'more!',
  'more-trail': 'more…',
  'more-stop': 'more.',
  left: 'left!',
  'taken-away': 'taken away!',
  'taken-away-trail': 'taken away…',
  blue: 'blue.',
  'orange-same': 'orange. The same!',
  and: 'and',
  is: 'is',
  'you-know': 'You know',
  'one-more-makes': 'One more makes',
  'empty-spots': 'empty spots.',
  'more-makes-ten': 'more makes ten!',
  yum: 'Yum!',
  'you-earned': 'You earned',
  'coins-great-job': 'coins! Great job, chef!',
  'coin-great-job': 'coin! Great job, chef!',
} as const;
export type WordSlug = keyof typeof WORDS;

/** Phrases with no parameters are recorded whole (`line.<key>`). */
export const FIXED_LINES = [
  'order.back',
  'offer.help',
  'ct.start',
  'demo.ten.gap1',
  'warm.bell',
  'follow.start',
  'follow.bell',
  'follow.type',
  'service.closed',
  'resume.ask',
] as const satisfies readonly PhraseKey[];

/** Counting lines that may be recorded as one-take pairs (`pair.<n>.<word>`, D143). */
const PAIR_KEYS: Partial<Record<PhraseKey, 'more' | 'left'>> = {
  'ct.more': 'more',
  'ct.left': 'left',
  'demo.left': 'left',
};

/** Spike-only one-take references for the stitched-versus-one-take comparison (`ref.<slug>`, D143). */
export const REFS = {
  'order-add-7-2-cookie': 'Seven plus two cookies, please!',
  'order-sub-4-1-doughnut': 'Four minus one doughnuts, please!',
  'plate-6-7': 'I see six… I wanted seven. One more!',
} as const;

export const numClip = (n: number, form: NumberForm): string => `num.${n}.${form}`;
export const wordClip = (w: WordSlug): string => `w.${w}`;
export const foodClip = (f: FoodId): string => `food.${f}.please`;
export const lineClip = (k: PhraseKey): string => `line.${k}`;
export const pairClip = (n: number, w: 'more' | 'left'): string => `pair.${n}.${w}`;
export const monsterClip = (m: string, which: 'arrive' | 'thanks', i: number): string =>
  `mon.${m}.${which}.${i}`;

const FIXED = new Set<string>(FIXED_LINES);

/**
 * The clip ids of a phrase (D141b). Every parameter is covered; the transcripts of the result
 * join to `phrase(key, params)` (unit test). Numbers outside 0–100 throw, as in `phrase`.
 */
export function clipPlan(
  key: PhraseKey,
  params: PhraseParams = {},
  policy: ClipPolicy = CLIP_POLICY,
): string[] {
  const num = (k: string, form: NumberForm) => {
    const v = Number(params[k]);
    numberToWords(v); // range check, same as the phrase
    return numClip(v, policy.forms[form]);
  };
  const W = wordClip;
  if (FIXED.has(key)) return [lineClip(key)];
  const pair = PAIR_KEYS[key];
  if (pair && policy.pairs) return [pairClip(Number(params.n), pair)];
  switch (key) {
    case 'order.add':
    case 'order.sub':
      return [
        num('a', 'lead'),
        W(key === 'order.add' ? 'plus' : 'minus'),
        num('b', 'mid'),
        foodClip(params.food as FoodId),
      ];
    case 'count.n':
    case 'ct.total':
    case 'demo.start':
    case 'demo.total':
    case 'eat.total':
      return [num('n', 'end')];
    case 'plate.oneMore':
    case 'plate.oneLess':
    case 'plate.off': {
      const tail =
        key === 'plate.oneMore' ? [W('one-more')] : key === 'plate.oneLess' ? [W('one-less')] : [];
      return [W('i-see'), num('seen', 'end'), W('i-wanted'), num('wanted', 'end'), ...tail];
    }
    case 'plate.more.oneMore':
    case 'plate.more.oneLess':
      return [
        num('seen', 'lead'),
        W('more-trail'),
        W('i-wanted'),
        num('wanted', 'end'),
        W(key === 'plate.more.oneMore' ? 'one-more' : 'one-less'),
      ];
    case 'plate.more.off':
      return [
        num('seen', 'lead'),
        W('more-trail'),
        W('i-wanted'),
        num('wanted', 'mid'),
        W('more-stop'),
      ];
    case 'plate.away.oneMore':
    case 'plate.away.oneLess':
    case 'plate.away.off': {
      const tail =
        key === 'plate.away.oneMore'
          ? [W('one-more')]
          : key === 'plate.away.oneLess'
            ? [W('one-less')]
            : [];
      return [
        num('seen', 'lead'),
        W('taken-away-trail'),
        W('i-wanted'),
        num('wanted', 'end'),
        ...tail,
      ];
    }
    case 'plate.echo':
      return [num('seen', 'ask'), W('i-wanted'), num('wanted', 'end')];
    case 'ct.more':
      return [num('n', 'lead'), W('more')];
    case 'ct.left':
    case 'demo.left':
      return [num('n', 'lead'), W('left')];
    case 'ct.away':
    case 'demo.away':
      return [num('n', 'lead'), W('taken-away')];
    case 'demo.doubles.blue':
      return [num('n', 'lead'), W('blue')];
    case 'demo.doubles.orange':
      return [num('n', 'lead'), W('orange-same')];
    case 'demo.doubles.sum':
      return [num('a', 'lead'), W('and'), num('a', 'mid'), W('is'), num('sum', 'end')];
    case 'demo.near.know':
      return [
        W('you-know'),
        num('a', 'mid'),
        W('and'),
        num('a', 'mid'),
        W('is'),
        num('sum', 'end'),
      ];
    case 'demo.near.more':
      return [W('one-more-makes'), num('n', 'end')];
    case 'demo.ten.gap':
      return [num('n', 'lead'), W('empty-spots')];
    case 'demo.ten.make':
      return [num('a', 'lead'), W('and'), num('b', 'mid'), W('more-makes-ten')];
    case 'serve.yum':
      return [W('yum'), num('n', 'end')];
    case 'results.total':
      return [
        W('you-earned'),
        num('n', 'mid'),
        W(Number(params.n) === 1 ? 'coin-great-job' : 'coins-great-job'),
      ];
    default:
      throw new Error(`clipPlan: no plan for ${key}`);
  }
}

/** The generator's ticket sentence ("Seven plus what equals ten?"): first number lead, last ask. */
export function ticketClips(display: readonly Token[], policy: ClipPolicy = CLIP_POLICY): string[] {
  const last = display.length - 1;
  return display.map((t, i) => {
    if (typeof t === 'number') {
      numberToWords(t);
      return numClip(t, policy.forms[i === 0 ? 'lead' : i === last ? 'ask' : 'mid']);
    }
    if (t === '?') return wordClip(i === last ? 'what-ask' : 'what');
    return wordClip(t === '+' ? 'plus' : t === '−' ? 'minus' : 'equals');
  });
}

/** A line's clips, or null when the line is never recorded (D139e). */
export function lineClips(line: Line, policy: ClipPolicy = CLIP_POLICY): string[] | null {
  switch (line.kind) {
    case 'phrase':
      return clipPlan(line.key, line.params, policy);
    case 'ticket':
      return ticketClips(line.display, policy);
    case 'monster':
      return [monsterClip(line.monster, line.which, line.index)];
    case 'text':
      return null;
  }
}

// ---------- transcripts ----------

const CLIP_RE =
  /^(?:num\.(\d{1,3})\.(lead|mid|end|ask)|food\.([a-z]+)\.please|w\.([a-z-]+)|line\.([a-zA-Z.0-9]+)|pair\.(\d{1,3})\.(more|left)|ref\.([a-z0-9-]+)|mon\.([a-z]+)\.(arrive|thanks)\.(\d+))$/;

/** Every clip id has this shape (D141a, D143); `lint:content` checks the manifest against it. */
export const isClipIdShape = (id: string): boolean => CLIP_RE.test(id);

/**
 * What a clip says, as written in the recording script. Monster lines need the monster's own text
 * (it lives with the art), so they come from `monsterText`.
 */
export function clipTranscript(
  id: string,
  monsterText?: (m: string, which: 'arrive' | 'thanks', i: number) => string | undefined,
): string | undefined {
  const m = CLIP_RE.exec(id);
  if (!m) return undefined;
  if (m[1] !== undefined) {
    const n = Number(m[1]);
    if (n > 100) return undefined;
    const word = numberToWords(n);
    return m[2] === 'ask' ? `${word}?` : word;
  }
  if (m[3] !== undefined)
    return (FOOD_IDS as readonly string[]).includes(m[3])
      ? `${FOODS[m[3] as FoodId].plural}, please!`
      : undefined;
  if (m[4] !== undefined) return WORDS[m[4] as WordSlug];
  if (m[5] !== undefined) return FIXED.has(m[5]) ? phrase(m[5] as PhraseKey) : undefined;
  if (m[6] !== undefined) return `${capitalize(numberToWords(Number(m[6])))} ${m[7]}!`;
  if (m[8] !== undefined) return REFS[m[8] as keyof typeof REFS];
  return monsterText?.(m[9]!, m[10] as 'arrive' | 'thanks', Number(m[11]));
}

/** For comparing transcripts with phrase text: case, punctuation and spacing ignored (D141b). */
export const normalizeSpeech = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
