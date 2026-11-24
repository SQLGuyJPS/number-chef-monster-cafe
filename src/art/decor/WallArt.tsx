// Wall-art slot art (M4b batch 3, ART_GUIDE §5): centred on the wall above the monster
// (DECOR.wallArt, 200×72), between the two runs of lights. A tall monster's head covers the lower
// edge, so every piece keeps its busy parts high and its colours soft (ART_GUIDE §2.1): the room's
// 0.92 opacity, nothing brighter than the monster, motion slow and small. Colorway items take only
// {base, accent} (§2.3); the Menu Board, Monster Portraits and Trophy Shelf have their own colours.
// Nothing here has words or numbers to read except the OPEN on the neon sign, which is the item.
import type { ReactElement } from 'react';
import { DECOR } from '../../app/metrics';
import { COLOR_FAMILIES } from '../../engine/economy';
import { DRAWINGS } from '../monsters/roster';
import { specFor } from '../monsters/specs';
import {
  CREAM,
  GOLD,
  GOLD_DARK,
  INK,
  SILVER,
  SILVER_SHADE,
  ellipsePath,
  mix,
  sparklePath,
  starPath,
} from './paint';
import { WallArtStandIn, type DecorLook } from './StandIn';
import './decor.css';

const WOOD = '#b98352';
const WOOD_DARK = '#8a5a35';
const { x: X, y: Y, w: W, h: H } = DECOR.wallArt;
const CX = X + W / 2;
const CY = Y + H / 2;
const f = (n: number) => n.toFixed(1);
const fam = COLOR_FAMILIES;

/* ---------- Menu Board ---------- */

/**
 * Menu Board: the café's chalkboard in a wooden frame, with three chalk pictures (a cupcake, a
 * pizza slice, a steaming cup), a wavy chalk "line" under each like handwriting no one has to
 * read, and a stick of chalk on the ledge. The slate is a soft green-grey, not black.
 */
function MenuBoard() {
  const top = Y + 4;
  const bottom = Y + H - 6;
  const left = X + 8;
  const right = X + W - 8;
  const cols = [CX - 58, CX, CX + 58];
  const pic = CY - 6;
  // Chalk handwriting: a short wave under each picture.
  const scribble = cols
    .map((c) => `M${c - 15} ${bottom - 12}q3 -4 6 0t6 0t6 0t6 0t6 0`)
    .join('');
  const [a, b, c] = cols as [number, number, number];
  // The cup with its handle is wider on the right, so its body sits a little left of the column.
  const k = c - 3.5;
  const chalkLines = [
    // cupcake wrapper and its pleats
    `M${a - 11} ${pic + 2}L${a - 7} ${pic + 14}H${a + 7}L${a + 11} ${pic + 2}Z`,
    `M${a - 3} ${pic + 4}v8M${a + 3} ${pic + 4}v8`,
    // cup handle and steam
    `M${k + 9} ${pic + 1}q8 0 8 5.5q0 5.5 -8 5.5`,
    `M${k - 4} ${pic - 6}q-3 -4 0 -7q3 -3 0 -6M${k + 3} ${pic - 6}q-3 -4 0 -7q3 -3 0 -6`,
  ].join('');
  return (
    <g opacity={0.92}>
      <rect x={left - 6} y={top - 3} width={right - left + 12} height={bottom - top + 9} rx={7} fill={WOOD_DARK} />
      <rect x={left - 6} y={top - 4} width={right - left + 12} height={bottom - top + 8} rx={7} fill={WOOD} />
      <rect x={left} y={top + 2} width={right - left} height={bottom - top - 4} rx={4} fill="#55695f" />
      {/* cupcake: pink frosting, a cherry */}
      <path
        d={`M${a - 12} ${pic + 2}C${a - 16} ${pic - 4} ${a - 12} ${pic - 9} ${a - 7} ${pic - 8}C${a - 6} ${pic - 15} ${a + 6} ${pic - 15} ${a + 7} ${pic - 8}C${a + 12} ${pic - 9} ${a + 16} ${pic - 4} ${a + 12} ${pic + 2}Z`}
        fill={fam.berry.base}
        opacity={0.9}
      />
      <path d={ellipsePath(a, pic - 15.5, 3.4)} fill="#f08aa8" />
      {/* pizza slice with its crust and pepperoni */}
      {/* the slice's top follows the crust's curve, so the crust sits on it */}
      <path d={`M${b - 15} ${pic - 9}Q${b} ${pic - 15} ${b + 15} ${pic - 9}L${b} ${pic + 16}Z`} fill={fam.honey.base} opacity={0.9} />
      <path
        d={`M${b - 15} ${pic - 9}Q${b} ${pic - 15} ${b + 15} ${pic - 9}`}
        fill="none"
        stroke={mix(fam.honey.base, fam.honey.accent, 0.5)}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path d={ellipsePath(b - 5, pic - 3, 3) + ellipsePath(b + 5, pic - 2, 3) + ellipsePath(b, pic + 6, 2.6)} fill="#f08aa8" />
      {/* cup */}
      <path d={`M${k - 10} ${pic - 2}h19v11q0 6 -6 6h-7q-6 0 -6 -6Z`} fill={fam.mint.base} opacity={0.9} />
      <path d={chalkLines} fill="none" stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      <path d={scribble} fill="none" stroke={CREAM} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      {/* a stick of chalk on the ledge */}
      <rect x={right - 30} y={bottom + 0.5} width={14} height={4} rx={2} fill={CREAM} />
    </g>
  );
}

