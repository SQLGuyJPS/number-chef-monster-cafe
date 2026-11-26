// The daytime views across the road (M4b, D185): five places drawn as one set. The owner picked
// Little Shops as the free Street; Town Houses, Park, Hilltop Town and Seaside are sold as window
// items of their own, at T4 (D186). Drawn like the other views (Window.tsx): window coordinates (0..W, 0..H),
// clipped to the glass. Shared rules for all five: the awning hides the top ~14 px, so nothing
// important sits there; the window's middle bar (x 104–110) falls in a gap, never through a
// building or a face; every thing stands on what holds it up; colours come from the shared
// families where a thing is painted (houses, huts, awnings), so the street matches the shop's
// paints. During play the caption bubble covers the right two-thirds of the window, so each
// view's signature thing (and any motion) is on the left.
import type { ReactElement } from 'react';
import { DECOR } from '../../app/metrics';
import { COLOR_FAMILIES, type ColorFamily } from '../../engine/economy';
import { CREAM, ellipsePath, GOLD, INK, mix } from './paint';

const { w: W, h: H } = DECOR.window;
const f = (n: number) => n.toFixed(1);

const SUN = '#fff3a6';
const CLOUD = '#ffffff';
const CLOUD_SHADE = '#e3effa';
const LEAF = '#9ccf7a';
const LEAF_LIGHT = '#b5dd96';
const TRUNK = '#9b6a44';
const WOOD = '#b98352';
const WOOD_DARK = '#8a5a35';
/** Lamp posts, railings, bench frames: a soft dark, never black (ART_GUIDE §3). */
const IRON = '#6f6a7e';
const STONE = '#ece2d0';
const KERB = '#d8cab2';
const ROAD = '#c9c3cb';
/** Window glass across the road: a deeper sky, so panes read against pale walls. */
const GLASS = '#a9cdea';
/** A shop's lit inside, warm, so the goods in its window read. */
const SHOP_INSIDE = '#fbe8cc';

const base = (k: ColorFamily) => COLOR_FAMILIES[k].base;
/** A family's tone `t` of the way from its pale base to its accent. */
const tone = (k: ColorFamily, t: number) => mix(COLOR_FAMILIES[k].base, COLOR_FAMILIES[k].accent, t);

