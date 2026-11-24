// Window slot art (M4b batch 2, ART_GUIDE §5): the window beside the door (DECOR.window). Every
// window is the café's own frame (white frame and middle bar, trim sill, the peach awning), and
// only the view through it changes, so a new window reads as the same window. Views are drawn in
// the window's own coordinates (0..w, 0..h) and clipped to the glass. Windows are scenes, so they
// have no colorways (SPEC §9); their colours are their own.
import type { ReactElement, ReactNode } from 'react';
import { DECOR } from '../../app/metrics';
import { COLOR_FAMILIES } from '../../engine/economy';
import { CREAM, ellipsePath, mix, starPath } from './paint';
import { WindowStandIn, type DecorLook } from './StandIn';
import { STREET_MOCKS } from './StreetMocks';
import './decor.css';

/** The wainscot trim colour: the sill is the same wood. */
const TRIM = '#e8c48a';
const AWNING = '#ff9f7a';
const { w: W, h: H } = DECOR.window;
const f = (n: number) => n.toFixed(1);

/** The café's window: a view inside the glass, then the frame, middle bar, sill and awning. */
function Frame({ glass, clipId, children }: { glass: string; clipId: string; children: ReactNode }) {
  const { x, y } = DECOR.window;
  return (
    <g opacity={0.9} transform={`translate(${x} ${y})`}>
      <defs>
        <clipPath id={clipId}>
          <rect width={W} height={H} rx={8} />
        </clipPath>
      </defs>
      <rect width={W} height={H} rx={8} fill={glass} />
      <g clipPath={`url(#${clipId})`}>{children}</g>
      <rect width={W} height={H} rx={8} fill="none" stroke="#fff" strokeWidth={9} />
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#fff" strokeWidth={6} />
      <rect x={-8} y={H - 2} width={W + 16} height={10} rx={3} fill={TRIM} />
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={`M${-8 + i * ((W + 16) / 6)} -6 h${(W + 16) / 6} v10 a${(W + 16) / 12} 10 0 0 1 ${-(W + 16) / 6} 0 Z`}
          fill={i % 2 ? CREAM : AWNING}
        />
      ))}
    </g>
  );
}

/** A small puffy cloud, as the Street window has. */
const cloud = (x: number, y: number) =>
  `M${x} ${y} q12 -14 26 -4 q10 -10 22 0 q6 8 -4 10 h-38 q-10 -2 -6 -6 Z`;

/** Street (the free default): the houses across the road, a tree, the sun. */
function StreetView() {
  return (
    <>
      <circle cx={W - 40} cy={34} r={14} fill="#fff3a6" />
      <path d={cloud(20, 44)} fill="#fff" />
      <rect x={0} y={H * 0.5} width={60} height={H * 0.5} fill="#e9c6a8" />
      <rect x={62} y={H * 0.38} width={70} height={H * 0.62} fill="#d6b4c8" />
      <rect x={134} y={H * 0.56} width={80} height={H * 0.44} fill="#c8d6b0" />
      {[0, 1].map((r) =>
        [0, 1].map((c) => (
          <rect key={`${r}${c}`} x={76 + c * 26} y={H * 0.46 + r * 28} width={16} height={18} fill={CREAM} opacity={0.8} />
        )),
      )}
      <circle cx={30} cy={H * 0.48} r={20} fill="#9ccf7a" />
      <rect x={27} y={H * 0.56} width={6} height={30} fill="#9b6a44" />
      <rect x={0} y={H - 14} width={W} height={14} fill="#bdbdbd" />
    </>
  );
}

/** The flower colours come from the shared families, so the garden matches the shop's paints. */
const bloom = (k: 'berry' | 'honey' | 'lavender') => mix(COLOR_FAMILIES[k].base, COLOR_FAMILIES[k].accent, 0.55);

/**
 * Garden: a sunny back garden: a hill, a round tree, a cream picket fence, flowers along the
 * bottom in three colours, and a butterfly.
 */
