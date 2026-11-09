// Results tally (SPEC §5.7, D55): count up aloud by ones to ten, then by fives, and always end on
// the exact total ("…fifteen, twenty, twenty-three!").
export function tallySteps(total: number): number[] {
  const out: number[] = [];
  for (let n = 1; n <= Math.min(10, total); n++) out.push(n);
  for (let n = 15; n < total; n += 5) out.push(n);
  if (total > 10) out.push(total);
  return out;
}
