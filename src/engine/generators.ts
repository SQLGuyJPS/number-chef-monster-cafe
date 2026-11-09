// Generators and pools (SPEC §4). Pools enumerate ordered presentations (3+5 and 5+3 are two);
// mastery uses the canonical factKey (D50). Tier 1 ships A1–A3.
import { sentenceOf } from './phrases';
import type { Form, Ops, Problem, SkillId, StrategyTag, Token } from './types';

type Difficulty = Problem['difficulty'];

/** Canonical key (D50). Addition result keys sort operands, so commuted partners share a box. */
export function factKeyOf(
  skill: SkillId,
  form: Form,
  operands: readonly (number | null)[],
  answer: number,
): string {
  const known = operands.filter((o): o is number => o !== null);
  switch (form) {
    case 'add':
      return `${skill}:+:${[...known].sort((x, y) => x - y).join(',')}`;
    case 'sub':
      return `${skill}:-:${known.join(',')}`;
    case 'missingAddend': {
      // `a + ? = c` and `? + a = c` share one key (D50).
      const [a, c] = [known[0]!, known[known.length - 1]!];
      return `${skill}:?add:${a},${c}`;
    }
    case 'missingSub':
      return `${skill}:?sub:${known[0]},${known[1] ?? answer}`;
  }
}

/**
 * A1/A2 strategy tags (D42, D17): doubles and near-doubles build on the child's known doubles.
 * A3: the addition forms make ten; its subtraction forms count back from ten (D98).
 */
export function strategyFor(form: Form, a: number, b: number, skill: SkillId = 'A2'): StrategyTag {
  if (skill === 'A3') return form === 'missingAddend' ? 'makeTen' : 'countBack';
  if (form === 'sub' || form === 'missingSub') return 'countBack';
  if (form === 'add') {
    if (a === b) return 'doubles';
    if (Math.abs(a - b) === 1) return 'nearDouble';
  }
  return 'countOn';
}

/**
 * New-fact introduction order (SPEC §4 "Difficulty", D43d). A1/A2 addition: near-doubles first,
 * then by larger addend; subtraction by minuend. Mapped onto 1–5.
 */
function difficultyFor(skill: SkillId, form: Form, a: number, b: number): Difficulty {
  const clamp = (d: number): Difficulty => Math.max(1, Math.min(5, d)) as Difficulty;
  // A3 (SPEC §4): 5+5 and 9+1 easiest, then by distance from 5. `a` is the part of ten shown.
  if (skill === 'A3') return a === 5 || a === 1 || a === 9 ? 1 : clamp(Math.abs(a - 5) + 1);
  if (form === 'add') {
    if (Math.abs(a - b) === 1) return 1;
    const big = Math.max(a, b);
    return clamp(skill === 'A1' ? big - 1 : big - 4); // A1 larger addend 2–4 → 1–3; A2 5–9 → 1–5
  }
  return clamp(skill === 'A1' ? a - 1 : a - 5); // A1 minuend 2–5 → 1–4; A2 6–10 → 1–5
}

function problem(skill: SkillId, form: 'add' | 'sub', a: number, b: number): Problem {
  const answer = form === 'add' ? a + b : a - b;
  const display: Token[] = [a, form === 'add' ? '+' : '−', b, '=', '?'];
  return {
    factKey: factKeyOf(skill, form, [a, b], answer),
    skill,
    form,
    operands: [a, b, null],
    display,
    answer,
    spoken: sentenceOf(display),
    strategy: strategyFor(form, a, b, skill),
    difficulty: difficultyFor(skill, form, a, b),
  };
}

/** A3 (SPEC §4): `a+?=10`, `?+a=10`, `10−a=?`, `10−?=a`, a 1–9. */
function perfectTen(a: number): Problem[] {
  const make = (
    form: Form,
    operands: (number | null)[],
    display: Token[],
    answer: number,
  ): Problem => ({
    factKey: factKeyOf('A3', form, operands, answer),
    skill: 'A3',
    form,
    operands,
    display,
    answer,
    spoken: sentenceOf(display),
    strategy: strategyFor(form, a, 10 - a, 'A3'),
    difficulty: difficultyFor('A3', form, a, 10 - a),
  });
  return [
    make('missingAddend', [a, null, 10], [a, '+', '?', '=', 10], 10 - a),
    make('missingAddend', [null, a, 10], ['?', '+', a, '=', 10], 10 - a),
    make('sub', [10, a, null], [10, '−', a, '=', '?'], 10 - a),
    make('missingSub', [10, null, a], [10, '−', '?', '=', a], 10 - a),
  ];
}

/** A1: within 5, no zero results (SPEC §1.2, D11). A2: sums 6–10. */
const RANGES: Partial<Record<SkillId, { sumMin: number; sumMax: number }>> = {
  A1: { sumMin: 2, sumMax: 5 },
  A2: { sumMin: 6, sumMax: 10 },
};

export const BUILT_SKILLS = ['A1', 'A2', 'A3'] as const satisfies readonly SkillId[];
export type BuiltSkill = (typeof BUILT_SKILLS)[number];
export const isBuilt = (s: string): s is BuiltSkill =>
  (BUILT_SKILLS as readonly string[]).includes(s);

/** Every fact of a skill, ordered presentations (SPEC §4 table). */
export function pool(skill: SkillId): Problem[] {
  if (skill === 'A3') return Array.from({ length: 9 }, (_, i) => perfectTen(i + 1)).flat();
  const r = RANGES[skill];
  if (!r) throw new Error(`pool(${skill}): not built yet`);
  const out: Problem[] = [];
  for (let s = r.sumMin; s <= r.sumMax; s++)
    for (let a = 1; a < s; a++) out.push(problem(skill, 'add', a, s - a));
  for (let m = Math.max(2, r.sumMin); m <= r.sumMax; m++)
    for (let b = 1; b < m; b++) out.push(problem(skill, 'sub', m, b));
  return out;
}

export const isAddition = (p: Problem): boolean => p.form === 'add' || p.form === 'missingAddend';

/** Operation filter (D24): skills with a single operation ignore it. */
export function filterOps(items: readonly Problem[], ops: Ops): Problem[] {
  if (ops === 'both') return items.slice();
  const want = ops === 'add';
  const kept = items.filter((p) => isAddition(p) === want);
  return kept.length > 0 ? kept : items.slice();
}
