// The recording scripts and the clip inventory (SPEC §8.4, D139–D141, D144). Pure: `audio:todo`
// renders these to Markdown, `audio:build` reads the Markdown back by item number, and the ?debug
// Voice test page plays the spike lines.
import { FOOD_IDS, FOODS } from './foods';
import { capitalize, numberToWords as w } from './numberWords';
import { PHRASES, phrase, phraseDef, type PhraseKey, type PhraseParams } from './phrases';
import {
  FIXED_LINES,
  MONSTER_VOICES,
  NUMBER_FORMS,
  PHRASE_SPEAKERS,
  REFS,
  VOICE_IDS,
  WORDS,
  clipPlan,
  foodClip,
  lineClip,
  monsterClip,
  numClip,
  pairClip,
  ticketClips,
  wordClip,
  type NumberForm,
  type WordSlug,
} from './clips';
import type { Token } from './types';

/** One thing to read aloud: a carrier sentence with the target clip marked `[[…]]`. */
export interface ScriptItem {
  clip: string;
  carrier: string;
}
export interface ScriptSection {
  title: string;
  note?: string;
  items: ScriptItem[];
}

/** Numbers the M13 scope covers in full (D139f). */
export const NUMBER_MAX = 20;
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** Carrier sentences put each number where the game says it, so it keeps that intonation (D139b). */
export const NUMBER_CARRIERS: Readonly<Record<NumberForm, (n: number) => string>> = {
  lead: (n) => `[[${capitalize(w(n))}]] plus two cookies, please!`,
  mid: (n) => `Three plus [[${w(n)}]] cookies, please!`,
  end: (n) => `I wanted [[${w(n)}]].`,
  ask: (n) => `Six plus what equals [[${w(n)}?]]`,
};

/** A real game line around each connecting word (D139b). */
const WORD_CARRIERS: Readonly<Record<WordSlug, string>> = {
  plus: 'Seven [[plus]] two cookies, please!',
  minus: 'Four [[minus]] one doughnuts, please!',
  equals: 'Six plus what [[equals]] ten?',
  what: 'Six plus [[what]] equals ten?',
  'what-ask': 'Six plus [[what?]]',
  'i-see': '[[I see]] six… I wanted seven. One more!',
  'i-wanted': 'I see six… [[I wanted]] seven. One more!',
  'one-more': 'I see six… I wanted seven. [[One more!]]',
  'one-less': 'I see eight… I wanted seven. [[One less!]]',
  more: 'Three [[more!]]',
  'more-trail': 'Two [[more…]] I wanted three. One more!',
  'more-stop': 'Two more… I wanted five [[more.]]',
  left: 'Three [[left!]]',
  'taken-away': 'Two [[taken away!]]',
  'taken-away-trail': 'Two [[taken away…]] I wanted three.',
  blue: 'Three [[blue.]]',
  'orange-same': 'Three [[orange. The same!]]',
  and: 'Three [[and]] three is six.',
  is: 'Three and three [[is]] six.',
  'you-know': '[[You know]] three and three is six.',
  'one-more-makes': '[[One more makes]] seven!',
  'empty-spots': 'Three [[empty spots.]]',
  'more-makes-ten': 'Seven and three [[more makes ten!]]',
  yum: '[[Yum!]] Seven!',
  'you-earned': '[[You earned]] twelve coins! Great job, chef!',
  'coins-great-job': 'You earned twelve [[coins! Great job, chef!]]',
  'coin-great-job': 'You earned one [[coin! Great job, chef!]]',
};

const whole = (text: string) => `[[${text}]]`;

/** The words inside `[[…]]`. */
export const targetOf = (carrier: string): string => /\[\[(.+?)\]\]/.exec(carrier)?.[1] ?? '';

// ---------- the spike (PLAN §6.2 item 8) ----------

/** Numbers 0–10 in every position the spike tests, and the pair clips "two more!" … "five left!". */
const SPIKE_NUMBERS = range(0, 10);
const SPIKE_PAIRS = range(2, 5);

