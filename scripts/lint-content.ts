// Content lint v1 (SPEC §13.2). Fails `npm run check` on any problem. Covers the A1–A3 pools,
// spoken text, phrases, toTrayTask/check agreement, monster specs (SPEC §7.2) and the emoji allowlist.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOOD_IDS, FOODS } from '../src/engine/foods';
import { BUILT_SKILLS, isAddition, pool } from '../src/engine/generators';
import {
  PHRASES,
  phrase,
  phraseDef,
  type PhraseKey,
  type PhraseParams,
} from '../src/engine/phrases';
import { buildDemo } from '../src/engine/demos';
import { check, removeLast, startState, tapBin, toTrayTask } from '../src/engine/tray';
import { STAGES, type Problem, type SkillId, type Token } from '../src/engine/types';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REGULARS } from '../src/engine/monsters';
import {
  BODIES,
  EXPRESSIONS,
  EXTRAS,
  INK,
  MONSTER_SPECS,
  MONSTER_SPEC_VERSION,
  REACTIONS,
} from '../src/art/monsters/specs';
import { DRAWINGS } from '../src/art/monsters/roster';

const repo = fileURLToPath(new URL('../', import.meta.url));
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

/** SPEC §4 table: ordered presentations. A drift fails with the new number printed. */
const EXPECTED_SIZES: Partial<Record<SkillId, { add: number; sub: number }>> = {
  A1: { add: 10, sub: 10 },
  A2: { add: 35, sub: 35 },
  A3: { add: 18, sub: 18 },
};

/** Independent evaluator: parses the ticket tokens and solves for the blank (SPEC §13.2). */
function solve(display: readonly Token[]): number | null {
  const eq = display.indexOf('=');
  if (eq < 0) return null;
  const left = display.slice(0, eq);
  const right = display.slice(eq + 1);
  if (left.length !== 3 || right.length !== 1) return null;
  const [x, op, y] = left as [Token, Token, Token];
  const z = right[0]!;
  if (op !== '+' && op !== '−') return null;
  const apply = (a: number, b: number) => (op === '+' ? a + b : a - b);
  if (z === '?' && typeof x === 'number' && typeof y === 'number') return apply(x, y);
  if (typeof z !== 'number') return null;
  if (x === '?' && typeof y === 'number') return op === '+' ? z - y : z + y;
  if (y === '?' && typeof x === 'number') return op === '+' ? z - x : x - z;
  return null;
}

// Digits and maths symbols never reach TTS (SPEC §8.2). A hyphen is fine inside a number word
// ("twenty-one") and a question mark is fine as punctuation after a word, never as the blank.
const SPOKEN_FORBIDDEN = /[0-9+−=]|(?<![a-z])-|-(?![a-z])|(?<![a-z])\?/i;
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

function checkSpoken(where: string, text: string, maxWords: number, needsEnd = true) {
  if (SPOKEN_FORBIDDEN.test(text)) fail(`${where}: digits or symbols in spoken text: "${text}"`);
  if (needsEnd && !/[?.!]$/.test(text)) fail(`${where}: must end with ? . or !: "${text}"`);
  if (words(text) > maxWords) fail(`${where}: ${words(text)} words (max ${maxWords}): "${text}"`);
}

// ---------- pools ----------
for (const skill of BUILT_SKILLS) {
  const items = pool(skill);
  const want = EXPECTED_SIZES[skill];
  const add = items.filter(isAddition).length;
  const sub = items.length - add;
  if (!items.length) fail(`${skill}: empty pool`);
  if (want && (want.add !== add || want.sub !== sub))
    fail(`${skill}: pool is ${add} add + ${sub} sub, SPEC §4 says ${want.add} + ${want.sub}`);

  const shown = new Set<string>();
  for (const p of items) {
    const id = `${skill} ${p.display.join(' ')}`;
    if (shown.has(id)) fail(`${id}: duplicate presentation`);
    shown.add(id);
    const solved = solve(p.display);
    if (solved !== p.answer)
      fail(`${id}: answer ${p.answer}, independent evaluator says ${solved}`);
    if (p.answer <= 0) fail(`${id}: zero or negative answer (D11)`);
    checkRanges(skill, p, id);
    checkSpoken(`${id} spoken`, p.spoken, 12);
    if (p.form === 'add' || p.form === 'sub') {
      for (const food of FOOD_IDS) {
        const [a, b] = p.operands;
        checkSpoken(
          `${id} wrapped (${food})`,
          phrase(p.form === 'add' ? 'order.add' : 'order.sub', { a: a!, b: b!, food }),
          12,
        );
      }
    }
    for (const stage of STAGES) checkTray(p, stage, id);
    for (const step of buildDemo(p))
      checkSpoken(
        `${id} demo ${step.narrationKey}`,
        phrase(step.narrationKey, step.params),
        8,
        false,
      );
  }
  // Commuted partners share one key; distinct facts never collide.
  const byKey = new Map<string, Set<string>>();
  for (const p of items) {
    const known = p.operands.filter((o) => o !== null) as number[];
    const canon =
      p.form === 'add'
        ? [...known].sort().join('+')
        : p.form === 'missingAddend'
          ? `${known.join('?')}=` // a+?=c and ?+a=c are commuted partners (D50)
          : p.display.join('');
    byKey.set(p.factKey, (byKey.get(p.factKey) ?? new Set()).add(canon));
  }
  for (const [k, v] of byKey)
    if (v.size > 1) fail(`${skill}: factKey ${k} covers different facts: ${[...v].join(', ')}`);
}

