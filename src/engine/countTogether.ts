// CountTogether (SPEC §5.5, D42c): the model bubble shows the problem, blue group then orange
// group, and Pip counts with running numbers, ending at the answer. Missing-number forms count only
// the unknown, from one, in the bubble's own picture (D104, D105): the same ticks are Pip's Worked
// demo at S1, where the child's tray holds only the answer and must not fill with other food.
import type { PhraseKey, PhraseParams } from './phrases';
import type { Problem } from './types';

export interface ModelCell {
  role: 'prefill' | 'child';
  /** Running count shown on the item. */
  pop?: number;
  /** Taken away (drawn faded). */
  gone?: boolean;
  /** An empty spot still to fill (dashed orange outline, no food; D104). */
  spot?: boolean;
  /** Highlighted while Pip names this group. */
  glow?: boolean;
}

export interface CountTick {
  key: PhraseKey;
  params: PhraseParams;
  cells: ModelCell[];
}

const cellsOf = (blue: number, orange: number): ModelCell[] => [
  ...Array.from({ length: blue }, () => ({ role: 'prefill' as const })),
  ...Array.from({ length: orange }, () => ({ role: 'child' as const })),
];

export function countTogetherTicks(p: Problem): CountTick[] {
  if (p.form === 'missingAddend' || p.form === 'missingSub') {
    const demo = missingTicks(p);
    return [{ key: 'ct.start', params: {}, cells: demo[0]!.cells.map((c) => ({ ...c, glow: false })) }, ...demo];
  }
  const known = p.operands.filter((o): o is number => o !== null);
  const ticks: CountTick[] = [];
  const snap = (cells: ModelCell[]) => cells.map((c) => ({ ...c }));

  if (p.form === 'add') {
    const blue = known[0]!;
    const orange = known[1]!;
    const cells = cellsOf(blue, orange);
    ticks.push({ key: 'ct.start', params: {}, cells: snap(cells) });
    for (let i = 0; i < cells.length; i++) {
      cells[i]!.pop = i + 1;
      ticks.push({ key: 'count.n', params: { n: i + 1 }, cells: snap(cells) });
    }
    ticks.push({ key: 'ct.total', params: { n: blue + orange }, cells: snap(cells) });
    return ticks;
  }

  // Subtraction: the whole minuend, the part to take away in orange at the end; count back as the
  // orange items go (they come from the last filled cells, D30).
  const m = known[0]!;
  const away = known[1]!;
  const cells = cellsOf(m - away, away);
  ticks.push({ key: 'demo.start', params: { n: m }, cells: snap(cells) });
  for (let i = 1; i <= away; i++) {
    cells[m - i]!.gone = true;
    ticks.push({ key: 'count.n', params: { n: m - i }, cells: snap(cells) });
  }
  ticks.push({ key: 'ct.left', params: { n: m - away }, cells: snap(cells) });
  return ticks;
}

/**
 * Missing-number forms in the model bubble (D104, D105), the same story as the tray demo.
 * `a + ? = c`: "Seven." (blue glows) "Three empty spots." (the dashed spots glow), the spots fill
 * counted from one, "Seven and three more makes ten!". `m − ? = c`: "Ten.", the orange items go
 * counted from one, "Six left!", "Four taken away!".
 */
export function missingTicks(p: Problem): CountTick[] {
  const known = p.operands.filter((o): o is number => o !== null);
  const snap = (cells: ModelCell[]) => cells.map((c) => ({ ...c }));
  const ticks: CountTick[] = [];
  const glowOnly = (cells: ModelCell[], from: number, to: number) =>
    cells.forEach((c, i) => (c.glow = i >= from && i < to));

  if (p.form === 'missingAddend') {
    const a = known[0]!;
    const gap = p.answer;
    const total = a + gap;
    const cells: ModelCell[] = [
      ...Array.from({ length: a }, () => ({ role: 'prefill' as const })),
      ...Array.from({ length: gap }, () => ({ role: 'child' as const, spot: true })),
    ];
    glowOnly(cells, 0, a);
    ticks.push({ key: 'demo.start', params: { n: a }, cells: snap(cells) });
    glowOnly(cells, a, total);
    ticks.push({ key: gap === 1 ? 'demo.ten.gap1' : 'demo.ten.gap', params: { n: gap }, cells: snap(cells) });
    glowOnly(cells, 0, 0);
    for (let i = 1; i <= gap; i++) {
      cells[a + i - 1] = { role: 'child', pop: i };
      ticks.push({ key: 'count.n', params: { n: i }, cells: snap(cells) });
    }
    if (total === 10) {
      glowOnly(cells, 0, 10);
      ticks.push({ key: 'demo.ten.make', params: { a, b: gap }, cells: snap(cells) });
    } else {
      glowOnly(cells, a, total);
      ticks.push({ key: 'ct.more', params: { n: gap }, cells: snap(cells) });
    }
    return ticks;
  }

  const m = known[0]!;
  const away = p.answer;
  const left = m - away;
  const cells = cellsOf(left, away);
  glowOnly(cells, 0, m);
  ticks.push({ key: 'demo.start', params: { n: m }, cells: snap(cells) });
  glowOnly(cells, 0, 0);
  // They go from the last filled cell (D30), counted from one: the answer is the last number.
  for (let i = 1; i <= away; i++) {
    cells[m - i]!.gone = true;
    ticks.push({ key: 'count.n', params: { n: i }, cells: snap(cells) });
  }
  glowOnly(cells, 0, left);
  ticks.push({ key: 'demo.left', params: { n: left }, cells: snap(cells) });
  glowOnly(cells, 0, 0);
  ticks.push({ key: 'ct.away', params: { n: away }, cells: snap(cells) });
  return ticks;
}
