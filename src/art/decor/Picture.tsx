// The picture of one decor entry in the shop (SPEC §10): on its shelf tile, on the confirm card and
// rising out of a delivery crate. It is the real drawing, cropped to where the item sits in the
// café, with just enough of the room around it (wainscot, the bar's trim, the café's own wall) to
// read as "this goes here". Pictures are still: the live preview in the café shows the motion,
// and still art costs nothing against the moving budget (SPEC §2.4). Items not drawn yet show a
// swatch in their colours, as in M4a.
import type { ReactNode } from 'react';
import { BAR_H } from '../../app/metrics';
import type { DecorSlot } from '../../engine/economy';
import { Boards, CLASSIC_BOARDS, Floor, FLOOR_DRAWN } from './Floor';
import { Lights, LIGHTS_DRAWN } from './Lights';
import { CAFE } from './paint';
import type { DecorLook } from './StandIn';
import { PaintedStripe, Wallpaper, WALLPAPER_DRAWN } from './Wallpaper';
import { StreetWindow, Window, WINDOW_DRAWN } from './Window';
import './decor.css';

/** A crop of the stage, [x, y, w] with height w × 0.8 (the tile picture is 5 : 4). */
type Crop = readonly [number, number, number];

/** Where each slot's picture looks, with per-item crops where the interest sits elsewhere. */
const CROPS: Partial<Record<DecorSlot, { slot: Crop; items?: Record<string, Crop> }>> = {
  // A patch of wall with the top of the wainscot under it.
  wallpaper: {
    slot: [790, 120, 200],
    items: { 'starry-night': [380, 120, 200], rainbow: [262, 144, 150] },
  },
  // The near edge of the floor under a strip of wainscot, centred where the tiles run straight.
  floor: { slot: [565, 318, 150] },
  // Close on the lights, hanging from the bar (its cream and wooden trim show above them).
  lights: {
    slot: [795, 100, 130],
    items: {
      'paper-lanterns': [824, 88, 162],
      'disco-ball': [930, 106, 140],
      'star-chandelier': [925, 100, 150],
    },
  },
  // The whole window with a margin of wall.
  window: { slot: [196, 126, 238] },
};

const DRAWN: Partial<Record<DecorSlot, ReadonlySet<string>>> = {
  wallpaper: WALLPAPER_DRAWN,
  floor: FLOOR_DRAWN,
  lights: LIGHTS_DRAWN,
  window: WINDOW_DRAWN,
};

const WAINSCOT = 262;
const FLOOR_Y = 330;

function CafeWall() {
  return <PaintedStripe a={CAFE.wallA} b={CAFE.wallB} />;
}

/** The wainscot and its trim, as the scene draws them. */
function Wainscot() {
  return (
    <>
      <rect x={-1000} y={WAINSCOT} width={3280} height={FLOOR_Y - WAINSCOT} fill={CAFE.panel} />
      <rect x={-1000} y={WAINSCOT - 6} width={3280} height={8} fill={CAFE.trim} />
    </>
  );
}

/** The bottom of the status bar the lights hang from: its cream board, wooden trim and shadow. */
function BarTrim() {
  return (
    <>
      <rect x={-1000} y={-600} width={3280} height={600 + BAR_H} fill="#f7e6c4" />
      <rect x={-1000} y={BAR_H - 10} width={3280} height={10} fill="#b98352" />
      <rect x={-1000} y={BAR_H} width={3280} height={4} fill="rgba(0,0,0,0.1)" />
    </>
  );
}

/** The item in its corner of the room; `free` draws the café's own default for the slot. */
function Scene({ look, free }: { look: DecorLook; free: boolean }): ReactNode {
  switch (look.slot) {
    case 'wallpaper':
      return (
        <>
          {free ? <CafeWall /> : <Wallpaper look={look} />}
          <Wainscot />
        </>
      );
    case 'floor':
      return (
        <>
          <Wainscot />
          {free ? <Boards {...CLASSIC_BOARDS} /> : <Floor look={look} />}
        </>
      );
    case 'lights':
      return (
        <>
          <CafeWall />
          <Wainscot />
          <BarTrim />
          <Lights look={look} />
        </>
      );
    case 'window':
      return (
        <>
          <CafeWall />
          <Wainscot />
          {/* the backing the scene puts behind the window, so the wall doesn't show through */}
          <rect x={208} y={142} width={214} height={150} rx={8} fill={CAFE.wallA} />
          {free ? <StreetWindow /> : <Window look={look} />}
        </>
      );
    default:
      return null;
  }
}

/** Swatch of an entry without a drawing yet: its colours in a dashed, rounded card. */
function Swatch({ look }: { look: DecorLook }) {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true">
      <rect
        x={4}
        y={4}
        width={92}
        height={72}
        rx={12}
        fill={look.base}
        stroke={look.accent}
        strokeWidth={5}
        strokeDasharray="10 6"
      />
      <circle cx={30} cy={30} r={9} fill={look.accent} opacity={0.6} />
      <circle cx={70} cy={50} r={9} fill={look.accent} opacity={0.6} />
    </svg>
  );
}

/** True when the entry has a real drawing (or is a slot's free default, which the café draws). */
export function hasPicture(look: DecorLook, free = false): boolean {
  if (!CROPS[look.slot]) return false;
  return free || (DRAWN[look.slot]?.has(look.item) ?? false);
}

/**
 * The shop's picture of an entry. `free` marks the slot's free default (price 0), which the café
 * draws with its own wall, boards or street window rather than from the colour pair.
 */
export function DecorPicture({ look, free = false }: { look: DecorLook; free?: boolean }) {
  const crop = CROPS[look.slot];
  if (!crop || !hasPicture(look, free)) return <Swatch look={look} />;
  const [x, y, w] = crop.items?.[look.item] ?? crop.slot;
  return (
    <span className="decor-pic" data-pic={look.item}>
      <svg
        viewBox={`${x} ${y} ${w} ${w * 0.8}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <Scene look={look} free={free} />
      </svg>
    </span>
  );
}
