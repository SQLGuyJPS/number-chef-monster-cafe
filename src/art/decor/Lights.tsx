// Lights slot art (M4b batch 2, ART_GUIDE §5): hung just below the status bar, in the two runs
// left and right of the wall-art spot (DECOR.lightsLeft / lightsRight), so nothing hangs over the
// monster's head or the wall art. Runs continue past the safe box for the wide-phone bleed. Shapes
// of one colour share one <path> wherever they don't move on their own, so a whole run costs a
// handful of elements; colorway items take only {base, accent} (ART_GUIDE §2.3). Disco Ball and
// Star Chandelier are metal and glass, with their own colours. Motion is opacity or a small sway
// only, and stops under reduced motion (decor.css).
import type { ReactElement } from 'react';
import { BAR_H, DECOR } from '../../app/metrics';
import { COLOR_FAMILIES } from '../../engine/economy';
import { CREAM, GOLD, GOLD_DARK, ellipsePath, mix, sparklePath, starPath } from './paint';
import { LightsStandIn, type DecorLook } from './StandIn';
import './decor.css';

const CORD = '#8a6a4a';
const f = (n: number) => n.toFixed(1);

/** Where the runs hang from: just under the bar's wooden trim. */
const PIN_Y = BAR_H + 4;
const L = DECOR.lightsLeft;
const R = DECOR.lightsRight;
/**
 * Pins of the swags, left then right: three scallops a side, the outer one past the safe box (the
 * bleed on wide phones), the inner ends at the edges of the wall-art spot.
 */
const SCALLOPS: readonly (readonly [number, number])[] = (() => {
  const w = L.w / 2;
  return [
    [L.x - w, L.x],
    [L.x, L.x + w],
    [L.x + w, L.x + L.w],
    [R.x, R.x + w],
    [R.x + w, R.x + R.w],
    [R.x + R.w, R.x + R.w + w],
  ];
})();

/** A point on a swag (a quadratic sag between two pins) at t from 0 to 1. */
const onSwag = (a: number, b: number, sag: number, t: number): [number, number] => [
  a + (b - a) * t,
  PIN_Y + 4 * sag * t * (1 - t),
];

function cordPath(sag: number): string {
  return SCALLOPS.map(([a, b]) => `M${a} ${PIN_Y}Q${(a + b) / 2} ${PIN_Y + 2 * sag} ${b} ${PIN_Y}`).join('');
}

function Cord({ sag }: { sag: number }) {
  return <path d={cordPath(sag)} fill="none" stroke={CORD} strokeWidth={2} strokeLinecap="round" opacity={0.7} />;
}

/* ---------- String Lights ---------- */

/**
 * String Lights: three swags a side of round bulbs in three tones of the family. Each bulb has a
 * soft halo; the halos breathe slowly in three groups, so the string looks lit without any bulb
 * flashing.
 */
function StringLights({ base, accent }: DecorLook) {
  const SAG = 20;
  const tones = [mix(base, accent, 0.72), mix(base, accent, 0.4), mix(base, accent, 0.12)];
  const halo = mix(base, '#ffffff', 0.45);
  const bulbs = SCALLOPS.flatMap(([a, b]) => [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => onSwag(a, b, SAG, t)));
  const caps = bulbs.map(([x, y]) => `M${f(x - 3.5)} ${f(y - 1)}h7v7h-7Z`).join('');
  const body = (i: number) =>
    bulbs
      .filter((_, k) => k % 3 === i)
      .map(([x, y]) => ellipsePath(x, y + 16, 8.5, 11))
      .join('');
  const shine = bulbs.map(([x, y]) => ellipsePath(x - 3, y + 12.5, 2.2, 3.4)).join('');
  const halos = (i: number) =>
    bulbs
      .filter((_, k) => k % 3 === i)
      .map(([x, y]) => ellipsePath(x, y + 16, 16))
      .join('');
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <path
          key={`h${i}`}
          className="decor-glow"
          style={{ animationDelay: `${-i * 1.2}s` }}
          d={halos(i)}
          fill={halo}
          fillOpacity={0.45}
        />
      ))}
      <Cord sag={SAG} />
      <path d={caps} fill={CORD} />
      {[0, 1, 2].map((i) => (
        <path key={`b${i}`} d={body(i)} fill={tones[i]} />
      ))}
      <path d={shine} fill="#ffffff" opacity={0.55} />
    </g>
  );
}