function GardenView() {
  // Four petals round a centre; flowers of one colour share one path.
  const flower = (x: number, y: number) =>
    [
      [0, -4],
      [4, 0],
      [0, 4],
      [-4, 0],
    ]
      .map(([dx, dy]) => ellipsePath(x + dx!, y + dy!, 4))
      .join('');
  const spots: readonly [number, number, 'berry' | 'honey' | 'lavender'][] = [
    [72, 120, 'berry'],
    [94, 128, 'honey'],
    [118, 118, 'lavender'],
    [140, 128, 'berry'],
    [160, 119, 'honey'],
    [184, 127, 'lavender'],
    [204, 118, 'berry'],
    [14, 130, 'honey'],
    [44, 132, 'lavender'],
  ];
  const pickets = Array.from({ length: 10 }, (_, i) => 64 + i * 16)
    .map((x) => `M${x} 124V100l5 -6l5 6V124Z`)
    .join('');
  return (
    <>
      <circle cx={W - 34} cy={30} r={14} fill="#fff3a6" />
      <path d={cloud(22, 40)} fill="#fff" />
      <path d={`M0 92Q60 68 120 86T${W} 78V${H}H0Z`} fill="#c8e3a8" />
      <rect x={37} y={82} width={7} height={40} fill="#9b6a44" />
      <circle cx={40} cy={74} r={24} fill="#9ccf7a" />
      <circle cx={32} cy={66} r={9} fill="#b5dd96" />
      <path d={`${pickets}M60 104h${W}v4H60Z M60 116h${W}v4H60Z`} fill={CREAM} opacity={0.95} />
      <path
        d={`M0 124q14 -10 28 0t28 0t28 0t28 0t28 0t28 0t28 0t28 0V${H}H0Z`}
        fill="#a8d88a"
      />
      <path
        d={spots.map(([x, y]) => `M${x} ${y + 4}v10`).join('')}
        stroke="#7fb85f"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {(['berry', 'honey', 'lavender'] as const).map((k) => (
        <path key={k} d={spots.filter((s) => s[2] === k).map(([x, y]) => flower(x, y)).join('')} fill={bloom(k)} />
      ))}
      <path d={spots.map(([x, y]) => ellipsePath(x, y, 2.4)).join('')} fill="#fff3a6" />
      {/* butterfly: two pairs of wings and a little body, over the hill */}
      <path
        d={`M150 58q-12 -12 -14 2q2 8 14 0Z M150 58q12 -12 14 2q-2 8 -14 0Z M150 59q-9 4 -8 10q5 2 8 -8Z M150 59q9 4 8 10q-5 2 -8 -8Z`}
        fill={bloom('lavender')}
      />
      <rect x={149} y={52} width={2.4} height={14} rx={1.2} fill="#6b5a8a" />
    </>
  );
}

/** The Starry Night wallpaper's dusk, so the two belong to one evening. */
const NIGHT = '#5b5f9f';
const NIGHT_LOW = '#6c6aa8';
const STAR = '#ffe7a0';
const MOON = '#fff1bf';

/**
 * Moonlit: a calm evening: a round moon with a soft halo, gold stars, and the houses across the
 * road with warm lit windows (so the dark reads as cosy, not scary). Two stars twinkle slowly.
 */
function MoonlitView() {
  const stars: readonly [number, number, number][] = [
    [26, 26, 5],
    [76, 16, 4],
    [112, 44, 5],
    [58, 58, 3.5],
    [196, 88, 4],
    [134, 14, 3.5],
  ];
  const starStroke = { stroke: STAR, strokeWidth: 1.5, strokeLinejoin: 'round' as const };
  const HOUSE = '#474a86';
  const HOUSE_FAR = '#55589a';
  const LIT = '#ffd98a';
  return (
    <>
      <rect y={H * 0.62} width={W} height={H * 0.38} fill={NIGHT_LOW} />
      <path d={ellipsePath(168, 40, 28)} fill={MOON} opacity={0.22} />
      <circle cx={168} cy={40} r={17} fill={MOON} />
      <path d={ellipsePath(162, 35, 3.5) + ellipsePath(174, 46, 2.6)} fill="#f0dfa4" />
      <path d={stars.slice(2).map(([x, y, r]) => starPath(x, y, r)).join('')} fill={STAR} {...starStroke} />
      {stars.slice(0, 2).map(([x, y, r], i) => (
        <path
          key={i}
          className="decor-twinkle"
          style={{ animationDelay: `${-i * 2}s` }}
          d={starPath(x, y, r)}
          fill={STAR}
          {...starStroke}
        />
      ))}
      {/* far roofs, then two near houses with pitched roofs and a round tree */}
      <path d={`M0 104h30l14 -12l14 12h40V${H}H0Z M150 108h20l12 -10l12 10h20V${H}H150Z`} fill={HOUSE_FAR} />
      <path d={`M8 ${H}V92l32 -26l32 26V${H}Z M124 ${H}V100l30 -24l30 24V${H}Z`} fill={HOUSE} />
      <circle cx={100} cy={108} r={18} fill="#4b5d8c" />
      <rect x={97} y={116} width={6} height={20} fill="#3e4274" />
      <path
        d={[
          [22, 100],
          [46, 100],
          [22, 120],
          [138, 108],
          [162, 108],
          [162, 128],
        ]
          .map(([x, y]) => `M${x} ${y}h12v14h-12Z`)
          .join('')}
        fill={LIT}
      />
      <rect y={H - 14} width={W} height={14} fill="#43457a" />
    </>
  );
}