/* ---------- Neon OPEN ---------- */

/**
 * Neon OPEN: the word in rounded neon tubes inside a tube border, on a clear plate held off the
 * wall at its corners. Each tube is a soft halo, the coloured glass, and a pale hot core; the
 * border is a lighter tone so the word leads. Only the halo breathes, slowly (no flicker).
 */
function NeonOpen({ base, accent }: DecorLook) {
  const y0 = CY - 15;
  const y1 = CY + 15;
  // O, P, E, N as single strokes (round caps and joins), 9 px apart, centred on the slot.
  const ox = CX - 43.5;
  const px = CX - 23.5;
  const ex = CX + 5.5;
  const nx = CX + 34.5;
  const word = [
    ellipsePath(ox, CY, 11, 15),
    `M${px} ${y1}V${y0}H${px + 11}A8 8 0 0 1 ${px + 11} ${y0 + 16}H${px}`,
    `M${ex + 19} ${y0}H${ex}V${y1}H${ex + 19}M${ex} ${CY}H${ex + 15}`,
    `M${nx} ${y1}V${y0}L${nx + 19} ${y1}V${y0}`,
  ].join('');
  const bx = X + 18;
  const by = Y + 9;
  const bw = W - 36;
  const bh = H - 18;
  const border = `M${bx + 12} ${by}H${bx + bw - 12}A12 12 0 0 1 ${bx + bw} ${by + 12}V${by + bh - 12}A12 12 0 0 1 ${bx + bw - 12} ${by + bh}H${bx + 12}A12 12 0 0 1 ${bx} ${by + bh - 12}V${by + 12}A12 12 0 0 1 ${bx + 12} ${by}Z`;
  const tube = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const studs = [
    [bx - 4, by - 4],
    [bx + bw + 4, by - 4],
    [bx - 4, by + bh + 4],
    [bx + bw + 4, by + bh + 4],
  ]
    .map(([sx, sy]) => ellipsePath(sx!, sy!, 2.6))
    .join('');
  return (
    <g opacity={0.92}>
      <rect x={bx - 9} y={by - 9} width={bw + 18} height={bh + 18} rx={16} fill={CREAM} opacity={0.3} />
      <path d={studs} fill="#cbbfa9" />
      <path className="decor-glow" d={border + word} {...tube} stroke={mix(base, accent, 0.35)} strokeWidth={11} opacity={0.4} />
      <path d={border} {...tube} stroke={mix(base, accent, 0.5)} strokeWidth={4.5} />
      <path d={word} {...tube} stroke={mix(accent, base, 0.12)} strokeWidth={5.5} />
      <path d={border + word} {...tube} stroke={mix(base, '#ffffff', 0.65)} strokeWidth={1.6} />
    </g>
  );
}

/* ---------- Giant Clock ---------- */

/**
 * Giant Clock: a round wall clock as tall as the slot, with a scalloped rim in the family colour
 * (soft and round, like a flower), a cream face with dots for the hours (bigger at the quarters,
 * no numerals), hands at ten past ten, and a thin second hand that sweeps round once a minute.
 */
