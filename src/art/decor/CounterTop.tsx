// Counter-top slot art (M4b batch 3, ART_GUIDE §5): one thing standing on the counter's far edge
// at its right end (DECOR.counter, 96×112), right of the ticket and clear of the whole counter row
// on both basket sides. The counter is nearer than the room, so these are drawn at full opacity
// and sit on a soft shadow on the edge strip. During CountTogether the ticket slides over the top
// of the slot, so the tallest parts (flowers, the robot's antenna) may hide behind it for a while.
// Colorway items take only {base, accent} (§2.3); the Fish Bowl has its own colours.
import type { ReactElement } from 'react';
import { DECOR } from '../../app/metrics';
import { COLOR_FAMILIES } from '../../engine/economy';
import { CREAM, INK, SILVER, SILVER_SHADE, ellipsePath, heartPath, mix } from './paint';
import { CounterTopStandIn, type DecorLook } from './StandIn';
import './decor.css';

const r = DECOR.counter;
const CX = r.x + r.w / 2;
/** Where things stand: on the far edge strip, as the stand-in does. */
const BASE = r.y + r.h;
const LEAF = '#8fbf6a';
const STEM = '#79a85e';
const f = (n: number) => n.toFixed(1);

function Shadow({ rx }: { rx: number }) {
  return <ellipse cx={CX} cy={BASE} rx={rx} ry={5} fill="rgba(0,0,0,0.15)" />;
}

/** Five round petals round a centre, as path data (blooms of one colour share a path). */
const bloom = (x: number, y: number, R: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const t = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return ellipsePath(x + R * 0.55 * Math.cos(t), y + R * 0.55 * Math.sin(t), R * 0.48);
  }).join('');

/* ---------- Flower Vase ---------- */

/**
 * Flower Vase: a round-bellied vase in the family colour with a band of the accent, three blooms
 * on green stems (a pale one, a strong one and a cream daisy, so the family shows without being
 * all one colour), a leaf hanging from each outer stem, and a curved glint along the belly.
 */
