// Wallpaper slot art (M4b batch 1, ART_GUIDE §5): the back wall above the wainscot. Every piece is
// a repeating <pattern> on one wall-sized rect, so it costs a handful of elements however wide the
// screen; colorway items take only {base, accent} (ART_GUIDE §2.3). Named looks (Brick, Starry
// Night, Rainbow) carry their own colours. Kept low-contrast where the monster's head sits (§2.1).
import type { ReactElement } from 'react';
import { DECOR } from '../../app/metrics';
import { COLOR_FAMILIES } from '../../engine/economy';
import { CREAM, mix, patternId } from './paint';
import { WallpaperStandIn, type DecorLook } from './StandIn';
import './decor.css';

/** The wall rect: from far above the stage to the wainscot, far past both sides (bleed). */
const WALL = { x: -1000, y: -600, w: 3280, h: DECOR.wallpaper.y + DECOR.wallpaper.h + 600 };
const WAINSCOT = DECOR.wallpaper.y + DECOR.wallpaper.h;

function Wall({ fill }: { fill: string }) {
  return <rect x={WALL.x} y={WALL.y} width={WALL.w} height={WALL.h} fill={fill} />;
}

/**
 * The café's own two-tone stripe. The scene draws its Sunny default with this too, so Plain Paint
 * in Berry or Lavender is the same wall in another colour.
 */
export function PaintedStripe({ a, b }: { a: string; b: string }) {
  const id = patternId('wp-plain', a, b);
  return (
    <g>
      <defs>
        <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
          <rect width="36" height="72" fill={a} />
          <rect x="36" width="36" height="72" fill={b} />
        </pattern>
      </defs>
      <Wall fill={`url(#${id})`} />
    </g>
  );
}

/** The Sunny default's second stripe is this same mix, so every Plain Paint colour matches it. */
export const paintStripe = (base: string, accent: string) => mix(base, accent, 0.16);

function PlainPaint({ base, accent }: DecorLook) {
  return <PaintedStripe a={base} b={paintStripe(base, accent)} />;
}

/** Soft dots, half-drop, a shade deeper than the wall: busy enough to notice, quiet behind heads. */
function PolkaDots({ base, accent }: DecorLook) {
  const id = patternId('wp-dots', base, accent);
  const dot = mix(base, accent, 0.32);
  return (
    <g>
      <defs>
        <pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse">
          <rect width="64" height="64" fill={base} />
          <circle cx="16" cy="16" r="8" fill={dot} />
          <circle cx="48" cy="48" r="8" fill={dot} />
        </pattern>
      </defs>
      <Wall fill={`url(#${id})`} />
    </g>
  );
}

/** Bolder than Plain Paint: a wide band and a pinstripe, so the two read as different papers. */
function Stripes({ base, accent }: DecorLook) {
  const id = patternId('wp-stripes', base, accent);
  return (
    <g>
      <defs>
        <pattern id={id} width="72" height="72" patternUnits="userSpaceOnUse">
          <rect width="72" height="72" fill={mix(base, CREAM, 0.35)} />
          <rect width="26" height="72" fill={mix(base, accent, 0.22)} />
          <rect x="45" width="5" height="72" fill={mix(base, accent, 0.4)} />
        </pattern>
      </defs>
      <Wall fill={`url(#${id})`} />
    </g>
  );
}

/** Pale painted brick: running bond, each brick with a darker lower lip for depth (no outlines). */
function Brick() {
  const id = 'wp-brick';
  const MORTAR = '#f5e3cf';
  const BRICK = '#e7b497';
  const SHADE = '#d9a184';
  const brick = (x: number, y: number) => (
    <g key={`${x},${y}`}>
      <rect x={x} y={y} width={56} height={20} rx={3} fill={BRICK} />
      <rect x={x} y={y + 15} width={56} height={5} rx={2} fill={SHADE} />
    </g>
  );
  return (
    <g>
      <defs>
        <pattern id={id} width="60" height="48" patternUnits="userSpaceOnUse">
          <rect width="60" height="48" fill={MORTAR} />
          {brick(2, 2)}
          {brick(-28, 26)}
          {brick(32, 26)}
        </pattern>
      </defs>
      <Wall fill={`url(#${id})`} />
    </g>
  );
}

/** A five-point star with softened points (round joins on a same-colour stroke). */
function starPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

/**
 * Starry Night: a dusky blue-violet wall (not black, so the room stays warm), a lighter band low
 * on the wall like the last of the evening, scattered gold stars, a crescent moon between the
 * window and the monster. Experiment (ART_GUIDE §4): a few stars twinkle slowly (opacity only,
 * still under reduced motion).
 */
