// Labelled stand-in shapes for shop decor (SPEC §7.4: missing art falls back to a labelled
// placeholder; M4a ships only these, M4b draws the real pieces, D155). Each draws inside its slot
// rect (DECOR in metrics.ts) in the item's colours, with its name on a small tag, so the owner can
// check slots, colours and layering before any art exists. Still shapes only: no animation.
import { DECOR, type Rect } from '../../app/metrics';
import type { DecorSlot } from '../../engine/economy';

/** What the scene needs to draw one equipped (or previewed) entry. */
export interface DecorLook {
  slot: DecorSlot;
  item: string;
  name: string;
  base: string;
  accent: string;
}

const INK = '#5b4a3a';

function Tag({ x, y, text }: { x: number; y: number; text: string }) {
  const w = Math.max(60, text.length * 9 + 20);
  return (
    <g className="decor-tag">
      <rect x={x - w / 2} y={y - 14} width={w} height={26} rx={13} fill="#fffaf0" opacity={0.92} stroke={INK} strokeWidth={1.5} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontFamily="Andika, sans-serif" fontWeight={700} fill={INK}>
        {text}
      </text>
    </g>
  );
}

/** Wallpaper: the wall in the item's base colour with an accent pattern, past the safe box. */
export function WallpaperStandIn({ look }: { look: DecorLook }) {
  const r = DECOR.wallpaper;
  // Unique per colour too: the contact sheet draws many cafés on one page, and ids are page-wide.
  const id = `w-${look.item}-${look.base.slice(1)}-${look.accent.slice(1)}`;
  return (
    <g data-decor="wallpaper" data-item={look.item}>
      <defs>
        <pattern id={id} width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill={look.base} />
          <circle cx="15" cy="15" r="5" fill={look.accent} opacity={0.35} />
          <circle cx="45" cy="45" r="5" fill={look.accent} opacity={0.35} />
        </pattern>
      </defs>
      <rect x={-1000} y={-600} width={3280} height={r.y + r.h + 600} fill={`url(#${id})`} />
      <Tag x={1000} y={240} text={`Wallpaper: ${look.name}`} />
    </g>
  );
}

export function FloorStandIn({ look }: { look: DecorLook }) {
  const r = DECOR.floor;
  return (
    <g data-decor="floor" data-item={look.item}>
      <rect x={-1000} y={r.y} width={3280} height={300} fill={look.base} />
      {Array.from({ length: 70 }, (_, i) => (
        <rect key={i} x={-1000 + i * 48} y={r.y + (i % 2) * 24} width={24} height={24} fill={look.accent} opacity={0.25} />
      ))}
      <rect x={-1000} y={r.y} width={3280} height={5} fill="rgba(0,0,0,0.08)" />
      <Tag x={900} y={r.y + 60} text={`Floor: ${look.name}`} />
    </g>
  );
}

function Box({ r, look, label, dashed = true }: { r: Rect; look: DecorLook; label: string; dashed?: boolean }) {
  return (
    <g data-decor={look.slot} data-item={look.item}>
      <rect
        x={r.x}
        y={r.y}
        width={r.w}
        height={r.h}
        rx={10}
        fill={look.base}
        stroke={look.accent}
        strokeWidth={4}
        strokeDasharray={dashed ? '10 7' : undefined}
      />
      <Tag x={r.x + r.w / 2} y={r.y + r.h / 2} text={label} />
    </g>
  );
}

export function WindowStandIn({ look }: { look: DecorLook }) {
  return <Box r={DECOR.window} look={look} label={`Window: ${look.name}`} dashed={false} />;
}

export function WallArtStandIn({ look }: { look: DecorLook }) {
  return <Box r={DECOR.wallArt} look={look} label={look.name} />;
}

/** Counter-top: stands on the counter's far edge, so its foot overlaps the edge strip. */
export function CounterTopStandIn({ look }: { look: DecorLook }) {
  const r = DECOR.counter;
  return (
    <g>
      <ellipse cx={r.x + r.w / 2} cy={r.y + r.h - 2} rx={r.w / 2} ry={7} fill="rgba(0,0,0,0.15)" />
      <Box r={{ ...r, h: r.h - 6 }} look={look} label={look.name} />
    </g>
  );
}

/** Lights: two swags of round bulbs on a cord, left and right of the wall art. */
export function LightsStandIn({ look }: { look: DecorLook }) {
  const swag = (r: Rect) => {
    const n = 7;
    return (
      <g>
        <path
          d={`M${r.x} ${r.y + 4} Q ${r.x + r.w / 2} ${r.y + r.h} ${r.x + r.w} ${r.y + 4}`}
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeDasharray="6 5"
        />
        {Array.from({ length: n }, (_, i) => {
          const t = (i + 1) / (n + 1);
          const x = r.x + t * r.w;
          const y = (1 - t) * (1 - t) * (r.y + 4) + 2 * (1 - t) * t * (r.y + r.h) + t * t * (r.y + 4);
          return <circle key={i} cx={x} cy={y + 8} r={9} fill={i % 2 ? look.base : look.accent} stroke={look.accent} strokeWidth={2} />;
        })}
      </g>
    );
  };
  return (
    <g data-decor="lights" data-item={look.item}>
      {swag(DECOR.lightsLeft)}
      {swag(DECOR.lightsRight)}
      <Tag x={DECOR.lightsLeft.x + 110} y={DECOR.lightsLeft.y + 16} text={`Lights: ${look.name}`} />
    </g>
  );
}
