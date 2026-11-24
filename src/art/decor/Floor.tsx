// Floor slot art (M4b batch 1, ART_GUIDE §5): y 330 down past the counter's far edge, mostly
// hidden by the counter, so the interest sits near the top. Tiled floors are drawn in gentle
// perspective (rows grow toward the child, seams run to one vanishing point above the room); all
// tiles of one colour are one <path>, so a whole floor costs a few elements. Colorway items take
// only {base, accent} (ART_GUIDE §2.3).
import type { ReactElement } from 'react';
import { DECOR } from '../../app/metrics';
import { CREAM, mix } from './paint';
import { FloorStandIn, type DecorLook } from './StandIn';

const TOP = DECOR.floor.y;
const BLEED = { x: -1000, w: 3280, h: 300 };

/** Vanishing point: centred, high above the floor, so the seams lean only gently. */
const VX = 640;
const VY = 24;
/** Tile width at the far (top) edge of the floor, in stage px. */
const W0 = 48;

/** Row edges: each row deeper by the square of its distance from the horizon (perspective). */
const ROWS: readonly number[] = (() => {
  const k = 18 / (TOP - VY) ** 2;
  const ys: number[] = [TOP];
  while (ys[ys.length - 1]! < DECOR.floor.y + DECOR.floor.h + 12) {
    const y = ys[ys.length - 1]!;
    ys.push(y + k * (y - VY) ** 2);
  }
  return ys;
})();
const COLS = 40;

/** x of seam `k` at height `y`: seams are rays from the vanishing point. */
const seamX = (k: number, y: number): number => VX + (k * W0 * (y - VY)) / (TOP - VY);
const f = (n: number) => n.toFixed(1);

function quad(r: number, k: number): string {
  const y0 = ROWS[r]!;
  const y1 = ROWS[r + 1]!;
  return `M${f(seamX(k, y0))} ${f(y0)}L${f(seamX(k + 1, y0))} ${f(y0)}L${f(seamX(k + 1, y1))} ${f(y1)}L${f(seamX(k, y1))} ${f(y1)}Z`;
}

function cells(keep: (r: number, k: number) => boolean): string {
  let d = '';
  for (let r = 0; r < ROWS.length - 1; r++)
    for (let k = -COLS; k < COLS; k++) if (keep(r, k)) d += quad(r, k);
  return d;
}

const CHECKS = cells((r, k) => (r + k) % 2 === 0);

const GROUT = (() => {
  const bottom = ROWS[ROWS.length - 1]!;
  let d = '';
  for (const y of ROWS.slice(1)) d += `M${BLEED.x} ${f(y)}H${BLEED.x + BLEED.w}`;
  for (let k = -COLS; k <= COLS; k++) d += `M${f(seamX(k, TOP))} ${TOP}L${f(seamX(k, bottom))} ${f(bottom)}`;
  return d;
})();

/** Little diamonds where the grout lines cross, sized with the tiles. */
const STUDS = (() => {
  let d = '';
  for (const y of ROWS.slice(1, -1))
    for (let k = -COLS; k <= COLS; k++) {
      const x = seamX(k, y);
      const s = (W0 * (y - VY)) / (TOP - VY) * 0.13;
      d += `M${f(x)} ${f(y - s * 0.7)}L${f(x + s)} ${f(y)}L${f(x)} ${f(y + s * 0.7)}L${f(x - s)} ${f(y)}Z`;
    }
  return d;
})();

function Base({ fill }: { fill: string }) {
  return <rect x={BLEED.x} y={TOP} width={BLEED.w} height={BLEED.h} fill={fill} />;
}
/** Where the floor meets the wainscot: the same soft line the café's own floor has. */
function Skirting() {
  return <rect x={BLEED.x} y={TOP} width={BLEED.w} height={5} fill="rgba(0,0,0,0.08)" />;
}

/**
 * The café's own floorboards. The scene draws its classic floor with this too, so Wood in Honey or
 * Cocoa is the same floor stained another colour.
 */