/** Flake positions over one window height; the drift draws them twice, one height apart. */
const FLAKES: readonly [number, number, number][] = [
  [14, 12, 3],
  [52, 30, 2.5],
  [88, 8, 3],
  [128, 26, 2.5],
  [170, 14, 3],
  [202, 40, 2.5],
  [30, 62, 2.5],
  [70, 80, 3],
  [112, 58, 3],
  [150, 76, 2.5],
  [190, 96, 3],
  [20, 110, 3],
  [96, 118, 2.5],
  [138, 132, 3],
  [60, 142, 2.5],
];

/**
 * Snowy: a winter garden: snowy hills, two snow-capped pines, a friendly snowman in a Berry
 * scarf. Experiment (ART_GUIDE §4): snow drifts slowly down past the glass (still under reduced
 * motion).
 */
function SnowyView() {
  const SNOW = '#fbfdff';
  const SNOW_SHADE = '#dfe8f2';
  const PINE = '#8db59c';
  const pine = (x: number, base: number, s: number) =>
    [0, 1, 2]
      .map((i) => {
        const w = (22 - i * 5) * s;
        const y = base - i * 14 * s;
        return `M${f(x - w)} ${f(y)}L${f(x)} ${f(y - 22 * s)}L${f(x + w)} ${f(y)}Z`;
      })
      .join('');
  const caps = (x: number, base: number, s: number) =>
    [0, 1, 2]
      .map((i) => {
        const y = base - i * 14 * s - 22 * s;
        const w = 7 * s;
        return `M${f(x - w)} ${f(y + 9 * s)}L${f(x)} ${f(y)}L${f(x + w)} ${f(y + 9 * s)}Q${f(x)} ${f(y + 6 * s)} ${f(x - w)} ${f(y + 9 * s)}Z`;
      })
      .join('');
  const flakes = (dy: number) => FLAKES.map(([x, y, r]) => ellipsePath(x, y + dy, r)).join('');
  const scarf = mix(COLOR_FAMILIES.berry.base, COLOR_FAMILIES.berry.accent, 0.6);
  return (
    <>
      <path d={`M0 98Q50 78 110 94T${W} 86V${H}H0Z`} fill={SNOW_SHADE} />
      <rect x={34} y={104} width={6} height={14} fill="#9b6a44" />
      <path d={pine(37, 106, 1)} fill={PINE} />
      <path d={caps(37, 106, 1)} fill={SNOW} />
      <rect x={185} y={102} width={5} height={12} fill="#9b6a44" />
      <path d={pine(187.5, 104, 0.8)} fill={PINE} />
      <path d={caps(187.5, 104, 0.8)} fill={SNOW} />
      <path d={`M0 126Q40 112 90 122T${W} 118V${H}H0Z`} fill={SNOW} />
      {/* snowman: body, head, twig arms, coal eyes, carrot nose, scarf */}
      <path d="M104 114l-14 -10 M136 114l14 -10" stroke="#9b6a44" strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={120} cy={122} r={16} fill={SNOW} />
      <path d={ellipsePath(126, 126, 8, 10)} fill={SNOW_SHADE} opacity={0.6} />
      <circle cx={120} cy={98} r={11} fill={SNOW} />
      <path d={ellipsePath(116, 96, 1.8) + ellipsePath(124, 96, 1.8)} fill="#2b2b3a" />
      <path d="M120 99l8 2.5l-8 1.5Z" fill={AWNING} />
      <path d="M109 106q11 5 22 0v4q-11 5 -22 0Z M124 108h5v11h-5Z" fill={scarf} />
      <g className="decor-snow">
        <path d={flakes(0) + flakes(-H)} fill="#ffffff" opacity={0.9} />
      </g>
    </>
  );
}

const VIEWS: Record<string, { glass: string; View: () => ReactElement }> = {
  street: { glass: '#cfeaff', View: StreetView },
  garden: { glass: '#cfeaff', View: GardenView },
  moonlit: { glass: NIGHT, View: MoonlitView },
  snowy: { glass: '#dbe7f2', View: SnowyView },
  // The Street redesign mocks (owner picks one; not in the catalog, shown by `?decor&mocks`).
  ...Object.fromEntries(STREET_MOCKS.map((m) => [m.item, { glass: m.glass, View: m.View }])),
};

/** The café's own street window (the free default). */
export function StreetWindow() {
  return (
    <g data-slot="window">
      <Frame glass={VIEWS.street!.glass} clipId="win-street">
        <StreetView />
      </Frame>
    </g>
  );
}

/** The equipped window, or its labelled stand-in if it has no art yet (ART_GUIDE §2.7). */
export function Window({ look }: { look: DecorLook }) {
  const v = VIEWS[look.item];
  if (!v) return <WindowStandIn look={look} />;
  return (
    <g data-decor="window" data-item={look.item}>
      <Frame glass={v.glass} clipId={`win-${look.item}`}>
        <v.View />
      </Frame>
    </g>
  );
}