function checkRanges(skill: SkillId, p: Problem, id: string) {
  const ops = p.operands.filter((o): o is number => o !== null);
  if (ops.some((o) => o < 1)) fail(`${id}: operand below 1`);
  // The whole of the sentence: the sum, the minuend, or the total a missing addend makes.
  const top =
    p.form === 'add' ? p.answer : p.form === 'missingAddend' ? ops[ops.length - 1]! : ops[0]!;
  const [lo, hi] = skill === 'A1' ? [2, 5] : skill === 'A3' ? [10, 10] : [6, 10];
  if (top < lo || top > hi) fail(`${id}: whole ${top} outside ${lo}–${hi}`);
}

/** toTrayTask/check agree with the answer at every stage (SPEC §13.2). */
function checkTray(p: Problem, stage: (typeof STAGES)[number], id: string) {
  const task = toTrayTask(p, stage);
  if (stage === 0) {
    if (!check(task, { filled: 0, typed: p.answer }))
      fail(`${id} S0: typing the answer is not accepted`);
    if (check(task, { filled: 0, typed: p.answer + 1 }))
      fail(`${id} S0: a wrong number is accepted`);
    return;
  }
  let s = startState(task);
  for (let i = 0; i < 25 && s.filled < task.expected.cells; i++) s = tapBin(s).state;
  for (let i = 0; i < 25 && s.filled > task.expected.cells; i++) s = removeLast(s).state;
  if (!check(task, s)) fail(`${id} S${stage}: the expected tray is unreachable`);
  // The tray value that stands for the unknown (SPEC §3.2): the result, the missing addend
  // (what the child added) or the missing subtrahend (what the child took away).
  const unknown =
    stage === 1 || p.form === 'add' || p.form === 'sub'
      ? s.filled
      : p.form === 'missingAddend'
        ? s.filled - s.prefill
        : s.prefill - s.filled;
  if (unknown !== p.answer) fail(`${id} S${stage}: tray shows ${unknown}, answer is ${p.answer}`);
}

// ---------- phrase table ----------
const SAMPLE_N = [0, 1, 2, 7, 10, 13, 20];
for (const key of Object.keys(PHRASES) as PhraseKey[]) {
  const def = phraseDef(key);
  const names = Object.keys(def.params);
  const combos: PhraseParams[] = [{}];
  for (const name of names) {
    const values = def.params[name] === 'food' ? [...FOOD_IDS] : SAMPLE_N;
    combos.splice(
      0,
      combos.length,
      ...combos.flatMap((c) => values.map((v) => ({ ...c, [name]: v }))),
    );
  }
  for (const params of combos) {
    let text: string;
    try {
      text = phrase(key, params);
    } catch (e) {
      fail(`phrase ${key}: throws for ${JSON.stringify(params)}: ${(e as Error).message}`);
      continue;
    }
    // Captions ≤ 8 words; ticket lines ≤ 12 (SPEC §13.2). `count.n` is a bare number word.
    checkSpoken(
      `phrase ${key} ${JSON.stringify(params)}`,
      text,
      def.ticket ? 12 : 8,
      key !== 'count.n',
    );
  }
}