export function Boards({ floor, plank }: { floor: string; plank: string }) {
  return (
    <g>
      <Base fill={floor} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={BLEED.x} y={TOP + 14 + i * 26} width={BLEED.w} height={12} fill={plank} opacity={0.5} />
      ))}
      <Skirting />
    </g>
  );
}

/** The café's own floorboards (classic Wood, the free default, D152). */
export const CLASSIC_BOARDS = { floor: '#e2ad6f', plank: '#d79f62' } as const;

/** A colour of Wood is the café's boards stained with the family's accent, so it stays wood. */
function Wood({ accent }: DecorLook) {
  return <Boards floor={mix(CLASSIC_BOARDS.floor, accent, 0.35)} plank={mix(CLASSIC_BOARDS.plank, accent, 0.5)} />;
}

/** Two tones of the family, light and mid: a checker that stays softer than the monsters. */
function Checkerboard({ base, accent }: DecorLook) {
  return (
    <g>
      <Base fill={mix(base, CREAM, 0.45)} />
      <path d={CHECKS} fill={mix(base, accent, 0.5)} />
      <Skirting />
    </g>
  );
}

/** Pale glazed tiles with cream grout and a coloured diamond where four tiles meet. */
function Tiles({ base, accent }: DecorLook) {
  return (
    <g>
      <Base fill={base} />
      <path d={GROUT} fill="none" stroke={CREAM} strokeWidth={3} />
      <path d={STUDS} fill={mix(base, accent, 0.55)} />
      <Skirting />
    </g>
  );
}

/** One puffy cloud, squashed flat as if lying on the floor; overlapping bumps in one path. */
function cloud(cx: number, cy: number, w: number): string {
  const q = 0.6;
  const bumps: [number, number, number][] = [
    [-0.3, 0.06, 0.17],
    [-0.1, -0.1, 0.22],
    [0.14, -0.14, 0.2],
    [0.32, 0.04, 0.16],
    [0.0, 0.1, 0.36],
  ];
  return bumps
    .map(([dx, dy, r]) => {
      const rx = r * w;
      const ry = r * w * q;
      const x = cx + dx * w - rx;
      const y = cy + dy * w * q;
      return `M${f(x)} ${f(y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
    })
    .join('');
}

/** Two staggered rows of clouds, smaller at the back; the near row mostly behind the counter. */
const CLOUDS = (() => {
  let d = '';
  for (let x = -1000; x < 2300; x += 220) d += cloud(x, TOP + 26, 70);
  for (let x = -890; x < 2300; x += 220) d += cloud(x, TOP + 72, 92);
  return d;
})();

/** Cloud Carpet: a soft wall-to-wall carpet in the family colour with cream clouds on it. */
function CloudCarpet({ base, accent }: DecorLook) {
  return (
    <g>
      <Base fill={mix(base, accent, 0.12)} />
      <path d={CLOUDS} transform="translate(0 4)" fill={mix(base, accent, 0.32)} />
      <path d={CLOUDS} fill={CREAM} />
      <Skirting />
    </g>
  );
}

const ART: Record<string, (look: DecorLook) => ReactElement> = {
  wood: Wood,
  checkerboard: Checkerboard,
  tiles: Tiles,
  'cloud-carpet': CloudCarpet,
};

/** An item's drawing alone (no slot marker), or null if it has none yet: the shop crops it. */
export function floorArt(look: DecorLook): ReactElement | null {
  const Art = ART[look.item];
  return Art ? <Art {...look} /> : null;
}

/** The equipped floor, or its labelled stand-in if it has no art yet (ART_GUIDE §2.7). */
export function Floor({ look }: { look: DecorLook }) {
  const Art = ART[look.item];
  if (!Art) return <FloorStandIn look={look} />;
  return (
    <g data-decor="floor" data-item={look.item}>
      <Art {...look} />
    </g>
  );
}