/* ---------- Paper Lanterns ---------- */

/**
 * Paper Lanterns: two round lanterns per swag on short strings of two lengths, in three tones of
 * the family, with paper ribs, a shaded side and a dark cap top and bottom. Each sways a little on
 * its string, out of step with its neighbours.
 */
function PaperLanterns({ base, accent }: DecorLook) {
  const SAG = 10;
  const CAP = '#8a5a35';
  const tones = [mix(base, accent, 0.5), mix(base, CREAM, 0.2), mix(base, accent, 0.78)];
  const hangs = SCALLOPS.flatMap(([a, b]) => [0.27, 0.73].map((t) => onSwag(a, b, SAG, t)));
  return (
    <g>
      <Cord sag={SAG} />
      {hangs.map(([x, y], i) => {
        const fill = tones[i % 3]!;
        const rib = mix(fill, accent, 0.55);
        const drop = i % 2 ? 12 : 4;
        const rx = 18;
        const ry = 14;
        const cy = y + drop + 4 + ry;
        // Ribs follow the paper's curve: each is a shallow arc across the lantern at its height.
        const ribs = [-0.5, 0, 0.5]
          .map((k) => {
            const yy = cy + k * ry;
            const half = rx * Math.sqrt(1 - k * k) - 1.5;
            return `M${f(x - half)} ${f(yy - 1)}Q${f(x)} ${f(yy + 3)} ${f(x + half)} ${f(yy - 1)}`;
          })
          .join('');
        return (
          <g
            key={i}
            className="decor-sway"
            style={{ transformOrigin: `${f(x)}px ${f(y)}px`, animationDelay: `${-((i * 1.7) % 5)}s` }}
          >
            <path d={`M${f(x)} ${f(y)}V${f(cy - ry)}`} stroke={CORD} strokeWidth={1.5} opacity={0.8} />
            <ellipse cx={x} cy={cy} rx={rx} ry={ry} fill={fill} />
            {/* the far side in shade: the body again, narrower and shifted, in the rib colour */}
            <path
              d={`M${f(x + 4)} ${f(cy - ry + 0.5)}A${rx} ${ry} 0 0 1 ${f(x + 4)} ${f(cy + ry - 0.5)}A${rx - 6} ${ry} 0 0 0 ${f(x + 4)} ${f(cy - ry + 0.5)}Z`}
              fill={rib}
              opacity={0.45}
            />
            <path d={ribs} fill="none" stroke={rib} strokeWidth={1.6} strokeLinecap="round" opacity={0.75} />
            <path
              d={`M${f(x - 7)} ${f(cy - ry - 3)}h14v5h-14Z M${f(x - 7)} ${f(cy + ry - 2)}h14v5h-14Z M${f(x - 1.2)} ${f(cy + ry + 3)}h2.4v6h-2.4Z`}
              fill={CAP}
            />
            <path d={ellipsePath(x - 8, cy - 4, 3.5, 5)} fill="#ffffff" opacity={0.45} />
          </g>
        );
      })}
    </g>
  );
}

/* ---------- Disco Ball ---------- */

/** Pastel glints from the shared families, so the reflections match the rest of the shop. */
const GLINTS = (['berry', 'sky', 'honey', 'mint', 'lavender'] as const).map((k) =>
  mix(COLOR_FAMILIES[k].base, COLOR_FAMILIES[k].accent, 0.55),
);

/** Where the ceiling piece hangs: over the right wall, clear of the ticket below it in service. */
const HANG_X = R.x + 220;

/**
 * Disco Ball: a mirrored ball over the right wall, with glints of coloured light scattered over
 * both walls (kept off the wall behind the monster's head). Two sets of bright facets cross-fade
 * so the ball seems to turn, and the glints twinkle in five slow groups.
 */