function FlowerVase({ base, accent }: DecorLook) {
  const belly = `M${CX - 7} ${BASE - 34}C${CX - 23} ${BASE - 30} ${CX - 23} ${BASE - 2} ${CX - 11} ${BASE - 1}H${CX + 11}C${CX + 23} ${BASE - 2} ${CX + 23} ${BASE - 30} ${CX + 7} ${BASE - 34}V${BASE - 43}H${CX - 7}Z`;
  const shade = `M${CX + 7} ${BASE - 34}C${CX + 23} ${BASE - 30} ${CX + 23} ${BASE - 2} ${CX + 11} ${BASE - 1}H${CX + 4}C${CX + 14} ${BASE - 6} ${CX + 15} ${BASE - 26} ${CX + 7} ${BASE - 34}Z`;
  const neck = BASE - 44;
  const flowers = [
    [CX - 19, BASE - 82, 11],
    [CX + 2, BASE - 96, 12],
    [CX + 21, BASE - 78, 10],
  ] as const;
  const stemOf = ([x, y]: readonly [number, number, number], i: number) => {
    const p0 = [CX - 3 + i * 3, neck + 2] as const;
    const c = [(CX + x) / 2 + (i - 1) * 2, (neck + y) / 2] as const;
    return { p0, c, p2: [x, y + 4] as const };
  };
  const stems = flowers
    .map((fl, i) => {
      const { p0, c, p2 } = stemOf(fl, i);
      return `M${p0[0]} ${p0[1]}Q${f(c[0])} ${f(c[1])} ${p2[0]} ${p2[1]}`;
    })
    .join('');
  // Each outer stem carries a leaf from its middle, hanging down and out, below the flowers.
  const leaves = ([0, 2] as const)
    .map((i) => {
      const { p0, c, p2 } = stemOf(flowers[i], i);
      const ax = 0.25 * p0[0] + 0.5 * c[0] + 0.25 * p2[0];
      const ay = 0.25 * p0[1] + 0.5 * c[1] + 0.25 * p2[1];
      const s = i === 0 ? -1 : 1;
      return `M${f(ax)} ${f(ay)}Q${f(ax + s * 11)} ${f(ay - 2)} ${f(ax + s * 15)} ${f(ay + 10)}Q${f(ax + s * 5)} ${f(ay + 8)} ${f(ax)} ${f(ay)}Z`;
    })
    .join('');
  // The glint follows the belly's curve on its upper left, so the vase reads as round.
  const arc = (deg: number) => {
    const t = (deg * Math.PI) / 180;
    return `${f(CX + 13 * Math.cos(t))} ${f(BASE - 17 + 13 * Math.sin(t))}`;
  };
  return (
    <g>
      <Shadow rx={24} />
      <path d={stems} fill="none" stroke={STEM} strokeWidth={2.6} strokeLinecap="round" />
      <path d={leaves} fill={LEAF} />
      <path d={bloom(...flowers[0])} fill={mix(base, accent, 0.25)} />
      <path d={bloom(...flowers[1])} fill={mix(base, accent, 0.75)} />
      <path d={bloom(...flowers[2])} fill={CREAM} />
      <path d={flowers.map(([x, y, R]) => ellipsePath(x, y, R * 0.3)).join('')} fill="#f6c445" />
      <path d={belly} fill={mix(base, accent, 0.45)} />
      <path d={shade} fill={mix(base, accent, 0.75)} opacity={0.6} />
      <rect x={CX - 18.6} y={BASE - 23} width={37.2} height={5} rx={1.5} fill={accent} opacity={0.75} />
      <rect x={CX - 11} y={BASE - 47} width={22} height={6} rx={3} fill={mix(base, accent, 0.65)} />
      <path
        d={`M${arc(200)}A13 13 0 0 1 ${arc(250)}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={3.2}
        strokeLinecap="round"
        opacity={0.55}
      />
    </g>
  );
}

/* ---------- Cake Stand ---------- */

/**
 * Cake Stand: a cream porcelain stand with a round layer cake, frosting in the family colour
 * dripping down its sides, a jam layer in the accent, sprinkles and a cherry on top. No glass dome:
 * the serve bell is a dome, and the two must never be confused.
 */
function CakeStand({ base, accent }: DecorLook) {
  const plateY = BASE - 26;
  const cakeTop = plateY - 32;
  const frosting = mix(base, accent, 0.22);
  const drips = (() => {
    // the frosting cap, then a wavy bottom edge with a few longer drips
    let d = `M${CX - 29} ${cakeTop + 10}V${cakeTop + 5}Q${CX - 29} ${cakeTop - 1} ${CX - 23} ${cakeTop - 1}H${CX + 23}Q${CX + 29} ${cakeTop - 1} ${CX + 29} ${cakeTop + 5}V${cakeTop + 10}`;
    const drop = [6, 12, 5, 9, 4, 13, 6, 8];
    const step = 58 / drop.length;
    drop.forEach((h, i) => {
      const x1 = CX + 29 - (i + 1) * step;
      d += `Q${f(x1 + step / 2)} ${cakeTop + 10 + h} ${f(x1)} ${cakeTop + 10}`;
    });
    return `${d}Z`;
  })();
  const sprinkles = [
    [-18, 3, 30],
    [-8, 1, -20],
    [4, 4, 60],
    [14, 2, -40],
    [22, 5, 10],
    [-24, 7, -60],
  ]
    .map(([dx, dy, deg]) => {
      const t = ((deg ?? 0) * Math.PI) / 180;
      const x = CX + dx!;
      const y = cakeTop + dy!;
      return `M${f(x - 2.4 * Math.cos(t))} ${f(y - 2.4 * Math.sin(t))}L${f(x + 2.4 * Math.cos(t))} ${f(y + 2.4 * Math.sin(t))}`;
    })
    .join('');
  return (
    <g>
      <Shadow rx={26} />
      {/* the stand, bottom up: the foot on the counter, the stem standing on it, the plate's
          underside and top; then the cake sitting on the plate */}
      <path d={ellipsePath(CX, BASE - 2, 16, 4)} fill="#e8dcc4" />
      <path d={`M${CX - 5} ${plateY + 2}h10l4 ${BASE - 4 - plateY}h-18Z`} fill={CREAM} />
      <path d={ellipsePath(CX, plateY + 2.5, 38, 4.5)} fill="#e8dcc4" />
      <path d={ellipsePath(CX, plateY, 40, 4.5)} fill={CREAM} />
      {/* the cake: sponge with its shaded side, a jam layer, then the frosting */}
      <rect x={CX - 28} y={cakeTop + 4} width={56} height={plateY - cakeTop - 3} rx={2} fill="#f3d9a8" />
      <rect x={CX + 14} y={cakeTop + 4} width={14} height={plateY - cakeTop - 3} rx={2} fill="#e2c08a" opacity={0.7} />
      <rect x={CX - 28} y={cakeTop + 18} width={56} height={5} fill={mix(base, accent, 0.65)} />
      <path d={drips} fill={frosting} />
      <path d={sprinkles} stroke={accent} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
      {/* cherry */}
      <path d={`M${CX + 1} ${cakeTop - 8}q2 -6 8 -8`} fill="none" stroke={STEM} strokeWidth={2} strokeLinecap="round" />
      <circle cx={CX} cy={cakeTop - 5} r={5.5} fill="#e0435f" />
      <path d={ellipsePath(CX - 1.8, cakeTop - 7, 1.6)} fill="#ffffff" opacity={0.7} />
    </g>
  );
}

/* ---------- Cookie Jar ---------- */

const COOKIE = '#d9a35f';
const COOKIE_EDGE = '#b98352';
const CHIP = '#6b4226';

/**
 * Cookie Jar: a ceramic jar in the family colour (not glass, so it is never the coin jar) with a
 * cookie on a cream label and its lid on, one cookie leaning on its side and another lying flat
 * on the counter in front of it.
 */
function CookieJar({ base, accent }: DecorLook) {
  const top = BASE - 46;
  // A round-shouldered crock, a little fuller than it is tall.
  const body = `M${CX - 19} ${top}Q${CX - 28} ${top + 3} ${CX - 28} ${top + 14}Q${CX - 29} ${BASE - 14} ${CX - 26} ${BASE - 6}Q${CX - 24} ${BASE} ${CX - 16} ${BASE}H${CX + 16}Q${CX + 24} ${BASE} ${CX + 26} ${BASE - 6}Q${CX + 29} ${BASE - 14} ${CX + 28} ${top + 14}Q${CX + 28} ${top + 3} ${CX + 19} ${top}Z`;
  const shade = `M${CX + 14} ${top + 1}Q${CX + 28} ${top + 3} ${CX + 28} ${top + 14}Q${CX + 29} ${BASE - 14} ${CX + 26} ${BASE - 6}Q${CX + 24} ${BASE} ${CX + 16} ${BASE}H${CX + 12}Q${CX + 20} ${BASE - 6} ${CX + 20} ${BASE - 16}V${top + 14}Q${CX + 20} ${top + 5} ${CX + 14} ${top + 1}Z`;
  const lean = [CX + 30, BASE - 9] as const;
  const flat = [CX - 21, BASE + 2] as const;
  const label = [CX - 3, BASE - 22] as const;
  const chips = [
    [lean[0] - 2, lean[1] - 3],
    [lean[0] + 3, lean[1] + 1],
    [lean[0] - 3, lean[1] + 3],
    [label[0] - 2, label[1] - 2],
    [label[0] + 3, label[1] + 1],
    [label[0] - 1, label[1] + 3.5],
  ]
    .map(([x, y]) => ellipsePath(x!, y!, 1.7))
    .join('') +
    // the flat cookie's chips, seen from the side, are flattened too
    [
      [-4.5, -0.6],
      [2.5, -1.2],
      [0, 1],
      [5.5, 0.6],
    ]
      .map(([dx, dy]) => ellipsePath(flat[0] + dx!, flat[1] + dy!, 1.8, 0.8))
      .join('');
  const cookie = { fill: COOKIE, stroke: COOKIE_EDGE, strokeWidth: 1.5 } as const;
  return (
    <g>
      <Shadow rx={32} />
      <path d={body} fill={mix(base, accent, 0.3)} />
      <path d={shade} fill={mix(base, accent, 0.6)} opacity={0.55} />
      <path d={ellipsePath(label[0], label[1], 13, 11)} fill={CREAM} />
      <circle cx={label[0]} cy={label[1]} r={7} fill={COOKIE} />
      <path
        d={`M${CX - 21} ${top + 9}Q${CX - 24} ${top + 18} ${CX - 23} ${top + 29}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
      />
      {/* the lid, sitting on the jar */}
      <path d={`M${CX - 21} ${top + 1}q0 -10 21 -11q21 1 21 11Z`} fill={mix(base, accent, 0.55)} />
      <rect x={CX - 23} y={top - 1} width={46} height={5} rx={2.5} fill={mix(base, accent, 0.75)} />
      <circle cx={CX} cy={top - 12} r={4.5} fill={accent} />
      <circle cx={lean[0]} cy={lean[1]} r={8.5} {...cookie} />
      <path d={ellipsePath(flat[0], flat[1] + 1.6, 10, 3.6)} fill={COOKIE_EDGE} />
      <path d={ellipsePath(flat[0], flat[1], 10, 3.6)} fill={COOKIE} />
      <path d={chips} fill={CHIP} />
    </g>
  );
}

/* ---------- Fish Bowl ---------- */

const GLASS_EDGE = '#9cc3d9';

/**
 * Fish Bowl: a round glass bowl of water on a little foot, pebbles in three family colours, a
 * waterweed, and a goldfish that swims slowly from side to side and turns round at each side.
 * As it slows at each side, just before it turns, a few bubbles rise from its mouth. Glass and
 * goldfish have their own colours.
 */
function FishBowl() {
  const R = 36;
  const cy = BASE - 4 - R;
  const rimY = cy - 30;
  const rimDx = Math.sqrt(R * R - 30 * 30);
  const waterY = cy - 22;
  const waterDx = Math.sqrt(R * R - 22 * 22);
  const bowl = `M${f(CX - rimDx)} ${rimY}A${R} ${R} 0 1 0 ${f(CX + rimDx)} ${rimY}Z`;
  const water = `M${f(CX - waterDx)} ${waterY}A${R} ${R} 0 1 0 ${f(CX + waterDx)} ${waterY}Z`;
  const floor = cy + R - 8;
  const pebbles = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([dx, dy]) => ellipsePath(CX + dx, floor + dy, 5, 3.4)).join('');
  const fy = cy + 4;
  return (
    <g>
      <Shadow rx={26} />
      <path d={ellipsePath(CX, BASE - 3, 17, 4)} fill="#b9dcef" />
      <path d={bowl} fill="#e8f6ff" opacity={0.6} />
      <path d={water} fill="#bfe3f7" opacity={0.85} />
      <path d={ellipsePath(CX, waterY, waterDx, 3)} fill="#dcf1fc" />
      <path
        d={`M${CX - 12} ${floor}q-7 -12 0 -22q6 -10 -1 -20M${CX - 6} ${floor + 1}q4 -10 -1 -18`}
        fill="none"
        stroke="#6fae6a"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path d={pebbles([[-15, 1], [8, 2]])} fill={COLOR_FAMILIES.berry.base} />
      <path d={pebbles([[-4, 3], [17, -1]])} fill={COLOR_FAMILIES.honey.base} />
      <path d={pebbles([[2, -1], [-20, -2]])} fill={COLOR_FAMILIES.lavender.base} />
      {/* the goldfish faces right; CSS moves and turns it about its middle */}
      <g className="decor-swim" style={{ transformOrigin: `${CX + 2}px ${fy}px` }}>
        <path d={`M${CX - 7} ${fy}l-10 -7q2 7 0 14Z`} fill="#f0823a" />
        <path d={`M${CX - 3} ${fy - 6}q5 -7 10 -1Z`} fill="#f0823a" />
        <ellipse cx={CX + 2} cy={fy} rx={11} ry={7.5} fill="#f99d4c" />
        <circle cx={CX + 7.5} cy={fy - 1.5} r={2.3} fill={INK} />
        <circle cx={CX + 8.3} cy={fy - 2.3} r={0.9} fill="#ffffff" />
      </g>
      {/* Bubbles where its mouth is at each side (decor-blub runs in step with decor-swim; the
          left column half a loop later). Hidden unless moving: a still bubble reads as stray. */}
      {[
        [CX + 23, 1],
        [CX - 19, -1],
      ].map(([bx, side], i) => (
        <g key={bx} className="decor-blub" opacity={0} style={{ animationDelay: `${-7 * i}s` }}>
          <path
            d={ellipsePath(bx!, fy - 4, 2) + ellipsePath(bx! + 2 * side!, fy - 10, 1.6) + ellipsePath(bx! - side!, fy - 15, 2.3)}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.4}
          />
        </g>
      ))}
      <path d={bowl} fill="none" stroke={GLASS_EDGE} strokeWidth={2} opacity={0.85} />
      <path d={ellipsePath(CX, rimY, rimDx, 3.5)} fill="none" stroke={GLASS_EDGE} strokeWidth={2.5} />
      <path
        d={`M${CX - 27} ${cy - 8}Q${CX - 31} ${cy + 6} ${CX - 23} ${cy + 20}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.6}
      />
    </g>
  );
}

/* ---------- Tiny Robot ---------- */

const METAL = SILVER_SHADE;
const METAL_DARK = '#8f95aa';

/**
 * Tiny Robot: a little round-cornered robot in the family colour with a heart on its chest, a
 * cream face plate with ink eyes, catch-lights and blush (Pip's face standard), side bolts, and an
 * antenna bulb with a soft glow. It blinks now and then and every few seconds gives a small wave.
 */
function TinyRobot({ base, accent }: DecorLook) {
  const bodyTop = BASE - 46;
  const headTop = BASE - 90;
  const headBot = headTop + 38;
  const eyeY = headTop + 16;
  const shoulderR = [CX + 22, bodyTop + 8] as const;
  const shade = (x: number, y: number, w: number, h: number) =>
    `M${x + w - 12} ${y}h2a10 10 0 0 1 10 10v${h - 20}a10 10 0 0 1 -10 10h-2Z`;
  return (
    <g>
      <Shadow rx={26} />
      {/* feet, the still arm, neck and bolts in metal */}
      <path
        d={`M${CX - 20} ${BASE - 10}h13v10h-13ZM${CX + 7} ${BASE - 10}h13v10h-13ZM${CX - 5} ${headBot - 2}h10v10h-10Z`}
        fill={METAL}
      />
      <path d={`M${CX - 22} ${bodyTop + 8}L${CX - 31} ${bodyTop + 24}`} stroke={METAL} strokeWidth={5} strokeLinecap="round" />
      <circle cx={CX - 32} cy={bodyTop + 27} r={4.5} fill={METAL_DARK} />
      {/* body with its shaded side, a cream chest panel and a heart */}
      <rect x={CX - 23} y={bodyTop} width={46} height={38} rx={10} fill={mix(base, accent, 0.5)} />
      <path d={shade(CX - 23, bodyTop, 46, 38)} fill={mix(base, accent, 0.8)} opacity={0.55} />
      <rect x={CX - 12} y={bodyTop + 7} width={24} height={22} rx={6} fill={CREAM} opacity={0.92} />
      <path d={heartPath(CX, bodyTop + 18, 6)} fill={accent} />
      {/* the waving arm, about its shoulder */}
      <g className="decor-wave" style={{ transformOrigin: `${shoulderR[0]}px ${shoulderR[1]}px` }}>
        <path d={`M${shoulderR[0]} ${shoulderR[1]}L${CX + 33} ${bodyTop - 7}`} stroke={METAL} strokeWidth={5} strokeLinecap="round" />
        <circle cx={CX + 34} cy={bodyTop - 10} r={4.5} fill={METAL_DARK} />
      </g>
      {/* antenna: stalk, a soft glow that breathes, the bulb */}
      <path d={`M${CX} ${headTop}V${headTop - 12}`} stroke={METAL} strokeWidth={3} strokeLinecap="round" />
      <circle className="decor-glow" cx={CX} cy={headTop - 15} r={9.5} fill="#fff3cc" opacity={0.85} />
      <circle cx={CX} cy={headTop - 15} r={5} fill="#ffd65a" />
      {/* head, side bolts, face plate */}
      <path d={ellipsePath(CX - 29, eyeY + 3, 4.5) + ellipsePath(CX + 29, eyeY + 3, 4.5)} fill={SILVER} />
      <rect x={CX - 27} y={headTop} width={54} height={38} rx={12} fill={mix(base, accent, 0.35)} />
      <path d={shade(CX - 27, headTop, 54, 38)} fill={mix(base, accent, 0.7)} opacity={0.5} />
      <rect x={CX - 20} y={headTop + 6} width={40} height={26} rx={9} fill={CREAM} />
      <path d={ellipsePath(CX - 13, eyeY + 7, 4, 2.4) + ellipsePath(CX + 13, eyeY + 7, 4, 2.4)} fill={accent} opacity={0.35} />
      <g className="decor-blink" style={{ transformOrigin: `${CX}px ${eyeY}px` }}>
        <path d={ellipsePath(CX - 8, eyeY, 3.6, 4.6) + ellipsePath(CX + 8, eyeY, 3.6, 4.6)} fill={INK} />
        <path d={ellipsePath(CX - 6.8, eyeY - 1.6, 1.3) + ellipsePath(CX + 9.2, eyeY - 1.6, 1.3)} fill="#ffffff" />
      </g>
      <path d={`M${CX - 4} ${eyeY + 7}q4 4 8 0`} fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

const ART: Record<string, (look: DecorLook) => ReactElement> = {
  'flower-vase': FlowerVase,
  'cake-stand': CakeStand,
  'cookie-jar': CookieJar,
  'fish-bowl': FishBowl,
  'tiny-robot': TinyRobot,
};

/** The equipped counter-top piece, or its labelled stand-in if it has no art yet (ART_GUIDE §2.7). */
export function CounterTop({ look }: { look: DecorLook }) {
  const Art = ART[look.item];
  if (!Art) return <CounterTopStandIn look={look} />;
  return (
    <g data-decor="counter" data-item={look.item}>
      <Art {...look} />
    </g>
  );
}