export function spikeScript(): ScriptSection[] {
  const forms: NumberForm[] = ['lead', 'mid', 'end'];
  return [
    ...forms.map((form) => ({
      title: `Numbers, ${form} form`,
      note:
        form === 'lead'
          ? 'Read the whole sentence each time; only the bold word is kept.'
          : undefined,
      items: SPIKE_NUMBERS.map((n) => ({
        clip: numClip(n, form),
        carrier: NUMBER_CARRIERS[form](n),
      })),
    })),
    {
      title: 'Connecting words and food',
      items: [
        ...(['plus', 'minus'] as const).map((s) => ({
          clip: wordClip(s),
          carrier: WORD_CARRIERS[s],
        })),
        { clip: foodClip('cookie'), carrier: 'Seven plus two [[cookies, please!]]' },
        { clip: foodClip('doughnut'), carrier: 'Four minus one [[doughnuts, please!]]' },
        ...(['i-see', 'i-wanted', 'one-more', 'more', 'left'] as const).map((s) => ({
          clip: wordClip(s),
          carrier: WORD_CARRIERS[s],
        })),
      ],
    },
    {
      title: 'Counting pairs (one take each)',
      items: (['more', 'left'] as const).flatMap((word) =>
        SPIKE_PAIRS.map((n) => ({
          clip: pairClip(n, word),
          carrier: whole(`${capitalize(w(n))} ${word}!`),
        })),
      ),
    },
    {
      title: 'Whole lines in one take (for comparison only)',
      items: Object.entries(REFS).map(([slug, text]) => ({
        clip: `ref.${slug}`,
        carrier: whole(text),
      })),
    },
  ];
}

/**
 * The spike's comparison lines (?debug Voice test, PLAN §6.2 item 7): each stitched line next to
 * its one-take reference, and the counting lines that can be pairs.
 */
export const SPIKE_LINES: readonly {
  label: string;
  key: PhraseKey;
  params: PhraseParams;
  ref?: string;
}[] = [
  {
    label: 'Order (plus)',
    key: 'order.add',
    params: { a: 7, b: 2, food: 'cookie' },
    ref: 'ref.order-add-7-2-cookie',
  },
  {
    label: 'Order (minus)',
    key: 'order.sub',
    params: { a: 4, b: 1, food: 'doughnut' },
    ref: 'ref.order-sub-4-1-doughnut',
  },
  {
    label: 'Plate count',
    key: 'plate.oneMore',
    params: { seen: 6, wanted: 7 },
    ref: 'ref.plate-6-7',
  },
  { label: 'Order (plus)', key: 'order.add', params: { a: 10, b: 3, food: 'doughnut' } },
  { label: 'Order (minus)', key: 'order.sub', params: { a: 9, b: 5, food: 'cookie' } },
  { label: 'Plate count', key: 'plate.oneMore', params: { seen: 2, wanted: 3 } },
  ...SPIKE_PAIRS.flatMap((n) => [
    { label: 'Counting', key: 'ct.more' as const, params: { n } },
    { label: 'Counting', key: 'ct.left' as const, params: { n } },
  ]),
];

// ---------- the full inventory (A1–A3, numbers 0–20) ----------

export interface MonsterLines {
  id: string;
  arrive: readonly string[];
  thanks: readonly string[];
}

/** Every parameter combination of a phrase with numbers 0–`NUMBER_MAX` and every food. */
export function phraseParamSets(key: PhraseKey, max = NUMBER_MAX): PhraseParams[] {
  let sets: PhraseParams[] = [{}];
  for (const [name, kind] of Object.entries(phraseDef(key).params)) {
    const values: (number | string)[] = kind === 'food' ? [...FOOD_IDS] : range(0, max);
    sets = sets.flatMap((s) => values.map((v) => ({ ...s, [name]: v })));
  }
  return sets;
}

/**
 * The ticket sentences missing-number forms say (A3: `a + ? = 10`, `? + a = 10`, `10 − ? = a`),
 * passed in by the caller from the built pools so this module needs no generator import.
 */
export type TicketDisplays = readonly (readonly Token[])[];

/**
 * Every clip each voice needs for the built dishes (D139f): all phrases a speaker says, with every
 * number 0–20 and every food (a slight over-count: numbers 0–20 are covered in full anyway), the
 * missing-number tickets, and each monster's own lines in its own voice only.
 */