function GiantClock({ base, accent }: DecorLook) {
  const R = 29;
  const bump = 6.5;
  const rimShape = (dy: number) =>
    ellipsePath(CX, CY + dy, R) +
    Array.from({ length: 12 }, (_, i) => {
      const t = (i * Math.PI) / 6;
      return ellipsePath(CX + R * Math.sin(t), CY + dy - R * Math.cos(t), bump);
    }).join('');
  const marks = Array.from({ length: 12 }, (_, i) => {
    const t = (i * Math.PI) / 6;
    return ellipsePath(CX + 19 * Math.sin(t), CY - 19 * Math.cos(t), i % 3 ? 1.7 : 2.8);
  }).join('');
  const hand = (deg: number, len: number) => {
    const t = (deg * Math.PI) / 180;
    return `M${CX} ${CY}L${f(CX + len * Math.sin(t))} ${f(CY - len * Math.cos(t))}`;
  };
  const dark = mix(accent, INK, 0.45);
  return (
    <g opacity={0.92}>
      <path d={rimShape(2.5)} fill={mix(base, accent, 0.85)} />
      <path d={rimShape(0)} fill={mix(base, accent, 0.55)} />
      <circle cx={CX} cy={CY} r={R - 4} fill={CREAM} />
      <circle cx={CX} cy={CY} r={R - 7} fill="none" stroke={base} strokeWidth={2} />
      <path d={marks} fill={mix(accent, INK, 0.3)} />
      {/* ten past ten: the hands smile */}
      <path d={hand(305, 12)} stroke={dark} strokeWidth={4.5} strokeLinecap="round" />
      <path d={hand(60, 17)} stroke={dark} strokeWidth={3.2} strokeLinecap="round" />
      <g className="decor-turn" style={{ transformOrigin: `${CX}px ${CY}px` }}>
        <path d={`M${CX} ${CY + 5}V${CY - 19}`} stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
      </g>
      <circle cx={CX} cy={CY} r={3.2} fill={dark} />
    </g>
  );
}

/* ---------- Monster Portraits ---------- */

/**
 * Three of the café's own regulars in frames: a gold oval in the middle and a wooden frame either
 * side, each on a mat from the shared families. The monsters are their real drawings (still: the
 * motion classes only run inside a live monster), cropped to head and shoulders.
 */
const PORTRAITS = [
  // frame centre, mat, the monster, and where its face sits in its own 200×200 drawing
  { id: 'chompers', cx: CX - 63, mat: fam.honey.base, scale: 0.36, face: [100, 108] },
  { id: 'mimsy', cx: CX, mat: fam.mint.base, scale: 0.44, face: [100, 100] },
  { id: 'blobbo', cx: CX + 63, mat: fam.lavender.base, scale: 0.4, face: [100, 100] },
] as const;

