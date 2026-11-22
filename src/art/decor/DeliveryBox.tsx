// The delivery box (SPEC §10.1, M4a). A cardboard box seen from the front and a little above.
// Closed: the two side flaps meet over the top under a strip of tape. Open: the side flaps fold out
// to the sides, the front flap hangs down over the front, and the inside shows. Opening animates
// only transforms: each closed flap swings up to its hinge, then the open flap swings out from it
// (two scales about the hinge), so it costs no layout and reads as one flap flipping over.
// Sparkles are 4-point stars that twinkle while it waits and burst when it opens.

const CARD = '#d9a466';
const CARD_DARK = '#b98352';
const CARD_LIGHT = '#e8bf86';
const INSIDE = '#7a5232';
const TAPE = '#f3dfb4';

/** Box geometry in its 240×190 viewBox; the front face's bottom is the counter edge. */
const L = 50;
const R = 190;
const TOP = 100;
const BOTTOM = 186;
const BACK_L = 64;
const BACK_R = 176;
const BACK = 84;
const MID = (L + R) / 2;

const pts = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(' ');

/** A 4-point star centred on (x, y). */
function Sparkle({ x, y, r, delay, cls }: { x: number; y: number; r: number; delay: number; cls: string }) {
  const k = r * 0.28;
  return (
    <path
      className={cls}
      style={{ animationDelay: `${delay}ms`, transformOrigin: `${x}px ${y}px` }}
      d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z`}
      fill="#ffe27a"
      stroke="#f0b54a"
      strokeWidth={1.5}
    />
  );
}

const SPARKLES: { x: number; y: number; r: number }[] = [
  { x: 24, y: 58, r: 12 },
  { x: 214, y: 46, r: 14 },
  { x: 120, y: 30, r: 10 },
  { x: 30, y: 150, r: 9 },
  { x: 212, y: 140, r: 11 },
];

export type BoxPhase = 'closed' | 'open';

export function DeliveryBox({ phase }: { phase: BoxPhase }) {
  const open = phase === 'open';
  return (
    <svg viewBox="0 0 240 190" width="100%" height="100%" overflow="visible" aria-hidden="true" className={`dbox ${phase}`}>
      {/* shadow on the counter */}
      <ellipse cx={MID} cy={BOTTOM + 2} rx={86} ry={7} fill="rgba(0,0,0,0.16)" />
      {/* inside (seen once open) and the top face */}
      <polygon points={pts([[L, TOP], [R, TOP], [BACK_R, BACK], [BACK_L, BACK]])} fill={open ? INSIDE : CARD_LIGHT} />
      {/* front face */}
      <rect x={L} y={TOP} width={R - L} height={BOTTOM - TOP} rx={3} fill={CARD} />
      <rect x={L} y={BOTTOM - 10} width={R - L} height={10} rx={3} fill={CARD_DARK} opacity={0.5} />
      {/* closed: two flaps meeting in the middle, taped */}
      <g className="dbox-closed">
        <g className="dbox-flap-l-closed" style={{ transformOrigin: `${(L + BACK_L) / 2}px ${(TOP + BACK) / 2}px` }}>
          <polygon points={pts([[L, TOP], [BACK_L, BACK], [MID, BACK], [MID, TOP]])} fill={CARD_LIGHT} stroke={CARD_DARK} strokeWidth={1.5} />
        </g>
        <g className="dbox-flap-r-closed" style={{ transformOrigin: `${(R + BACK_R) / 2}px ${(TOP + BACK) / 2}px` }}>
          <polygon points={pts([[R, TOP], [BACK_R, BACK], [MID, BACK], [MID, TOP]])} fill={CARD_LIGHT} stroke={CARD_DARK} strokeWidth={1.5} />
        </g>
        <g className="dbox-tape">
          <rect x={MID - 9} y={BACK} width={18} height={TOP - BACK} fill={TAPE} />
          <rect x={MID - 9} y={TOP} width={18} height={30} fill={TAPE} />
        </g>
      </g>
      {/* open: side flaps folded out to the sides, front flap hanging down over the front */}
      <g className="dbox-open">
        <g className="dbox-flap-l-open" style={{ transformOrigin: `${(L + BACK_L) / 2}px ${(TOP + BACK) / 2}px` }}>
          <polygon points={pts([[L, TOP], [BACK_L, BACK], [16, 92], [4, 112]])} fill={CARD_LIGHT} stroke={CARD_DARK} strokeWidth={1.5} />
        </g>
        <g className="dbox-flap-r-open" style={{ transformOrigin: `${(R + BACK_R) / 2}px ${(TOP + BACK) / 2}px` }}>
          <polygon points={pts([[R, TOP], [BACK_R, BACK], [224, 92], [236, 112]])} fill={CARD_LIGHT} stroke={CARD_DARK} strokeWidth={1.5} />
        </g>
        <g className="dbox-flap-front" style={{ transformOrigin: `${MID}px ${TOP}px` }}>
          <polygon points={pts([[L, TOP], [R, TOP], [R - 3, TOP + 26], [L + 3, TOP + 26]])} fill={CARD_DARK} />
        </g>
      </g>
      {SPARKLES.map((s, i) => (
        <Sparkle key={i} {...s} delay={i * 260} cls={open ? 'dbox-burst' : 'dbox-twinkle'} />
      ))}
    </svg>
  );
}