function DiscoBall() {
  const cx = HANG_X;
  const cy = PIN_Y + 28;
  const r = 28;
  const id = 'lt-disco';
  const SILVER = '#d3d8e6';
  const SHADE = '#aab1c6';
  const GRID = '#959db5';
  // Meridians (narrower ellipses) and parallels (straight across), clipped to the ball.
  const grid =
    [0.38, 0.78].map((k) => ellipsePath(cx, cy, r * k, r)).join('') +
    [-0.62, -0.22, 0.2, 0.6].map((k) => `M${cx - r} ${f(cy + k * r)}H${cx + r}`).join('');
  const facet = (dx: number, dy: number) => `M${f(cx + dx)} ${f(cy + dy)}h7v7h-7Z`;
  const facetsA = [facet(-17, -14), facet(1, -3), facet(-8, 8), facet(12, -15), facet(14, 9)].join('');
  const facetsB = [facet(-8, -15), facet(10, 6), facet(-19, 0), facet(2, 15), facet(3, -16)].join('');
  // Glints: [x, y, size], left wall then right, none over x 470–810 (ART_GUIDE §2.1).
  const spots: readonly [number, number, number][] = [
    [-150, 200, 8],
    [-60, 150, 7],
    [20, 236, 9],
    [110, 180, 7],
    [200, 246, 8],
    [262, 160, 8],
    [330, 232, 7],
    [420, 190, 9],
    [452, 248, 6],
    [840, 238, 8],
    [880, 176, 7],
    [930, 222, 9],
    [1080, 188, 8],
    [1120, 248, 7],
    [1190, 172, 7],
    [1250, 236, 9],
    [1330, 196, 8],
    [1410, 156, 7],
  ];
  return (
    <g>
      {GLINTS.map((c, i) => (
        <path
          key={c}
          className="decor-twinkle"
          style={{ animationDelay: `${-i * 0.8}s` }}
          d={spots
            .filter((_, k) => k % GLINTS.length === i)
            .map(([x, y, s]) => sparklePath(x, y, s * 1.5))
            .join('')}
          fill={c}
          opacity={0.9}
        />
      ))}
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <path d={`M${cx} ${PIN_Y - 4}V${cy - r}`} stroke={GRID} strokeWidth={2.5} strokeLinecap="round" />
      <rect x={cx - 5} y={cy - r - 4} width={10} height={6} rx={2} fill={GRID} />
      <circle cx={cx} cy={cy} r={r} fill={SHADE} />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx - 4} cy={cy - 4} r={r - 2} fill={SILVER} />
        <path d={grid} fill="none" stroke={GRID} strokeWidth={1.4} />
        <path className="decor-twinkle" d={facetsA} fill="#ffffff" opacity={0.9} />
        <path className="decor-twinkle" style={{ animationDelay: '-2s' }} d={facetsB} fill="#ffffff" opacity={0.9} />
      </g>
      <path d={ellipsePath(cx - 11, cy - 13, 6, 4.5)} fill="#ffffff" opacity={0.6} />
    </g>
  );
}

/* ---------- Star Chandelier ---------- */

/** Star gold: bolder than the Starry Night stars so they read on a pale wall, with a thin gold edge. */
const STAR = '#ffd65a';
const STAR_EDGE = '#dba12a';
const FLAME = '#ffb43a';
const GLOW = '#fff3cc';

/**
 * Star Chandelier: a gold ring on curved arms with five candles, over the right wall (where the
 * Disco Ball hangs), gold stars dangling under the ring, and matching stars on threads across the
 * left wall so the room is balanced. Experiment (ART_GUIDE §4): a soft warm glow behind the
 * chandelier, a light that seems to light the wall. Candle glows breathe slowly; stars twinkle.
 */
