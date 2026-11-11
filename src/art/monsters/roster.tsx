// The six hand-authored regulars (SPEC §7.2). viewBox 0 0 200 200, feet on y ≈ 190. Each drawing
// is static SVG; the expression only swaps face parts, and motion lives in monsters.css so reduced
// motion leaves a still pose.
import type { ReactElement } from 'react';
import { Cheeks, Eye, Mouth } from './face';
import type { Expression, MonsterSpec } from './specs';
import { INK } from './specs';

export interface DrawProps {
  e: Expression;
  s: MonsterSpec;
  react: boolean;
}

const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const };

/** Blobbo: green one-eyed blob, shy giggler. */
function Blobbo({ e, s, react }: DrawProps) {
  const p = s.palette;
  return (
    <g>
      <ellipse cx={72} cy={184} rx={18} ry={9} fill={p.accent} />
      <ellipse cx={128} cy={184} rx={18} ry={9} fill={p.accent} />
      <ellipse cx={40} cy={128} rx={11} ry={20} fill={p.body} transform="rotate(30 40 128)" {...line} />
      <ellipse cx={160} cy={128} rx={11} ry={20} fill={p.body} transform="rotate(-30 160 128)" {...line} />
      <path
        d="M38 172 C22 124 30 52 100 48 C170 52 178 124 162 172 Q131 186 100 176 Q69 186 38 172 Z"
        fill={p.body}
        {...line}
      />
      <ellipse cx={100} cy={150} rx={40} ry={22} fill={p.belly} />
      <path d="M86 52 Q90 36 100 32 Q104 42 98 50" fill={p.accent} {...line} strokeWidth={2.5} />
      <g className="m-eyes">
        <Eye cx={100} cy={92} r={26} e={e} brow="up" />
      </g>
      <Cheeks pts={[[62, 118], [138, 118]]} r={10} e={e} />
      {/* Shy giggle (monsters.css): a deep blush with little blush strokes, inside the figure so it
          hops along with him. */}
      {react && (
        <g className="m-blush">
          <ellipse cx={60} cy={118} rx={15} ry={9} fill="#ff7fa8" opacity={0.85} />
          <ellipse cx={140} cy={118} rx={15} ry={9} fill="#ff7fa8" opacity={0.85} />
          <path
            d="M52 114 l-3 7 M60 114 l-3 7 M68 114 l-3 7 M135 114 l-3 7 M143 114 l-3 7 M151 114 l-3 7"
            stroke="#d6457a"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      )}
      <Mouth cx={100} cy={126} w={24} kind={s.mouth} e={e} />
    </g>
  );
}

/** Gruffles: big purple square with horns and a tail; deep, gentle. */
function Gruffles({ e, s }: DrawProps) {
  const p = s.palette;
  const dark = '#7c52b8';
  return (
    <g>
      <path d="M160 166 Q192 160 188 128" fill="none" stroke={dark} strokeWidth={10} strokeLinecap="round" />
      <circle cx={188} cy={124} r={9} fill={dark} {...line} />
      <rect x={52} y={176} width={34} height={16} rx={8} fill={dark} {...line} />
      <rect x={114} y={176} width={34} height={16} rx={8} fill={dark} {...line} />
      <path d="M54 70 Q28 46 40 14 Q50 42 76 58 Z" fill={p.accent} {...line} />
      <path d="M146 70 Q172 46 160 14 Q150 42 124 58 Z" fill={p.accent} {...line} />
      <rect x={28} y={54} width={144} height={130} rx={36} fill={p.body} {...line} />
      <ellipse cx={100} cy={150} rx={46} ry={30} fill={p.belly} />
      <path d="M44 120 q-14 18 -6 36" fill="none" stroke={dark} strokeWidth={8} strokeLinecap="round" />
      <path d="M156 120 q14 18 6 36" fill="none" stroke={dark} strokeWidth={8} strokeLinecap="round" />
      {/* Bushy brows, always on: Gruffles looks big but kind. */}
      {e !== 'puzzled' && (
        <path d="M64 76 Q76 68 88 76 M112 76 Q124 68 136 76" fill="none" stroke={dark} strokeWidth={6} strokeLinecap="round" />
      )}
      <g className="m-eyes">
        <Eye cx={76} cy={96} r={13} e={e} brow="flat" />
        <Eye cx={124} cy={96} r={13} e={e} brow="up" />
      </g>
      <Cheeks pts={[[54, 118], [146, 118]]} r={9} e={e} />
      <Mouth cx={100} cy={124} w={28} kind={s.mouth} e={e} />
    </g>
  );
}

/** Zibbit: tall orange, three eyes on stalks, speedy. */
function Zibbit({ e, s }: DrawProps) {
  const p = s.palette;
  const stalks: [number, number, number, number][] = [
    [80, 76, 64, 34],
    [100, 72, 100, 22],
    [120, 76, 136, 34],
  ];
  return (
    <g>
      <ellipse cx={82} cy={186} rx={14} ry={7} fill={p.accent} />
      <ellipse cx={118} cy={186} rx={14} ry={7} fill={p.accent} />
      {stalks.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.accent} strokeWidth={7} strokeLinecap="round" />
      ))}
      <path d="M60 116 Q38 128 40 148" fill="none" stroke={p.accent} strokeWidth={6} strokeLinecap="round" />
      <path d="M140 116 Q162 128 160 148" fill="none" stroke={p.accent} strokeWidth={6} strokeLinecap="round" />
      <rect x={56} y={66} width={88} height={122} rx={44} fill={p.body} {...line} />
      <ellipse cx={100} cy={150} rx={28} ry={30} fill={p.belly} />
      <path d="M62 132 Q72 128 70 140 M138 132 Q128 128 130 140" fill="none" stroke={p.accent} strokeWidth={4} strokeLinecap="round" />
      <g className="m-eyes">
        {stalks.map(([, , x, y], i) => (
          <Eye key={i} cx={x} cy={y} r={12} e={e} brow={i === 1 ? 'up' : undefined} lid={p.body} />
        ))}
      </g>
      <Cheeks pts={[[70, 106], [130, 106]]} r={7} e={e} />
      <Mouth cx={100} cy={100} w={22} kind={s.mouth} e={e} />
    </g>
  );
}