function MonsterPortraits() {
  const side = { w: 50, h: 56 };
  const oval = { rx: 30, ry: 35 };
  return (
    <g opacity={0.92}>
      <defs>
        {PORTRAITS.map((p, i) => (
          <clipPath key={p.id} id={`ncmc-portrait-${p.id}`}>
            {i === 1 ? (
              <ellipse cx={p.cx} cy={CY} rx={oval.rx - 6} ry={oval.ry - 6} />
            ) : (
              <rect x={p.cx - side.w / 2 + 6} y={CY - side.h / 2 + 6} width={side.w - 12} height={side.h - 12} />
            )}
          </clipPath>
        ))}
      </defs>
      {/* frames: a shade below, then the frame; the gold oval in the middle */}
      <path
        d={[PORTRAITS[0], PORTRAITS[2]]
          .map((p) => `M${p.cx - side.w / 2} ${CY - side.h / 2 + 2}h${side.w}v${side.h}h${-side.w}Z`)
          .join('')}
        fill={WOOD_DARK}
      />
      <path
        d={[PORTRAITS[0], PORTRAITS[2]]
          .map((p) => `M${p.cx - side.w / 2} ${CY - side.h / 2}h${side.w}v${side.h}h${-side.w}Z`)
          .join('')}
        fill={WOOD}
      />
      <path d={ellipsePath(CX, CY + 2, oval.rx, oval.ry)} fill={GOLD_DARK} />
      <path d={ellipsePath(CX, CY, oval.rx, oval.ry)} fill={GOLD} />
      {PORTRAITS.map((p) => {
        const Draw = DRAWINGS[p.id]!;
        const tx = p.cx - p.scale * p.face[0];
        const ty = CY + 4 - p.scale * p.face[1];
        return (
          <g key={p.id} clipPath={`url(#ncmc-portrait-${p.id})`}>
            <rect x={p.cx - 30} y={CY - 35} width={60} height={70} fill={p.mat} />
            <g transform={`translate(${f(tx)} ${f(ty)}) scale(${p.scale})`}>
              <Draw e="idle" s={specFor(p.id)} react={false} />
            </g>
          </g>
        );
      })}
      <path
        d={`M${CX - 22} ${CY - 18}A30 35 0 0 1 ${CX - 6} ${CY - 33}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.5}
      />
    </g>
  );
}

/* ---------- Trophy Shelf ---------- */

/**
 * Trophy Shelf: a wooden shelf on two brackets with a big gold cup in the middle (a star on its
 * bowl), a silver star trophy on the left and a blue prize rosette pinned up on the right, its
 * tails over the shelf. One glint twinkles on the cup. The shelf sits high, so a tall monster
 * covers only its brackets.
 */
function TrophyShelf() {
  const shelfY = Y + 58;
  const sx0 = X + 14;
  const sx1 = X + W - 14;
  // gold cup
  const cupTop = Y + 7;
  const cup = `M${CX - 17} ${cupTop}H${CX + 17}Q${CX + 17} ${cupTop + 25} ${CX} ${cupTop + 28}Q${CX - 17} ${cupTop + 25} ${CX - 17} ${cupTop}Z`;
  const cupShade = `M${CX + 2} ${cupTop}H${CX + 17}Q${CX + 17} ${cupTop + 25} ${CX} ${cupTop + 28}Q${CX + 11} ${cupTop + 18} ${CX + 2} ${cupTop}Z`;
  const handles = `M${CX - 16} ${cupTop + 5}q-11 0 -11 8q0 8 13 11M${CX + 16} ${cupTop + 5}q11 0 11 8q0 8 -13 11`;
  const foot = `M${CX - 3} ${cupTop + 27}h6v8h-6ZM${CX - 11} ${shelfY - 9}l3 -6h16l3 6Z`;
  // silver star trophy and the rosette
  const lx = CX - 58;
  const rx = CX + 58;
  const ribbon = mix(fam.sky.base, fam.sky.accent, 0.55);
  const pleats = Array.from({ length: 10 }, (_, i) => {
    const t = (i * Math.PI) / 5;
    return ellipsePath(rx + 11 * Math.cos(t), CY - 8 + 11 * Math.sin(t), 5);
  }).join('');
  return (
    <g opacity={0.92}>
      {/* rosette tails, behind the shelf */}
      <path d={`M${rx - 7} ${CY - 2}l-5 ${shelfY - CY + 4}l6 -4l4 5ZM${rx + 7} ${CY - 2}l5 ${shelfY - CY + 4}l-6 -4l-4 5Z`} fill={mix(ribbon, fam.sky.accent, 0.4)} />
      <path d={pleats + ellipsePath(rx, CY - 8, 11)} fill={ribbon} />
      <path d={ellipsePath(rx, CY - 8, 7)} fill={CREAM} />
      <path d={starPath(rx, CY - 8, 5)} fill={GOLD} stroke={GOLD} strokeWidth={1} strokeLinejoin="round" />
      {/* shelf and brackets */}
      <path d={`M${sx0 + 14} ${shelfY + 6}h10l-10 12ZM${sx1 - 14} ${shelfY + 6}h-10l10 12Z`} fill={WOOD_DARK} />
      <rect x={sx0} y={shelfY + 3} width={sx1 - sx0} height={5} rx={2} fill={WOOD_DARK} />
      <rect x={sx0} y={shelfY - 1} width={sx1 - sx0} height={7} rx={3} fill={WOOD} />
      {/* silver star on a little stand */}
      {/* the stem runs up into the star, which is drawn over its top */}
      <path d={`M${lx - 2} ${CY - 8}h4v${shelfY - 1 - (CY - 8)}h-4ZM${lx - 10} ${shelfY - 1}l2 -6h16l2 6Z`} fill={SILVER_SHADE} />
      <path d={starPath(lx, CY - 12, 14)} fill={SILVER} stroke={SILVER_SHADE} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={starPath(lx, CY - 12, 6)} fill={SILVER_SHADE} opacity={0.55} />
      {/* gold cup: handles, bowl and its shaded side, foot on a wooden plinth, a star, the rim */}
      <rect x={CX - 14} y={shelfY - 9} width={28} height={9} rx={2} fill={WOOD_DARK} />
      <path d={foot} fill={GOLD_DARK} />
      <path d={handles} fill="none" stroke={GOLD} strokeWidth={3.5} strokeLinecap="round" />
      <path d={cup} fill={GOLD} />
      <path d={cupShade} fill={GOLD_DARK} opacity={0.45} />
      <path d={ellipsePath(CX, cupTop, 17, 2.6)} fill={GOLD_DARK} />
      <path d={starPath(CX, cupTop + 12, 5.5)} fill={GOLD_DARK} stroke={GOLD_DARK} strokeWidth={1} strokeLinejoin="round" />
      <path d={ellipsePath(CX - 10, cupTop + 9, 2, 5)} fill="#ffffff" opacity={0.5} />
      <path className="decor-twinkle" d={sparklePath(CX - 14, cupTop + 3, 6)} fill="#fffdf2" />
    </g>
  );
}

const ART: Record<string, (look: DecorLook) => ReactElement> = {
  'menu-board': MenuBoard,
  'neon-open': NeonOpen,
  'giant-clock': GiantClock,
  'monster-portraits': MonsterPortraits,
  'trophy-shelf': TrophyShelf,
};

/** The equipped wall art, or its labelled stand-in if it has no art yet (ART_GUIDE §2.7). */
export function WallArt({ look }: { look: DecorLook }) {
  const Art = ART[look.item];
  if (!Art) return <WallArtStandIn look={look} />;
  return (
    <g data-decor="wallArt" data-item={look.item}>
      <Art {...look} />
    </g>
  );
}