function StarChandelier() {
  const cx = HANG_X;
  const ringY = PIN_Y + 36;
  const hubY = ringY + 14;
  const rx = 66;
  const ry = 10;
  const candles = [-56, -28, 0, 28, 56].map((dx) => {
    // On the ring's ellipse: middle candles sit on its far side, a little higher.
    const y = ringY - ry * Math.sqrt(Math.max(0, 1 - (dx / rx) ** 2)) * 0.5;
    return [cx + dx, y] as const;
  });
  const candleBodies = candles.map(([x, y]) => `M${f(x - 4)} ${f(y - 14)}h8v14h-8Z`).join('');
  const cups = candles.map(([x, y]) => ellipsePath(x, y, 7, 3)).join('');
  const flames = candles
    .map(([x, y]) => `M${f(x)} ${f(y - 27)}Q${f(x + 5.5)} ${f(y - 18)} ${f(x)} ${f(y - 15)}Q${f(x - 5.5)} ${f(y - 18)} ${f(x)} ${f(y - 27)}Z`)
    .join('');
  const glows = (odd: number) =>
    candles
      .filter((_, i) => i % 2 === odd)
      .map(([x, y]) => ellipsePath(x, y - 21, 11))
      .join('');
  // Arms curve from the hub up to the ring under each outer candle.
  const arms = [-56, -28, 28, 56].map((dx) => `M${cx} ${hubY}Q${cx + dx * 0.7} ${hubY + 2} ${cx + dx} ${f(ringY + 6)}`).join('');
  // Stars under the ring: [dx, thread length, size].
  const hung: readonly [number, number, number][] = [
    [-44, 4, 9],
    [-18, 12, 10],
    [18, 8, 10],
    [44, 2, 9],
  ];
  const below = (dx: number) => ringY + ry * Math.sqrt(1 - (dx / rx) ** 2);
  const threads = hung.map(([dx, len]) => `M${cx + dx} ${f(below(dx))}v${len}`).join('');
  const star = ([dx, len, s]: readonly [number, number, number]) => starPath(cx + dx, below(dx) + len + s, s);
  // Left wall: stars on threads from the bar, at different drops.
  const strands: readonly [number, number, number][] = [
    [-180, 28, 11],
    [-90, 14, 10],
    [10, 36, 11],
    [110, 22, 10],
    [196, 8, 9],
    [300, 30, 10],
    [400, 14, 11],
    [470, 32, 9],
  ];
  const strandStar = ([x, len, s]: readonly [number, number, number]) => starPath(x, PIN_Y + len + s, s);
  const starPaint = { fill: STAR, stroke: STAR_EDGE, strokeWidth: 1.6, strokeLinejoin: 'round' as const };
  return (
    <g>
      <path d={ellipsePath(cx, ringY - 2, 100, 46)} fill={GLOW} opacity={0.4} />
      {/* left wall strands */}
      <path
        d={strands.map(([x, len]) => `M${x} ${PIN_Y - 4}V${PIN_Y + len}`).join('')}
        stroke={GOLD_DARK}
        strokeWidth={1.5}
        opacity={0.7}
      />
      <path d={strands.filter((_, i) => i % 3).map(strandStar).join('')} {...starPaint} />
      <path className="decor-twinkle" d={strands.filter((_, i) => i % 3 === 0).map(strandStar).join('')} {...starPaint} />
      {/* chain and canopy */}
      <rect x={cx - 14} y={PIN_Y - 4} width={28} height={7} rx={3} fill={GOLD_DARK} />
      <path d={`M${cx} ${PIN_Y}V${hubY}`} stroke={GOLD_DARK} strokeWidth={3} strokeLinecap="round" />
      {/* the ring: its far half behind the candles, its near half in front */}
      <path d={`M${cx - rx} ${ringY}A${rx} ${ry} 0 0 1 ${cx + rx} ${ringY}`} fill="none" stroke={GOLD_DARK} strokeWidth={4} />
      {[0, 1].map((odd) => (
        <path
          key={odd}
          className="decor-glow"
          style={{ animationDelay: `${-odd * 1.8}s` }}
          d={glows(odd)}
          fill={GLOW}
          opacity={0.9}
        />
      ))}
      <path d={candleBodies} fill={CREAM} />
      <path d={flames} fill={FLAME} />
      <path d={cups} fill={GOLD} />
      <path d={arms} fill="none" stroke={GOLD} strokeWidth={3.5} strokeLinecap="round" />
      <path d={`M${cx - rx} ${ringY}A${rx} ${ry} 0 0 0 ${cx + rx} ${ringY}`} fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
      <circle cx={cx} cy={hubY} r={7} fill={GOLD} />
      <path d={ellipsePath(cx - 2.5, hubY - 2.5, 2.2)} fill="#ffffff" opacity={0.6} />
      <path d={threads} stroke={GOLD_DARK} strokeWidth={1.5} opacity={0.8} />
      <path d={[hung[1]!, hung[2]!].map(star).join('')} {...starPaint} />
      <path className="decor-twinkle" style={{ animationDelay: '-2s' }} d={[hung[0]!, hung[3]!].map(star).join('')} {...starPaint} />
    </g>
  );
}

const ART: Record<string, (look: DecorLook) => ReactElement> = {
  'string-lights': StringLights,
  'paper-lanterns': PaperLanterns,
  'disco-ball': DiscoBall,
  'star-chandelier': StarChandelier,
};

/** The equipped lights, or their labelled stand-in if they have no art yet (ART_GUIDE §2.7). */
export function Lights({ look }: { look: DecorLook }) {
  const Art = ART[look.item];
  if (!Art) return <LightsStandIn look={look} />;
  return (
    <g data-decor="lights" data-item={look.item}>
      <Art {...look} />
    </g>
  );
}
