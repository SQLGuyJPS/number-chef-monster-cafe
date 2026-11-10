// Shared face parts for the hand-authored monsters (SPEC §7.2). Each monster places them; the
// expression decides their shape, so all five expressions read the same way on every monster.
import type { Expression } from './specs';
import { INK } from './specs';

const TONGUE = '#ff7b93';
const CHEEK = '#ff8fa3';

const stroke = (w: number) => ({
  fill: 'none',
  stroke: INK,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/**
 * One eye. Open (round, pupil, highlight) for idle and puzzled; happy arcs for delight; squeezed
 * chevrons while eating; closed lids with lashes when sleepy. `brow` adds a raised brow (puzzled).
 */
export function Eye({
  cx,
  cy,
  r,
  e,
  brow,
  lashes,
  lid,
}: {
  cx: number;
  cy: number;
  r: number;
  e: Expression;
  brow?: 'up' | 'flat';
  lashes?: boolean;
  /** Eyelid colour: closed eyes on stalks keep their eyeball shape, so they still read as eyes. */
  lid?: string;
}) {
  const w = Math.max(3, r * 0.3);
  if (lid && e !== 'idle' && e !== 'puzzled') {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={lid} stroke={INK} strokeWidth={Math.max(2, r * 0.12)} />
        <Eye cx={cx} cy={cy + r * 0.1} r={r * 0.75} e={e} lashes={lashes} />
      </g>
    );
  }
  if (e === 'delight') {
    return <path d={`M${cx - r * 0.85} ${cy + r * 0.25} Q${cx} ${cy - r} ${cx + r * 0.85} ${cy + r * 0.25}`} {...stroke(w)} />;
  }
  if (e === 'eat') {
    return <path d={`M${cx - r * 0.75} ${cy - r * 0.35} L${cx} ${cy + r * 0.1} L${cx + r * 0.75} ${cy - r * 0.35}`} {...stroke(w)} />;
  }
  if (e === 'sleepy') {
    const y = cy + r * 0.1;
    return (
      <g>
        <path d={`M${cx - r * 0.85} ${y} Q${cx} ${y + r * 0.75} ${cx + r * 0.85} ${y}`} {...stroke(w)} />
        {lashes && (
          <path
            d={`M${cx - r * 0.5} ${y + r * 0.45} l-${r * 0.2} ${r * 0.35} M${cx + r * 0.5} ${y + r * 0.45} l${r * 0.2} ${r * 0.35}`}
            {...stroke(w * 0.6)}
          />
        )}
      </g>
    );
  }
  // Puzzled: the pupil looks up and aside, as if thinking it over (never cross).
  const px = cx + (e === 'puzzled' ? r * 0.28 : 0);
  const py = cy + (e === 'puzzled' ? -r * 0.28 : r * 0.08);
  return (
    <g>
      {lashes && (
        <path
          d={`M${cx - r * 0.7} ${cy - r * 0.7} l-${r * 0.3} -${r * 0.3} M${cx} ${cy - r} l0 -${r * 0.35} M${cx + r * 0.7} ${cy - r * 0.7} l${r * 0.3} -${r * 0.3}`}
          {...stroke(w * 0.6)}
        />
      )}
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={INK} strokeWidth={Math.max(2, r * 0.12)} />
      <circle cx={px} cy={py} r={r * 0.5} fill={INK} />
      <circle cx={px + r * 0.18} cy={py - r * 0.2} r={r * 0.17} fill="#fff" />
      {e === 'puzzled' && brow && (
        <path
          d={
            brow === 'up'
              ? `M${cx - r * 0.8} ${cy - r * 1.35} Q${cx} ${cy - r * 2} ${cx + r * 0.8} ${cy - r * 1.5}`
              : `M${cx - r * 0.75} ${cy - r * 1.3} L${cx + r * 0.75} ${cy - r * 1.3}`
          }
          {...stroke(w * 0.8)}
        />
      )}
    </g>
  );
}

export type MouthKind = 'smile' | 'wide' | 'toothy' | 'tiny';

/**
 * The mouth. `teeth`: 'fangs' (two small points) or 'square' (two big front teeth, Chompers).
 * Eating opens it wide with the `m-chew` class (3 chews, monsters.css).
 */
export function Mouth({
  cx,
  cy,
  w,
  kind,
  e,
  teeth = 'fangs',
}: {
  cx: number;
  cy: number;
  w: number;
  kind: MouthKind;
  e: Expression;
  teeth?: 'fangs' | 'square';
}) {
  const sw = Math.max(3.5, w * 0.16);
  const toothy = kind === 'toothy';
  const half = kind === 'tiny' ? w * 0.45 : w;

  if (e === 'eat') {
    return (
      <g className="m-chew">
        <ellipse cx={cx} cy={cy + w * 0.3} rx={w * 0.62} ry={w * 0.62} fill={INK} />
        <ellipse cx={cx} cy={cy + w * 0.62} rx={w * 0.38} ry={w * 0.22} fill={TONGUE} />
      </g>
    );
  }
  if (e === 'sleepy') {
    return <ellipse cx={cx} cy={cy + w * 0.12} rx={w * 0.16} ry={w * 0.2} fill={INK} />;
  }
  if (e === 'puzzled') {
    const h = half * 0.55;
    return <path d={`M${cx - h} ${cy + 4} Q${cx - h / 2} ${cy - 4} ${cx} ${cy + 4} T${cx + h} ${cy + 4}`} {...stroke(sw * 0.85)} />;
  }
  const open = e === 'delight' || kind === 'wide';
  if (open) {
    const depth = (e === 'delight' ? 1.0 : 0.75) * half;
    return (
      <g>
        <path d={`M${cx - half} ${cy} Q${cx} ${cy + depth * 1.4} ${cx + half} ${cy} Z`} fill={INK} stroke={INK} strokeWidth={sw * 0.6} strokeLinejoin="round" />
        <ellipse cx={cx} cy={cy + depth * 0.5} rx={half * 0.45} ry={depth * 0.22} fill={TONGUE} />
        {toothy && <Teeth cx={cx} cy={cy} half={half} style={teeth} />}
      </g>
    );
  }
  return (
    <g>
      <path d={`M${cx - half} ${cy} Q${cx} ${cy + half * 0.8} ${cx + half} ${cy}`} {...stroke(sw)} />
      {toothy && <Teeth cx={cx} cy={cy + half * 0.12} half={half} style={teeth} />}
    </g>
  );
}

function Teeth({ cx, cy, half, style }: { cx: number; cy: number; half: number; style: 'fangs' | 'square' }) {
  if (style === 'square') {
    const tw = half * 0.34;
    return (
      <g fill="#fff" stroke={INK} strokeWidth={2}>
        <rect x={cx - tw - 1} y={cy + half * 0.18} width={tw} height={tw * 1.05} rx={3} />
        <rect x={cx + 1} y={cy + half * 0.18} width={tw} height={tw * 1.05} rx={3} />
      </g>
    );
  }
  const t = half * 0.22;
  return (
    <g fill="#fff" stroke={INK} strokeWidth={1.5} strokeLinejoin="round">
      <path d={`M${cx - half * 0.55} ${cy + half * 0.2} l${t} 0 l-${t / 2} ${t * 1.2} Z`} />
      <path d={`M${cx + half * 0.55 - t} ${cy + half * 0.2} l${t} 0 l-${t / 2} ${t * 1.2} Z`} />
    </g>
  );
}

/** Rosy cheeks when delighted or eating. */
export function Cheeks({ pts, r, e }: { pts: [number, number][]; r: number; e: Expression }) {
  if (e !== 'delight' && e !== 'eat') return null;
  return (
    <g fill={CHEEK} opacity={0.7}>
      {pts.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.6} />
      ))}
    </g>
  );
}

/** Sleepy (closed-café art): three z's drifting up and right of the head. */
export function Zzz({ x, y }: { x: number; y: number }) {
  const z = (dx: number, dy: number, s: number) => `M${x + dx} ${y + dy} h${s} l-${s} ${s} h${s}`;
  return (
    <g className="m-zzz" {...stroke(3.5)} stroke="#5b6b9a">
      <path d={z(0, 0, 10)} />
      <path d={z(16, -20, 14)} />
      <path d={z(36, -46, 18)} />
    </g>
  );
}