export function voiceInventory(
  monsters: readonly MonsterLines[],
  tickets: TicketDisplays,
): Map<string, Set<string>> {
  const inv = new Map<string, Set<string>>(VOICE_IDS.map((v) => [v, new Set<string>()]));
  const add = (voices: readonly string[], clips: readonly string[]) => {
    for (const v of voices) for (const c of clips) inv.get(v)!.add(c);
  };
  const voicesOf = (key: PhraseKey): readonly string[] => {
    const who = PHRASE_SPEAKERS[key];
    return who === 'monster' ? MONSTER_VOICES : [who];
  };
  for (const key of Object.keys(PHRASES) as PhraseKey[]) {
    const voices = voicesOf(key);
    for (const params of phraseParamSets(key)) add(voices, clipPlan(key, params));
  }
  for (const d of tickets) add(MONSTER_VOICES, ticketClips(d));
  for (const m of monsters) {
    if (!inv.has(m.id)) continue;
    m.arrive.forEach((_, i) => add([m.id], [monsterClip(m.id, 'arrive', i)]));
    m.thanks.forEach((_, i) => add([m.id], [monsterClip(m.id, 'thanks', i)]));
  }
  return inv;
}

/** The full recording script for the inventory, ordered for one sitting (D144). */
export function fullScript(
  monsters: readonly MonsterLines[],
  tickets: TicketDisplays,
): ScriptSection[] {
  const inv = voiceInventory(monsters, tickets);
  const all = new Set<string>();
  for (const s of inv.values()) for (const c of s) all.add(c);
  const sections: ScriptSection[] = [];
  for (const form of NUMBER_FORMS) {
    const items = range(0, NUMBER_MAX)
      .filter((n) => all.has(numClip(n, form)))
      .map((n) => ({ clip: numClip(n, form), carrier: NUMBER_CARRIERS[form](n) }));
    if (items.length) sections.push({ title: `Numbers, ${form} form`, items });
  }
  sections.push({
    title: 'Foods',
    items: FOOD_IDS.filter((f) => all.has(foodClip(f))).map((f) => ({
      clip: foodClip(f),
      carrier: `Seven plus two [[${FOODS[f].plural}, please!]]`,
    })),
  });
  sections.push({
    title: 'Connecting words',
    items: (Object.keys(WORDS) as WordSlug[])
      .filter((s) => all.has(wordClip(s)))
      .map((s) => ({ clip: wordClip(s), carrier: WORD_CARRIERS[s] })),
  });
  sections.push({
    title: 'Whole lines',
    items: FIXED_LINES.filter((k) => all.has(lineClip(k))).map((k) => ({
      clip: lineClip(k),
      carrier: whole(phrase(k)),
    })),
  });
  sections.push({
    title: 'Monster lines',
    note: 'Each is shifted to that monster’s voice only.',
    items: monsters
      .flatMap((m) => [
        ...m.arrive.map((t, i) => ({ clip: monsterClip(m.id, 'arrive', i), carrier: whole(t) })),
        ...m.thanks.map((t, i) => ({ clip: monsterClip(m.id, 'thanks', i), carrier: whole(t) })),
      ])
      .filter((it) => all.has(it.clip)),
  });
  return sections.filter((s) => s.items.length > 0);
}

// ---------- Markdown (read back by audio:build) ----------

/** One numbered line per item: `12. **Seven** plus two cookies, please! — \`num.7.lead\``. */
export function renderScript(
  title: string,
  intro: readonly string[],
  sections: readonly ScriptSection[],
): string {
  const out: string[] = [`# ${title}`, '', ...intro, ''];
  let n = 0;
  for (const s of sections) {
    out.push(`## ${s.title}`, '');
    if (s.note) out.push(s.note, '');
    for (const it of s.items)
      out.push(`${++n}. ${it.carrier.replace(/\[\[(.+?)\]\]/, '**$1**')} — \`${it.clip}\``);
    out.push('');
  }
  return out.join('\n');
}

export const ITEM_RE = /^(\d+)\. .* — `([^`]+)`\s*$/;

/** Item number → clip id, from a rendered script (the copy the owner read from). */
export function parseScript(md: string): Map<number, string> {
  const map = new Map<number, string>();
  for (const line of md.split(/\r?\n/)) {
    const m = ITEM_RE.exec(line);
    if (m) map.set(Number(m[1]), m[2]!);
  }
  return map;
}

export const scriptItemCount = (sections: readonly ScriptSection[]): number =>
  sections.reduce((a, s) => a + s.items.length, 0);
