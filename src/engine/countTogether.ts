// CountTogether (SPEC §5.5, D42c): the model bubble shows the problem, blue group then orange
// group, and Pip counts with running numbers, ending at the answer. For missing amounts the count
// ends at the total, then Pip counts the orange group from one ("one, two, three — three more").
import type { PhraseKey, PhraseParams } from './phrases';
import type { Problem } from './types';

export interface ModelCell {
  role: 'prefill' | 'child';
  /** Running count shown on the item. */
  pop?: number;
  /** Taken away (drawn faded). */
  gone?: boolean;
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
  const known = p.operands.filter((o): o is number => o !== null);
  const ticks: CountTick[] = [];
  const snap = (cells: ModelCell[]) => cells.map((c) => ({ ...c }));

  if (p.form === 'add' || p.form === 'missingAddend') {
    const blue = known[0]!;
    const orange = p.form === 'add' ? known[1]! : p.answer;
    const cells = cellsOf(blue, orange);
    ticks.push({ key: 'ct.start', params: {}, cells: snap(cells) });
    for (let i = 0; i < cells.length; i++) {
      cells[i]!.pop = i + 1;
      ticks.push({ key: 'count.n', params: { n: i + 1 }, cells: snap(cells) });
    }
    if (p.form === 'add') {
      ticks.push({ key: 'ct.total', params: { n: blue + orange }, cells: snap(cells) });
      return ticks;
    }
    // Missing addend: count the orange group from one.
    cells.forEach((c) => (c.pop = undefined));
    for (let i = 0; i < orange; i++) {
      cells[blue + i]!.pop = i + 1;
      ticks.push({ key: 'count.n', params: { n: i + 1 }, cells: snap(cells) });
    }
    ticks.push({ key: 'ct.more', params: { n: orange }, cells: snap(cells) });
    return ticks;
  }

  // Subtraction: the whole minuend, the part to take away in orange at the end; count back as the
  // orange items go (they come from the last filled cells, D30).
  const m = known[0]!;
  const away = p.form === 'sub' ? known[1]! : p.answer;
  const cells = cellsOf(m - away, away);
  ticks.push({ key: 'demo.start', params: { n: m }, cells: snap(cells) });
  for (let i = 1; i <= away; i++) {
    cells[m - i]!.gone = true;
    ticks.push({ key: 'count.n', params: { n: m - i }, cells: snap(cells) });
  }
  if (p.form === 'sub') {
    ticks.push({ key: 'ct.left', params: { n: m - away }, cells: snap(cells) });
    return ticks;
  }
  for (let i = 0; i < away; i++) {
    cells[m - away + i]!.pop = i + 1;
    ticks.push({ key: 'count.n', params: { n: i + 1 }, cells: snap(cells) });
  }
  ticks.push({ key: 'ct.away', params: { n: away }, cells: snap(cells) });
  return ticks;
}