/** Mimsy: small pink fluffball with round ears and a bow; tiny and polite. */
function Mimsy({ e, s }: DrawProps) {
  const p = s.palette;
  const cx = 100;
  const cy = 130;
  const bumps = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return [cx + Math.cos(a) * 50, cy + Math.sin(a) * 50] as const;
  });
  return (
    <g>
      <circle cx={62} cy={80} r={22} fill={p.body} {...line} />
      <circle cx={138} cy={80} r={22} fill={p.body} {...line} />
      <circle cx={62} cy={80} r={12} fill={p.accent} opacity={0.6} />
      <circle cx={138} cy={80} r={12} fill={p.accent} opacity={0.6} />
      <ellipse cx={80} cy={186} rx={12} ry={6} fill={p.accent} />
      <ellipse cx={120} cy={186} rx={12} ry={6} fill={p.accent} />
      <g fill={p.body} {...line}>
        {bumps.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={14} />
        ))}
      </g>
      <circle cx={cx} cy={cy} r={54} fill={p.body} />
      <ellipse cx={100} cy={152} rx={28} ry={20} fill={p.belly} />
      <path d="M128 84 l14 -10 l0 20 Z M128 84 l-14 -10 l0 20 Z" fill={p.accent} {...line} strokeWidth={2} transform="translate(8 -2)" />
      <circle cx={136} cy={82} r={4} fill={p.accent} {...line} strokeWidth={2} />
      <g className="m-eyes">
        <Eye cx={84} cy={120} r={10} e={e} brow="up" lashes />
        <Eye cx={116} cy={120} r={10} e={e} brow="flat" lashes />
      </g>
      <Cheeks pts={[[70, 136], [130, 136]]} r={8} e={e} />
      <Mouth cx={100} cy={140} w={16} kind={s.mouth} e={e} />
    </g>
  );
}

/** Chompers: round and blue with spikes and two big front teeth; messy eater. */
function Chompers({ e, s }: DrawProps) {
  const p = s.palette;
  const spikes = [-150, -125, -100, -80, -55, -30].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const at = (r: number, da = 0) => `${100 + Math.cos(a + da) * r} ${116 + Math.sin(a + da) * r}`;
    return `M${at(64, -0.14)} L${at(88)} L${at(64, 0.14)} Z`;
  });
  return (
    <g>
      <g fill={p.accent} {...line}>
        {spikes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <ellipse cx={70} cy={184} rx={20} ry={9} fill={p.accent} {...line} />
      <ellipse cx={130} cy={184} rx={20} ry={9} fill={p.accent} {...line} />
      <circle cx={100} cy={116} r={70} fill={p.body} {...line} />
      <ellipse cx={100} cy={156} rx={44} ry={24} fill={p.belly} />
      <circle cx={60} cy={150} r={4} fill={p.accent} />
      <circle cx={146} cy={142} r={5} fill={p.accent} />
      <g className="m-eyes">
        <Eye cx={76} cy={86} r={15} e={e} brow="flat" />
        <Eye cx={124} cy={86} r={15} e={e} brow="up" />
      </g>
      <Cheeks pts={[[54, 112], [146, 112]]} r={9} e={e} />
      <Mouth cx={100} cy={118} w={42} kind={s.mouth} e={e} teeth="square" />
    </g>
  );
}

/** Wobbleton: a yellow jelly dome with a shine; wobbly and cheerful. */
function Wobbleton({ e, s }: DrawProps) {
  const p = s.palette;
  return (
    <g>
      <path
        d="M30 184 Q22 58 100 48 Q178 58 170 184 Q152 176 135 184 Q118 192 100 184 Q82 176 65 184 Q48 192 30 184 Z"
        fill={p.body}
        {...line}
      />
      <path d="M44 172 Q40 100 70 70" fill="none" stroke={p.accent} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      <ellipse cx={70} cy={80} rx={16} ry={8} fill="#fff" opacity={0.65} transform="rotate(-35 70 80)" />
      <circle cx={88} cy={66} r={4} fill="#fff" opacity={0.65} />
      <circle cx={140} cy={160} r={7} fill={p.belly} opacity={0.8} />
      <circle cx={58} cy={150} r={5} fill={p.belly} opacity={0.8} />
      <circle cx={150} cy={130} r={4} fill={p.belly} opacity={0.8} />
      <g className="m-eyes">
        <Eye cx={80} cy={110} r={13} e={e} brow="up" />
        <Eye cx={120} cy={110} r={13} e={e} brow="flat" />
      </g>
      <Cheeks pts={[[60, 134], [140, 134]]} r={9} e={e} />
      <Mouth cx={100} cy={138} w={22} kind={s.mouth} e={e} />
    </g>
  );
}

export const DRAWINGS: Readonly<Record<string, (p: DrawProps) => ReactElement>> = {
  blobbo: Blobbo,
  gruffles: Gruffles,
  zibbit: Zibbit,
  mimsy: Mimsy,
  chompers: Chompers,
  wobbleton: Wobbleton,
};