// ---------- monster specs (SPEC §7.2) ----------
/** WCAG relative luminance and contrast ratio. */
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const l = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};
/** Pip speaks at 1.5 (D90); every monster stays below so Pip is always recognisable (D101). */
const PIP_PITCH = 1.5;
if (MONSTER_SPEC_VERSION !== 1) fail(`MonsterSpec version ${MONSTER_SPEC_VERSION}: add a migration note`);
if (EXPRESSIONS.length !== 5) fail(`monsters: ${EXPRESSIONS.length} expressions, SPEC §7.2 says five`);
const monsterIds = new Set<string>();
for (const m of MONSTER_SPECS) {
  const at = `monster ${m.id}`;
  if (monsterIds.has(m.id)) fail(`${at}: duplicate id`);
  monsterIds.add(m.id);
  if (!BODIES.includes(m.body)) fail(`${at}: unknown body ${m.body}`);
  for (const x of m.extras) if (!EXTRAS.includes(x)) fail(`${at}: extra ${x} not allowed`);
  for (const f of m.favorites) if (!FOOD_IDS.includes(f)) fail(`${at}: favourite ${f} not in the food allowlist`);
  if (m.favorites[0] === m.favorites[1]) fail(`${at}: two favourites must differ`);
  for (const r of m.reactions) if (!REACTIONS.includes(r)) fail(`${at}: reaction ${r} does not exist`);
  if (!m.reactions.length) fail(`${at}: no reaction`);
  for (const part of ['body', 'belly'] as const) {
    const ratio = contrast(m.palette[part], INK);
    if (ratio < 3) fail(`${at}: ${part} ${m.palette[part]} vs eyes/mouth ${ratio.toFixed(2)}:1 (min 3:1)`);
  }
  if (m.voice.pitch >= PIP_PITCH || m.voice.pitch <= 0) fail(`${at}: voice pitch ${m.voice.pitch} must be in (0, ${PIP_PITCH})`);
  if (m.voice.rate < 0.5 || m.voice.rate > 1.2) fail(`${at}: voice rate ${m.voice.rate} out of range`);
  for (const line of [...m.lines.arrive, ...m.lines.thanks]) checkSpoken(`${at} line`, line, 8);
  if (!m.lines.arrive.length || !m.lines.thanks.length) fail(`${at}: needs arrive and thanks lines`);
  const engine = REGULARS.find((r) => r.id === m.id);
  if (!engine) fail(`${at}: not in the engine roster`);
  else if (engine.favorites.join() !== m.favorites.join()) fail(`${at}: favourites differ from the engine roster`);
  // All five expressions are drawn, and each one looks different.
  const draw = DRAWINGS[m.id];
  if (!draw) {
    fail(`${at}: no hand-authored drawing`);
    continue;
  }
  const looks = new Set<string>();
  for (const e of EXPRESSIONS) {
    const svg = renderToStaticMarkup(createElement(draw, { e, s: m, react: false }));
    if (svg.length < 200) fail(`${at} ${e}: drawing is nearly empty`);
    looks.add(svg);
  }
  if (looks.size !== EXPRESSIONS.length) fail(`${at}: some expressions draw the same picture`);
}
for (const r of REGULARS) if (!monsterIds.has(r.id)) fail(`engine roster ${r.id}: no MonsterSpec`);

// ---------- emoji allowlist scan (SPEC §7.1) ----------
interface EmojiTable {
  maxUnicode: number;
  allow: Record<string, { name: string; unicode: number }>;
  deny: Record<string, { name: string; why: string }>;
}
const table = JSON.parse(
  readFileSync(join(repo, 'scripts/emoji-versions.json'), 'utf8'),
) as EmojiTable;
for (const e of Object.values(table.allow))
  if (e.unicode > table.maxUnicode) fail(`emoji-versions.json: ${e.name} is Unicode ${e.unicode}`);
for (const id of FOOD_IDS) {
  const cp = FOODS[id].glyph.codePointAt(0)!.toString(16).toUpperCase();
  if (!table.allow[cp]) fail(`food ${id}: glyph U+${cp} is not in the allowlist`);
  if ([...FOODS[id].glyph.replace('️', '')].length !== 1)
    fail(`food ${id}: glyph is not one codepoint`);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const PICTO = /\p{Extended_Pictographic}/u;
const ESCAPE =
  /\\u\{([0-9a-fA-F]{4,6})\}|\\u([dD][89abAB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})/g;
const textOk = (cp: number) => cp < 0x2000; // ©, ® and other plain-text symbols are not emoji
for (const file of walk(join(repo, 'src')).filter((f) => /\.(tsx?|css|html|json)$/.test(f))) {
  const src = readFileSync(file, 'utf8');
  const rel = relative(repo, file);
  const found: number[] = [];
  for (const ch of src) if (PICTO.test(ch)) found.push(ch.codePointAt(0)!);
  for (const m of src.matchAll(ESCAPE)) {
    const cp = m[1]
      ? parseInt(m[1], 16)
      : String.fromCharCode(parseInt(m[2]!, 16), parseInt(m[3]!, 16)).codePointAt(0)!;
    if (PICTO.test(String.fromCodePoint(cp))) found.push(cp);
  }
  for (const cp of found) {
    const hex = cp.toString(16).toUpperCase();
    if (textOk(cp) || table.allow[hex]) continue;
    const deny = table.deny[hex];
    fail(
      `${rel}: emoji U+${hex}${deny ? ` (${deny.name}: ${deny.why})` : ''} is not on the allowlist (SPEC §7.1)`,
    );
  }
}

if (errors.length) {
  console.error(`lint:content: ${errors.length} problem(s)`);
  for (const e of errors.slice(0, 50)) console.error(`  ✗ ${e}`);
  process.exit(1);
}
const sizes = BUILT_SKILLS.map((s) => `${s} ${pool(s).length}`).join(', ');
console.log(
  `lint:content: OK (pools ${sizes}; ${Object.keys(PHRASES).length} phrases; ${MONSTER_SPECS.length} monsters × ${EXPRESSIONS.length} expressions; emoji allowlist clean)`,
);