// Path builders. Every shape winds counter-clockwise on screen, the same way round as ellipsePath,
// so shapes of one colour that overlap in one path (a cloud's puffs over its base, a cat's ears on
// its head) fill as one. A shape wound the other way cuts a hole where it overlaps (nonzero rule).
const box = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}v${f(h)}h${f(w)}v${f(-h)}Z`;
const tri = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) =>
  `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}L${f(x3)} ${f(y3)}Z`;
/** An arched door or window standing on its bottom edge. */
const arch = (x: number, y: number, w: number, h: number) =>
  `M${f(x + w)} ${f(y + h)}V${f(y + w / 2)}a${f(w / 2)} ${f(w / 2)} 0 0 0 ${f(-w)} 0V${f(y + h)}Z`;
/** A puffy cloud resting on a flat base at y, about 33·s wide: three puffs over a base. */
const puff = (x: number, y: number, s = 1) =>
  ellipsePath(x - 10 * s, y - 6 * s, 6 * s) +
  ellipsePath(x + s, y - 10 * s, 9 * s) +
  ellipsePath(x + 11 * s, y - 5.5 * s, 5.5 * s) +
  box(x - 10 * s, y - 6 * s, 21 * s, 6 * s);

function Sun({ x, y }: { x: number; y: number }) {
  return (
    <>
      <path d={ellipsePath(x, y, 16)} fill="#fffdf0" opacity={0.5} />
      <circle cx={x} cy={y} r={11} fill={SUN} />
    </>
  );
}

/** Clouds with a soft shaded underside: the same shapes twice, the white lifted 2 px. */
function Clouds({ at }: { at: readonly (readonly [number, number, number])[] }) {
  const d = (dy: number) => at.map(([x, y, s]) => puff(x, y + dy, s)).join('');
  return (
    <>
      <path d={d(0)} fill={CLOUD_SHADE} />
      <path d={d(-2)} fill={CLOUD} />
    </>
  );
}

/** The road outside the café: the far pavement and its kerb, the road, its dashed middle line. */
function Road({ top = 124 }: { top?: number }) {
  const dashes = Array.from({ length: 8 }, (_, i) => `M${6 + i * 28} ${top + 18}h14`).join('');
  return (
    <>
      <rect y={top} width={W} height={9} fill={STONE} />
      <rect y={top + 9} width={W} height={3} fill={KERB} />
      <rect y={top + 12} width={W} height={H - top - 12} fill={ROAD} />
      <path d={dashes} stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" opacity={0.9} />
    </>
  );
}

type Rect4 = readonly [x: number, y: number, w: number, h: number];

/**
 * Windows across the road: a cream frame and sill, the glass, a glint in the top corner (like the
 * café door's glass) and the glazing bars. `arched` tops them with a half circle.
 */
function Windows({ at, arched = false, glass = GLASS }: { at: readonly Rect4[]; arched?: boolean; glass?: string }) {
  const shape = arched ? arch : box;
  const frame = at.map(([x, y, w, h]) => shape(x - 1.5, y - 1.5, w + 3, h + 3) + box(x - 3, y + h + 1, w + 6, 2.5));
  const pane = at.map(([x, y, w, h]) => shape(x, y, w, h));
  // The glint sits wholly inside the top-left pane: 1 px clear of the frame (under an arch, of the
  // curve where the glint starts) and of the glazing bar below it.
  const glint = at.map(([x, y, w, h]) => {
    const r = w / 2;
    const top = arched ? y + r - Math.sqrt(r * r - (r - 1.5) ** 2) + 1 : y + 1.5;
    const bottom = Math.min(top + h * 0.4, y + h * 0.55 - 1.8);
    return `M${f(x + 1.5)} ${f(top)}h${f(w * 0.32)}L${f(x + 1.5)} ${f(bottom)}Z`;
  });
  const bars = at.map(([x, y, w, h]) => `M${f(x + w / 2)} ${f(y)}V${f(y + h)}M${f(x)} ${f(y + h * 0.55)}H${f(x + w)}`);
  return (
    <>
      <path d={frame.join('')} fill={CREAM} />
      <path d={pane.join('')} fill={glass} />
      <path d={glint.join('')} fill="#fff" opacity={0.5} />
      <path d={bars.join('')} stroke={CREAM} strokeWidth={1.6} />
    </>
  );
}

/** A street lamp standing on the pavement at (x, foot): a foot, a post, a little lantern. */
function Lamp({ x, foot, top }: { x: number; foot: number; top: number }) {
  return (
    <>
      <path
        d={box(x - 1.2, top + 10, 2.4, foot - top - 10) + box(x - 3.5, foot - 3, 7, 3) + tri(x + 6, top + 3, x, top - 3, x - 6, top + 3)}
        fill={IRON}
      />
      <path d={box(x - 4, top + 3, 8, 7)} fill={SUN} stroke={IRON} strokeWidth={1.4} strokeLinejoin="round" />
    </>
  );
}

/** A small round bird sitting at (x, y) (its feet), facing right. */
function Bird({ x, y, colour = '#8f9bbd' }: { x: number; y: number; colour?: string }) {
  return (
    <>
      <path
        d={ellipsePath(x, y - 3.5, 4.6, 3.6) + ellipsePath(x + 3.6, y - 7, 2.8) + tri(x - 4, y - 4.5, x - 8.5, y - 6.5, x - 4.4, y - 2)}
        fill={colour}
      />
      <path d={tri(x + 6, y - 7.8, x + 8.6, y - 6.8, x + 6, y - 5.8)} fill={GOLD} />
      <circle cx={x + 4.4} cy={y - 7.6} r={0.9} fill={INK} />
    </>
  );
}

/** A cat sitting on the ground at (x, y), seen from the front, its tail curled round to the right. */
function Cat({ x, y, colour }: { x: number; y: number; colour: string }) {
  return (
    <>
      <path d={`M${f(x + 5)} ${f(y - 1)}q7 0 6 -7q-1 -4 -4 -3`} stroke={colour} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path
        d={
          `M${f(x + 6)} ${f(y)}q1 -9 -4 -12h-4q-5 3 -4 12Z` +
          ellipsePath(x, y - 15, 5, 4.6) +
          tri(x - 0.8, y - 19, x - 4.6, y - 23, x - 5, y - 16) +
          tri(x + 5, y - 16, x + 4.6, y - 23, x + 0.8, y - 19)
        }
        fill={colour}
      />
      <path d={ellipsePath(x - 2, y - 15.5, 0.9) + ellipsePath(x + 2, y - 15.5, 0.9)} fill={INK} />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// A. Town Houses: a terrace of four gabled houses in four families, chimneys, flower boxes, a
// street lamp, a ginger cat on the pavement and a bird on a ridge. All still.

/** A gabled house front: its walls from x to x + w, its roof's top line at `peak` over the middle
 * and at `eave` over each wall. */
interface House {
  x: number;
  w: number;
  eave: number;
  peak: number;
  k: ColorFamily;
}
const GROUND = 124;
const TOWN: readonly House[] = [
  { x: -2, w: 54, eave: 70, peak: 46, k: 'berry' },
  { x: 52, w: 55, eave: 74, peak: 52, k: 'honey' },
  { x: 107, w: 53, eave: 66, peak: 42, k: 'mint' },
  { x: 160, w: 54, eave: 72, peak: 48, k: 'lavender' },
];

/** How far a house's roof line drops for each px out from the ridge. */
const pitch = (h: House) => (h.eave - h.peak) / (h.w / 2);

/** The wall with its gable, its top following the roof line lowered by `d` (the roof's depth). */
function gable(h: House, d: number, ground = GROUND): string {
  return `M${f(h.x)} ${f(ground)}V${f(h.eave + d)}L${f(h.x + h.w / 2)} ${f(h.peak + d)}L${f(h.x + h.w)} ${f(h.eave + d)}V${f(ground)}Z`;
}

/**
 * The roof: a band `d` deep along both slopes. An end with no house in front of it runs on down
 * past the wall by `o` and is cut square, as eaves are. In a terrace, where the neighbour on that
 * side stands in front, the roof runs on down until it meets the neighbour's roof and stops there,
 * along that roof's top edge, so the two touch without overlapping (owner, 2026-11-26).
 */
function roof(h: House, d: number, o: number, front: { left?: House; right?: House } = {}): string {
  const cx = h.x + h.w / 2;
  const k = pitch(h);
  /** Where our slope, `dd` below the top line, meets the facing slope of the neighbour n. */
  const meet = (n: House, dd: number, side: -1 | 1) => {
    const kn = pitch(n);
    const cn = n.x + n.w / 2;
    const x =
      side < 0
        ? (h.peak + dd + k * cx - n.peak + kn * cn) / (k + kn)
        : (n.peak + kn * cn - h.peak - dd + k * cx) / (k + kn);
    return [x, h.peak + dd + k * Math.abs(x - cx)] as const;
  };
  const end = (side: -1 | 1, dd: number) => {
    const n = side < 0 ? front.left : front.right;
    if (n) return meet(n, dd, side);
    return [side < 0 ? h.x - o : h.x + h.w + o, h.eave + k * o + dd] as const;
  };
  const pt = ([x, y]: readonly [number, number]) => `${f(x)} ${f(y)}`;
  return `M${pt(end(-1, 0))}L${f(cx)} ${f(h.peak)}L${pt(end(1, 0))}L${pt(end(1, d))}L${f(cx)} ${f(h.peak + d)}L${pt(end(-1, d))}Z`;
}

function TownHousesView() {
  const [berry, honey, mint, lavender] = TOWN as [House, House, House, House];
  const terrace: readonly { h: House; front?: { left?: House; right?: House } }[] = [
    { h: berry, front: { right: honey } },
    { h: mint, front: { left: honey, right: lavender } },
    { h: honey },
    { h: lavender },
  ];
  const up: Rect4[] = [];
  const down: Rect4[] = [];
  const doors: [number, ColorFamily][] = [];
  // Doors pair up at the party walls, as terraces do: right, left, right, left.
  TOWN.forEach((h, i) => {
    const cx = h.x + h.w / 2;
    const off = i === 0 ? 12 : 13;
    up.push([cx - off - 6, 80, 12, 13], [cx + off - 6, 80, 12, 13]);
    const doorX = i % 2 === 0 ? cx + off : cx - off;
    const winX = i % 2 === 0 ? cx - off : cx + off;
    down.push([winX - 7, 104, 14, 13]);
    doors.push([doorX, h.k]);
  });
  const boxes = [up[0]!, up[1]!, up[4]!, up[5]!];
  const blooms = (k: number) =>
    boxes
      .flatMap(([x, , w], j) => [0, 1, 2].filter((n) => (n + j) % 2 === k).map((n) => ellipsePath(x + 1.5 + n * ((w - 3) / 2), 95.5, 2.2)))
      .join('');
  return (
    <>
      <Sun x={52} y={30} />
      <Clouds at={[[172, 37, 0.95]]} />
      {/* chimneys first, so the roofs they come up through overlap their feet */}
      <path d={box(36, 48, 7, 16) + box(170, 50, 7, 14)} fill={tone('cocoa', 0.35)} />
      <path d={box(35, 46, 9, 3) + box(169, 48, 9, 3)} fill={tone('cocoa', 0.6)} />
      {/* Honey and Lavender stand in front: their eaves overhang their walls. Berry and Mint are
          drawn first, their roofs running down to meet their neighbours' roofs. */}
      {terrace.map(({ h, front }) => (
        <g key={h.k}>
          <path d={roof(h, 5, 3, front)} fill={tone(h.k, 0.62)} />
          <path d={gable(h, 5)} fill={tone(h.k, 0.22)} />
          <path d={gable(h, 8)} fill={base(h.k)} />
        </g>
      ))}
      <Windows at={[...up, ...down]} />
      {/* flower boxes under the berry and mint houses' upstairs windows */}
      <path d={boxes.map(([x, y, w, h]) => box(x - 1, y + h + 3.5, w + 2, 4)).join('')} fill={WOOD} />
      <path d={blooms(0)} fill={tone('berry', 0.6)} />
      <path d={blooms(1)} fill={tone('honey', 0.55)} />
      {doors.map(([x, k]) => (
        <path key={k} d={arch(x - 7, 102, 14, 22)} fill={tone(k, 0.7)} />
      ))}
      <path d={doors.map(([x]) => ellipsePath(x + 3.6, 114, 1.3)).join('')} fill={GOLD} />
      <path d={doors.map(([x]) => box(x - 9, 122, 18, 2.5)).join('')} fill={KERB} />
      <Bird x={133.5} y={44} />
      <Road />
      <Lamp x={160.5} foot={131} top={80} />
      <Cat x={121} y={131} colour="#e6a35c" />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// B. Little Shops, the free Street: a bakery (bread and a cake in the window, a Berry awning)
// beside a flower shop (a Mint awning, buckets of flowers outside, a cat upstairs at the window).
// All still.

/** A striped shop awning from x0 to x1 below a rail at y, scalloped like the café's own. */
function Awning({ x0, x1, y, k, n = 6 }: { x0: number; x1: number; y: number; k: ColorFamily; n?: number }) {
  const sw = (x1 - x0) / n;
  const stripe = (i: number) => `M${f(x0 + i * sw)} ${f(y + 3)}h${f(sw)}v10a${f(sw / 2)} 5 0 0 1 ${f(-sw)} 0Z`;
  const idx = Array.from({ length: n }, (_, i) => i);
  return (
    <>
      <path d={idx.filter((i) => i % 2 === 0).map(stripe).join('')} fill={tone(k, 0.6)} />
      <path d={idx.filter((i) => i % 2 === 1).map(stripe).join('')} fill={CREAM} />
      <path d={box(x0 - 1, y, x1 - x0 + 2, 3.5)} fill={tone(k, 0.8)} />
    </>
  );
}

function LittleShopsView() {
  const bakery = mix(base('berry'), CREAM, 0.35);
  // The flower shop ends short of the window's edge, so its right-hand eave shows overhanging its
  // wall; the next building along fills the gap below.
  const florist: House = { x: 107, w: 93, eave: 51, peak: 33, k: 'mint' };
  const stems = [124, 140, 156].map((x) => `M${x - 3} 121l-1 -8M${x} 121v-10M${x + 3} 121l1 -8`).join('');
  const bunch = (dx: readonly number[], dy = 0) =>
    [124, 140, 156].map((x, i) => ellipsePath(x + dx[i]!, 110 + dy + (i % 2), 2.6)).join('');
  return (
    <>
      <Sun x={194} y={27} />
      <Clouds at={[[46, 37, 0.8]]} />
      {/* the bakery: a flat top with a cornice, three arched windows upstairs */}
      <path d={box(-4, 42, 111, 82)} fill={bakery} />
      <path d={box(-4, 42, 111, 6)} fill={tone('berry', 0.35)} />
      <path d={box(-6, 48, 115, 3)} fill={CREAM} />
      <Windows at={[[15, 57, 14, 17], [47, 57, 14, 17], [79, 57, 14, 17]]} arched />
      <Awning x0={2} x1={102} y={80} k="berry" />
      {/* its shop window: loaves and a cake on a shelf, cookies below. The shelf sits low enough
          that the cake's cherry clears the top of the window. */}
      <path d={box(7, 99, 58, 23)} fill={CREAM} />
      <path d={box(9, 101, 54, 19)} fill={SHOP_INSIDE} />
      <path d={box(9, 113, 54, 1.8)} fill={WOOD} />
      <path d={`M13 113a5.5 5 0 0 1 11 0ZM26 113a5.5 5 0 0 1 11 0Z`} fill="#dca266" />
      <path d={box(44, 108, 14, 5)} fill={tone('berry', 0.3)} />
      <path d={box(47, 104.5, 8, 3.5)} fill={CREAM} />
      <circle cx={51} cy={103.2} r={1.5} fill={tone('berry', 0.85)} />
      <path d={[16, 26, 36, 46, 56].map((x) => ellipsePath(x, 117.4, 2.6, 2)).join('')} fill="#c98f58" />
      <path d={tri(19, 102, 11, 102, 11, 107.5)} fill="#fff" opacity={0.5} />
      <path d={box(74, 98, 17, 26)} fill={tone('berry', 0.7)} />
      <path d={arch(77, 101, 11, 11)} fill={GLASS} />
      {/* the next building along, beyond the flower shop */}
      <path d={box(200, 70, 16, 54)} fill={base('lavender')} />
      <path d={box(200, 70, 16, 4)} fill={tone('lavender', 0.45)} />
      {/* the flower shop: a gable, shuttered windows, a round attic window */}
      <path d={roof(florist, 6, 3)} fill={tone('mint', 0.6)} />
      <path d={gable(florist, 6)} fill="#f1e6d2" />
      <path d={gable(florist, 9)} fill="#fdf4e3" />
      <path d={box(117, 60, 5, 17) + box(140, 60, 5, 17) + box(163, 60, 5, 17) + box(186, 60, 5, 17)} fill={tone('mint', 0.55)} />
      <Windows at={[[123, 60, 16, 17], [169, 60, 16, 17]]} />
      <path d={ellipsePath(153.5, 47.5, 4.5)} fill={CREAM} />
      <path d={ellipsePath(153.5, 47.5, 3)} fill={GLASS} />
      {/* the cat upstairs, sitting on the inside sill and looking out */}
      <path
        d={`M135.5 76.5q0 -6 -4.5 -6.5q-4.5 0.5 -4.5 6.5Z` + ellipsePath(131, 68.5, 3.2, 3) + tri(130.6, 66, 128.3, 63.5, 128, 68) + tri(134, 68, 133.7, 63.5, 131.4, 66)}
        fill="#8a7d92"
      />
      <Awning x0={110} x1={196} y={80} k="mint" />
      {/* its shop window is plain glass: the flower buckets on the pavement fill it from below */}
      <path d={box(115, 99, 56, 23)} fill={CREAM} />
      <path d={box(117, 101, 52, 19)} fill={GLASS} />
      <path d={tri(127, 102, 119, 102, 119, 107.5)} fill="#fff" opacity={0.5} />
      <path d={box(177, 98, 16, 26)} fill={tone('mint', 0.7)} />
      <path d={arch(180, 101, 10, 11)} fill={GLASS} />
      <path d={ellipsePath(88, 116, 1.3) + ellipsePath(190, 116, 1.3)} fill={GOLD} />
      <Road />
      {/* buckets of flowers on the pavement in front of the flower shop's window */}
      <path d={stems} stroke="#7fb85f" strokeWidth={1.6} strokeLinecap="round" />
      <path d={bunch([-3, 3, -3])} fill={tone('berry', 0.55)} />
      <path d={bunch([3, -3, 3])} fill={tone('honey', 0.55)} />
      <path d={bunch([0, 0, 0], -4)} fill={tone('lavender', 0.5)} />
      <path d={[124, 140, 156].map((x) => `M${x - 6} 121h12l-1.5 9h-9Z`).join('')} fill="#a9b6cc" />
      <path d={[124, 140, 156].map((x) => box(x - 6, 121, 12, 2)).join('')} fill="#93a1ba" />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// C. Park: a little park across the road: the town's rooftops beyond, two round trees, a bench
// with three balloons tied to it, a fountain, a hedge along the pavement, a lamp with a bird on it.
// The balloons sway gently on their strings: a top-tier piece's one slight motion (D187).

/** A round tree: a trunk down to `foot`, a crown of three puffs, one highlight. */
function Tree({ x, y, r, foot }: { x: number; y: number; r: number; foot: number }) {
  return (
    <>
      <path d={box(x - r * 0.16, y, r * 0.32, foot - y)} fill={TRUNK} />
      <path d={ellipsePath(x, y - r * 0.15, r) + ellipsePath(x - r * 0.7, y + r * 0.45, r * 0.65) + ellipsePath(x + r * 0.7, y + r * 0.45, r * 0.65)} fill={LEAF} />
      <path d={ellipsePath(x - r * 0.32, y - r * 0.5, r * 0.38)} fill={LEAF_LIGHT} />
    </>
  );
}

function ParkView() {
  const far = mix(base('lavender'), '#cfeaff', 0.35);
  const skyline =
    box(-2, 76, 22, 30) +
    `M20 106V70l10 -9l10 9V106Z` +
    box(40, 78, 22, 28) +
    box(62, 66, 18, 40) +
    box(80, 74, 30, 32) +
    box(110, 70, 14, 36) +
    `M124 106V62a7 7 0 0 1 14 0V106Z` +
    box(138, 74, 26, 32) +
    `M164 106V68l11 -10l11 10V106Z` +
    box(186, 78, 30, 28);
  const balloons: readonly [number, number, number, ColorFamily][] = [
    [71, 58, 7.5, 'berry'],
    [84, 50, 8, 'sky'],
    [95, 62, 7, 'honey'],
  ];
  const stone = '#e8e0d2';
  const stoneShade = '#d6ccbb';
  const water = '#e2f3ff';
  return (
    <>
      <Sun x={166} y={28} />
      <Clouds at={[[60, 38, 0.85]]} />
      <path d={skyline} fill={far} />
      <path d={`M0 98Q60 92 107 96T214 94V124H0Z`} fill="#c8e3a8" />
      <Tree x={32} y={66} r={19} foot={106} />
      <Tree x={192} y={72} r={15} foot={106} />
      {/* fountain: a basin on the lawn, a column, a top bowl, water falling from both */}
      <path d={`M131 101h44l-4 11h-36Z` + `M141 84h24l-4 5h-16Z` + box(150, 89, 6, 12)} fill={stoneShade} />
      <path d={box(129, 98.5, 48, 3.5) + box(139.5, 81.5, 27, 3)} fill={stone} />
      <path d={`M153 81.5V72M153 72.5q-9 -3 -13 9M153 72.5q9 -3 13 9M141 85q-5 5 -6 13.5M165 85q5 5 6 13.5`} stroke={water} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <path d={box(131, 99.2, 44, 1.6) + box(141.5, 82.2, 23, 1.4)} fill="#cfe9fb" />
      {/* bench: iron sides, two back slats and a seat */}
      <path d={`M52 87V109M80 87V109`} stroke={IRON} strokeWidth={2.4} strokeLinecap="round" />
      <path d={box(49, 87, 34, 3.2) + box(49, 92.5, 34, 3.2) + box(48, 99, 36, 3.5)} fill={WOOD} />
      <g className="decor-sway" style={{ transformOrigin: '80px 88px' }}>
        <path d={balloons.map(([x, y, r]) => `M80 88Q${f((x + 80) / 2 + 2)} ${f((y + r + 88) / 2)} ${f(x)} ${f(y + r + 1.5)}`).join('')} stroke={IRON} strokeWidth={0.9} fill="none" opacity={0.8} />
        {balloons.map(([x, y, r, k]) => (
          <path key={k} d={ellipsePath(x, y, r * 0.88, r) + tri(x + 1.6, y + r + 1.8, x, y + r - 0.6, x - 1.6, y + r + 1.8)} fill={tone(k, 0.55)} />
        ))}
        <path
          d={balloons.map(([x, y, r]) => `M${f(x - r * 0.55)} ${f(y - r * 0.15)}q${f(r * 0.05)} ${f(-r * 0.5)} ${f(r * 0.45)} ${f(-r * 0.6)}`).join('')}
          stroke="#fff"
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.55}
          fill="none"
        />
      </g>
      <path d={`M0 124V116${'q5 -7 10 0'.repeat(22)}V124Z`} fill="#9fcd84" />
      <Lamp x={119} foot={124} top={78} />
      <Bird x={119} y={75} />
      <Road />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// D. Hilltop Town: hills rising behind the road, a windmill on the top with a path winding down
// from its door, a far cottage and two sheep, and nearer cottages and trees behind a stone wall.
// The windmill is on the left, which the caption bubble leaves uncovered during play.
// The windmill's sails turn slowly (one turn a minute): a top-tier piece's one slight motion (D187).

function HilltopView() {
  const wall = '#fbf3e4';
  const wallShade = '#ecdfc8';
  const far: readonly [number, number, number, ColorFamily][] = [[112, 70, 15, 'honey']];
  const sheep: readonly [number, number][] = [
    [138, 78],
    [153, 82],
  ];
  const hub = { x: 36, y: 33 };
  const blades = [0, 1, 2, 3].map((i) => {
    const a = (i * Math.PI) / 2 - Math.PI / 4;
    const u = [Math.cos(a), Math.sin(a)] as const;
    const p = [-u[1], u[0]] as const;
    const at = (r: number, sd: number) => `${f(hub.x + u[0] * r + p[0] * sd)} ${f(hub.y + u[1] * r + p[1] * sd)}`;
    return { spar: `M${at(0, 0)}L${at(18, 0)}`, sail: `M${at(4, 0.6)}L${at(18, 0.6)}L${at(18, 5.8)}L${at(4, 5.8)}Z` };
  });
  const nearA: House = { x: 30, w: 40, eave: 92, peak: 76, k: 'berry' };
  const nearB: House = { x: 158, w: 38, eave: 92, peak: 77, k: 'sky' };
  return (
    <>
      <Sun x={182} y={30} />
      <Clouds at={[[80, 36, 0.7], [128, 40, 0.8]]} />
      <path d={`M-2 60C10 54 24 52 38 52S80 58 110 66S180 84 216 88V150H-2Z`} fill="#d5ebbf" />
      {/* the path from the windmill's door, winding down the hill to the berry cottage's back */}
      <path d={`M36 57.5C56 60 98 60 92 68S66 78 60 90`} stroke="#f4ead0" strokeWidth={3} strokeLinecap="round" fill="none" />
      {/* the windmill: a tapered tower, shaded on its right, a cap, sails turning on a hub */}
      <path d={`M28 57L31.5 33H40.5L44 57Z`} fill={wall} />
      <path d={`M36 33H40.5L44 57H36Z`} fill={wallShade} />
      <path d={arch(33.5, 48, 5, 9)} fill={WOOD} />
      <path d={`M30.5 33.5a5.5 5.5 0 0 1 11 0Z`} fill={tone('berry', 0.6)} />
      <g className="decor-turn" style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}>
        <path d={blades.map((b) => b.spar).join('')} stroke={WOOD_DARK} strokeWidth={1.6} strokeLinecap="round" />
        <path d={blades.map((b) => b.sail).join('')} fill={CREAM} stroke={wallShade} strokeWidth={0.8} />
      </g>
      <circle cx={hub.x} cy={hub.y} r={2} fill={WOOD_DARK} />
      {/* a far cottage on the slope */}
      <path d={far.map(([x, y, w]) => box(x, y - 10, w, 12)).join('')} fill={wall} />
      {far.map(([x, y, w, k]) => (
        <path key={k} d={tri(x - 1.5, y - 9.5, x + w / 2, y - 18, x + w + 1.5, y - 9.5)} fill={tone(k, 0.62)} />
      ))}
      <path d={far.map(([x, y, w]) => box(x + w / 2 - 2.5, y - 6.5, 5, 5)).join('')} fill={GLASS} />
      {/* two sheep grazing */}
      <path d={sheep.map(([x, y]) => `M${x - 2.5} ${y + 2}v3.5M${x + 2.5} ${y + 2}v3.5`).join('')} stroke={IRON} strokeWidth={1.3} strokeLinecap="round" />
      <path d={sheep.map(([x, y]) => ellipsePath(x, y, 5.2, 3.6) + ellipsePath(x - 3, y - 1.8, 2.8) + ellipsePath(x + 1.5, y - 2.4, 3)).join('')} fill={CLOUD} />
      <path d={sheep.map(([x, y]) => ellipsePath(x + 5.6, y - 1.2, 2, 2.5)).join('')} fill={IRON} />
      <path d={`M-2 106C40 96 80 92 107 97S170 90 216 94V150H-2Z`} fill="#bcdd9e" />
      <Tree x={14} y={92} r={12} foot={114} />
      <Tree x={88} y={94} r={11} foot={114} />
      <Tree x={130} y={97} r={10} foot={114} />
      {[nearA, nearB].map((h) => (
        <g key={h.k}>
          <path d={roof(h, 4, 2.5)} fill={tone(h.k, 0.62)} />
          <path d={gable(h, 4, 114)} fill={wallShade} />
          <path d={gable(h, 6.5, 114)} fill={wall} />
        </g>
      ))}
      <Windows at={[[35, 98, 9, 9], [56, 98, 9, 9], [162, 98, 9, 9], [183, 98, 9, 9]]} />
      <path d={arch(46, 99, 8, 15)} fill={tone('berry', 0.7)} />
      <path d={arch(173, 99, 8, 15)} fill={tone('sky', 0.7)} />
      {/* a stone wall along the pavement */}
      <path d={box(-2, 112, W + 4, 12)} fill="#e6d9c3" />
      <path d={box(-2, 111, W + 4, 3)} fill="#efe6d6" />
      <path
        d={Array.from({ length: 12 }, (_, i) => `M${8 + i * 18} 114v4.5M${17 + i * 18} 118.5v5.5`).join('') + `M-2 118.5H${W + 2}`}
        stroke="#d3c3a8"
        strokeWidth={1.1}
      />
      <Road />
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// E. Seaside: across the road the beach: six striped huts in six families, a beach ball, the sea
// with a sailboat, a lighthouse on a green headland, two gulls. The sailboat rocks gently on
// the water: a top-tier piece's one slight motion (D187).

function SeasideView() {
  const huts: readonly [number, ColorFamily][] = [
    [10, 'berry'],
    [36, 'honey'],
    [62, 'mint'],
    [122, 'lavender'],
    [148, 'sky'],
    [174, 'sunny'],
  ];
  const lh = { x: 188, foot: 62, top: 36 };
  /** The lighthouse's outline at height y (it tapers from 14 wide at the foot to 9 at the top). */
  const half = (y: number) => 4.5 + (2.5 * (y - lh.top)) / (lh.foot - lh.top);
  const band = (y0: number, y1: number) =>
    `M${f(lh.x - half(y0))} ${y0}H${f(lh.x + half(y0))}L${f(lh.x + half(y1))} ${y1}H${f(lh.x - half(y1))}Z`;
  const waves = [
    [16, 74],
    [92, 72],
    [128, 80],
    [30, 94],
    [150, 92],
    [82, 88],
  ]
    .map(([x, y]) => `M${x} ${y}q3 -2.5 6 0q3 -2.5 6 0`)
    .join('');
  return (
    <>
      <Sun x={36} y={30} />
      <Clouds at={[[132, 38, 0.9]]} />
      <path d={`M80 34q3 -3 6 0q3 -3 6 0M90 44q2.5 -2.5 5 0q2.5 -2.5 5 0`} stroke="#8c90a8" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <rect y={66} width={W} height={36} fill="#a5d3ec" />
      <rect y={84} width={W} height={18} fill="#94c8e6" />
      <path d={waves} stroke="#f2fbff" strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.85} />
      {/* the headland and its lighthouse: cream with two Berry bands, a gallery, a lit lantern */}
      <path d={`M150 68C160 58 176 54 192 54S212 58 218 60V69H150Z`} fill="#bcdd9e" />
      <path d={band(lh.top, lh.foot)} fill="#fbf3e6" />
      <path d={band(42, 48) + band(54, 60)} fill={tone('berry', 0.6)} />
      <path d={`M${lh.x} ${lh.top}H${f(lh.x + half(lh.top))}L${f(lh.x + half(lh.foot))} ${lh.foot}H${lh.x}Z`} fill="#000" opacity={0.06} />
      <path d={box(lh.x - 5, 29, 10, 7)} fill={SUN} />
      <path d={box(lh.x - 8, 34, 16, 3) + `M${lh.x - 0.7} 29v7`} fill={IRON} />
      <path d={`M${lh.x - 6} 29.5a6 5 0 0 1 12 0Z`} fill={tone('berry', 0.6)} />
      {/* the sailboat, rocking on the water */}
      <g className="decor-sway" style={{ transformOrigin: '58px 92px' }}>
        <path d={`M58 86V56`} stroke={WOOD_DARK} strokeWidth={1.6} strokeLinecap="round" />
        <path d={`M59.5 58V84H76Z`} fill={CREAM} />
        <path d={`M56.5 62V84H45Z`} fill="#f1e5d0" />
        <path d={tri(58, 55.5, 65, 58, 58, 60.5)} fill={tone('berry', 0.65)} />
        <path d={`M41 85.5h34l-6 7h-22Z`} fill={WOOD} />
        <path d={box(43.5, 87, 29, 1.8)} fill={CREAM} />
      </g>
      <path d={`M0 102Q60 96 107 99T216 98V124H0Z`} fill="#f5e3bd" />
      {/* beach huts: a cream hut with its family's stripes, roof and door */}
      <path d={huts.map(([x]) => box(x, 100, 20, 20)).join('')} fill={CREAM} />
      {huts.map(([x, k]) => (
        <g key={k}>
          <path d={box(x + 1, 100, 4, 20) + box(x + 15, 100, 4, 20)} fill={base(k)} />
          <path d={tri(x - 2, 101, x + 10, 90, x + 22, 101)} fill={tone(k, 0.62)} />
          <path d={arch(x + 6, 105, 8, 15)} fill={tone(k, 0.55)} />
        </g>
      ))}
      {/* a beach ball between the huts */}
      <circle cx={95} cy={117} r={5.5} fill={CREAM} />
      <path d={`M95 111.5a5.5 5.5 0 0 0 -5.2 7.3L95 117Z`} fill={tone('sky', 0.6)} />
      <path d={`M95 111.5a5.5 5.5 0 0 1 5.2 7.3L95 117Z`} fill={tone('berry', 0.6)} />
      <Road />
    </>
  );
}

/**
 * The views by catalog item id (economy.ts): Little Shops is the free Street (D185). The glass is
 * the café's sky blue.
 */
export const STREET_VIEWS: Readonly<Record<string, () => ReactElement>> = {
  street: LittleShopsView,
  'town-houses': TownHousesView,
  park: ParkView,
  'hilltop-town': HilltopView,
  seaside: SeasideView,
};