function StarryNight() {
  const SKY = '#5b5f9f';
  const GLOW = '#6c6aa8';
  const STAR = '#ffe7a0';
  const id = 'wp-stars';
  const twinkles: [number, number, number][] = [
    [120, 236, 7],
    [478, 236, 6],
    [800, 150, 7],
    [1010, 136, 6],
    [1196, 150, 7],
    [-120, 170, 7],
    [1420, 160, 7],
  ];
  return (
    <g>
      <defs>
        <pattern id={id} width="180" height="130" patternUnits="userSpaceOnUse" x="20" y={DECOR.wallpaper.y}>
          <path d={starPath(30, 34, 6)} fill={STAR} stroke={STAR} strokeWidth={2} strokeLinejoin="round" />
          <path d={starPath(124, 92, 5)} fill={STAR} stroke={STAR} strokeWidth={2} strokeLinejoin="round" />
          <circle cx="92" cy="22" r="2.5" fill={CREAM} opacity={0.75} />
          <circle cx="160" cy="48" r="2" fill={CREAM} opacity={0.6} />
          <circle cx="58" cy="104" r="2.5" fill={CREAM} opacity={0.7} />
        </pattern>
      </defs>
      <Wall fill={SKY} />
      <rect x={WALL.x} y={WAINSCOT - 46} width={WALL.w} height={46} fill={GLOW} />
      <Wall fill={`url(#${id})`} />
      {/* crescent moon: a disc with a sky-coloured disc over it, in the gap left of the monster */}
      <circle cx={468} cy={178} r={17} fill="#fff1bf" />
      <circle cx={477} cy={172} r={14} fill={SKY} />
      {twinkles.map(([x, y, r], i) => (
        <path
          key={i}
          className="decor-twinkle"
          style={{ animationDelay: `${(i * 0.9) % 4}s` }}
          d={starPath(x, y, r)}
          fill={STAR}
          stroke={STAR}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

/**
 * Rainbow: little pastel rainbows over cream clouds on a pale sky. High ones every 220 px, low ones
 * every 440, placed so no low rainbow sits behind the monster's head (x ≈ 470–810, ART_GUIDE §2.1).
 */
function Rainbow() {
  const id = 'wp-rainbow';
  const SKY = '#e2eff9';
  // Bands from the shared families, outer to inner, so the rainbow matches the rest of the shop.
  const bands = (['berry', 'honey', 'mint', 'lavender'] as const).map((f) =>
    mix(COLOR_FAMILIES[f].base, COLOR_FAMILIES[f].accent, 0.45),
  );
  const cloud = (cx: number, cy: number) =>
    `M${cx - 14} ${cy} a9 8 0 0 1 9 -9 a10 10 0 0 1 17 1 a8 8 0 0 1 2 16 h-22 a8 8 0 0 1 -6 -8 Z`;
  const rainbow = (cx: number, cy: number) => (
    <g key={`${cx},${cy}`}>
      {bands.map((c, i) => {
        const r = 28 - i * 6;
        return <path key={c} d={`M${cx - r} ${cy} a${r} ${r} 0 0 1 ${2 * r} 0`} fill="none" stroke={c} strokeWidth={6} />;
      })}
      <path d={cloud(cx - 25, cy + 2)} fill={CREAM} />
      <path d={cloud(cx + 27, cy + 2)} fill={CREAM} />
    </g>
  );
  return (
    <g>
      <defs>
        <pattern id={id} width="440" height="140" patternUnits="userSpaceOnUse" x="200" y={DECOR.wallpaper.y}>
          <rect width="440" height="140" fill={SKY} />
          {rainbow(110, 58)}
          {rainbow(330, 58)}
          {rainbow(220, 128)}
        </pattern>
      </defs>
      <Wall fill={`url(#${id})`} />
    </g>
  );
}

const ART: Record<string, (look: DecorLook) => ReactElement> = {
  plain: PlainPaint,
  'polka-dots': PolkaDots,
  stripes: Stripes,
  brick: Brick,
  'starry-night': StarryNight,
  rainbow: Rainbow,
};

/** The equipped wallpaper, or its labelled stand-in if it has no art yet (ART_GUIDE §2.7). */
export function Wallpaper({ look }: { look: DecorLook }) {
  const Art = ART[look.item];
  if (!Art) return <WallpaperStandIn look={look} />;
  return (
    <g data-decor="wallpaper" data-item={look.item}>
      <Art {...look} />
    </g>
  );
}
