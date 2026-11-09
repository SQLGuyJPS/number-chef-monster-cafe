// The grown-ups' gear (SPEC §5.2, D95): 8 square teeth on a ring with a centre hole, in a 24×24
// box. Built from numbers so the teeth are even; the old hand path read as a grey star.
const CX = 12;
const TEETH = 8;
const R_TIP = 11.5;
const R_ROOT = 8.6;
const R_HOLE = 3.6;
const TIP_HALF = 0.2; // radians each side of a tooth's centre at the tip
const ROOT_HALF = 0.27; // a little wider at the root, so the teeth taper slightly

const pt = (r: number, a: number) =>
  `${(CX + r * Math.cos(a)).toFixed(2)} ${(CX + r * Math.sin(a)).toFixed(2)}`;

function build(): string {
  const parts: string[] = [];
  for (let i = 0; i < TEETH; i++) {
    const a = (i * 2 * Math.PI) / TEETH;
    const next = ((i + 1) * 2 * Math.PI) / TEETH;
    parts.push(
      `${i === 0 ? 'M' : 'L'}${pt(R_ROOT, a - ROOT_HALF)}`,
      `L${pt(R_TIP, a - TIP_HALF)}`,
      `L${pt(R_TIP, a + TIP_HALF)}`,
      `L${pt(R_ROOT, a + ROOT_HALF)}`,
      `A${R_ROOT} ${R_ROOT} 0 0 1 ${pt(R_ROOT, next - ROOT_HALF)}`,
    );
  }
  parts.push(
    'Z',
    `M${CX + R_HOLE} ${CX}`,
    `A${R_HOLE} ${R_HOLE} 0 1 0 ${CX - R_HOLE} ${CX}`,
    `A${R_HOLE} ${R_HOLE} 0 1 0 ${CX + R_HOLE} ${CX}Z`,
  );
  return parts.join('');
}

export const GEAR_PATH = build();
