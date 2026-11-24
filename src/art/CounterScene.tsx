// Over-the-counter café (layout mock, `?mock`). Same flat, muted style as CafeScene; only the
// camera moves: the child stands behind the counter, looking across it into the room. Back wall
// with the front door and one street window, one table with two chairs on the floor, the counter
// top filling the bottom band. Stage coordinates (1280×720); every layer runs far past the safe box
// so the bleed on wide phones and tall iPads is filled.
import { BAR_H, COUNTER_Y } from '../app/metrics';
import type { DecorSlot } from '../engine/economy';
import { CounterTopStandIn, WallArtStandIn, type DecorLook } from './decor/StandIn';
import { Boards, CLASSIC_BOARDS, Floor } from './decor/Floor';
import { Lights } from './decor/Lights';
import { StreetWindow, Window } from './decor/Window';
import { PaintedStripe, Wallpaper } from './decor/Wallpaper';
import { CAFE } from './decor/paint';

/** What the café shows per slot; a missing slot draws the café's own default look. */
export type DecorView = Partial<Record<DecorSlot, DecorLook>>;

const { wallA: WALL_A, wallB: WALL_B, panel: PANEL, trim: TRIM } = CAFE;
const WOOD = '#b98352';
const WOOD_DARK = '#8a5a35';
const COUNTER_TOP = '#d9a066';
const COUNTER_GRAIN = '#c98f58';

export function CounterScene({ decor = {} }: { decor?: DecorView }) {
  // The wainscot ends and the floor starts here; the back wall is far away, so things are small.
  const FLOOR_Y = 330;
  const WAINSCOT = FLOOR_Y - 68;
  return (
    <svg className="cafe-scene" viewBox="0 0 1280 720" width="1280" height="720" aria-hidden="true">
      {/* back wall (the free Plain Paint, Sunny), wainscot, floor (the free Wood, classic): the
          same drawings the shop's recolours use (D152) */}
      {decor.wallpaper ? <Wallpaper look={decor.wallpaper} /> : <PaintedStripe a={WALL_A} b={WALL_B} />}
      <rect x={-1000} y={WAINSCOT} width={3280} height={FLOOR_Y - WAINSCOT} fill={PANEL} />
      <rect x={-1000} y={WAINSCOT - 6} width={3280} height={8} fill={TRIM} />
      {decor.floor ? <Floor look={decor.floor} /> : <Boards {...CLASSIC_BOARDS} />}

      {/* The door and window are drawn a little see-through to sit back in the room; a backing in
          the café's own wall colour keeps a bought wallpaper from showing through their glass. */}
      <rect x={36} y={124} width={148} height={FLOOR_Y - 124} rx={5} fill={WALL_A} />
      <rect x={31} y={119} width={158} height={12} rx={4} fill={WALL_A} />
      <rect x={208} y={142} width={214} height={150} rx={8} fill={WALL_A} />
      <FrontDoor x={36} y={124} w={148} h={FLOOR_Y - 124} />
      {/* one street window beside the door (owner kept it here rather than behind the monster) */}
      {decor.window ? <Window look={decor.window} /> : <StreetWindow />}
      <TableAndChairs cx={232} floorY={FLOOR_Y} />

      {/* right wall: a little shelf with cups and a plant, mostly behind the ticket */}
      <g opacity={0.8}>
        <rect x={1150} y={210} width={200} height={10} rx={3} fill={WOOD} />
        {[1180, 1214, 1248].map((x) => (
          <path key={x} d={`M${x} 186 h22 v18 q-11 8 -22 0 Z`} fill="#fffaf0" stroke="#d8c9ad" strokeWidth={2} />
        ))}
        <rect x={1196} y={290} width={40} height={40} rx={6} fill="#c98b55" />
        <path d="M1216 292 q-30 -30 -14 -58 q8 24 14 30 q6 -30 22 -36 q6 30 -22 64 Z" fill="#8fbf6a" />
      </g>
      {decor.wallArt && <WallArtStandIn look={decor.wallArt} />}
      {decor.lights && <Lights look={decor.lights} />}
      {/* counter: the far edge the monster stands behind, then the top the child works on */}
      <rect x={-1000} y={COUNTER_Y} width={3280} height={16} fill={WOOD_DARK} />
      <rect x={-1000} y={COUNTER_Y + 2} width={3280} height={4} fill="#a8744a" />
      <rect x={-1000} y={COUNTER_Y + 16} width={3280} height={900} fill={COUNTER_TOP} />
      {[60, 140, 230, 330].map((dy, i) => (
        <path
          key={dy}
          d={`M-1000 ${COUNTER_Y + dy} C ${200 + i * 90} ${COUNTER_Y + dy - 6}, ${700 - i * 60} ${COUNTER_Y + dy + 8}, 2280 ${COUNTER_Y + dy}`}
          fill="none"
          stroke={COUNTER_GRAIN}
          strokeWidth={3}
          opacity={0.6}
        />
      ))}
      <rect x={-1000} y={COUNTER_Y + 16} width={3280} height={10} fill="rgba(0,0,0,0.08)" />
      {decor.counter && <CounterTopStandIn look={decor.counter} />}

      {/* status bar: a cream board with a wooden trim, running past the safe box */}
      <rect x={-1000} y={-600} width={3280} height={600 + BAR_H} fill="#f7e6c4" />
      <rect x={-1000} y={BAR_H - 10} width={3280} height={10} fill={WOOD} />
      <rect x={-1000} y={BAR_H} width={3280} height={4} fill="rgba(0,0,0,0.1)" />
    </svg>
  );
}

/** Glass-panelled front door, on the floor line. */
function FrontDoor({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g data-slot="door" opacity={0.92}>
      <rect x={x} y={y} width={w} height={h} rx={5} fill={WOOD_DARK} />
      <rect x={x - 5} y={y - 5} width={w + 10} height={12} rx={4} fill={WOOD_DARK} />
      <rect x={x + 10} y={y + 10} width={w - 20} height={h - 10} fill={WOOD} />
      {/* glass with the street behind it */}
      <rect x={x + 22} y={y + 22} width={w - 44} height={h * 0.46} rx={6} fill="#cfeaff" />
      <rect x={x + 30} y={y + 22 + h * 0.2} width={34} height={h * 0.26} fill="#b6c9dc" />
      <path d={`M${x + 28} ${y + 30} l26 0 l-30 34 Z`} fill="#fff" opacity={0.5} />
      <rect x={x + 22} y={y + 34 + h * 0.46} width={w - 44} height={h * 0.3} rx={5} fill="#a87445" />
      {/* little hanging sign with a steaming cup: "open" without words */}
      <line x1={x + w / 2 - 16} y1={y + 30} x2={x + w / 2} y2={y + 18} stroke={WOOD_DARK} strokeWidth={2} />
      <line x1={x + w / 2 + 16} y1={y + 30} x2={x + w / 2} y2={y + 18} stroke={WOOD_DARK} strokeWidth={2} />
      <rect x={x + w / 2 - 22} y={y + 30} width={44} height={30} rx={6} fill="#fffaf0" stroke="#c98b55" strokeWidth={2} />
      <path d={`M${x + w / 2 - 9} ${y + 42} h18 v6 q-9 7 -18 0 Z`} fill="#c98b55" />
      <path d={`M${x + w / 2 - 3} ${y + 40} q-3 -4 0 -7 M${x + w / 2 + 4} ${y + 40} q-3 -4 0 -7`} stroke="#c98b55" strokeWidth={1.5} fill="none" />
      <circle cx={x + w - 24} cy={y + h * 0.62} r={6} fill="#f2c14e" stroke="#c48d22" strokeWidth={2} />
      <rect x={x - 5} y={y + h - 6} width={w + 10} height={6} rx={2} fill={WOOD_DARK} />
    </g>
  );
}

/**
 * One round table with a chair either side, seen from the front: each chair back is two posts
 * joined by a top rail and a slat, so it reads as one piece. Legs go behind the counter.
 */
function TableAndChairs({ cx, floorY }: { cx: number; floorY: number }) {
  const seat = floorY + 56;
  const top = floorY + 38;
  const LEG = '#8c6a4e';
  const chair = (x: number) => (
    <g>
      <rect x={x - 26} y={seat - 64} width={7} height={140} rx={3} fill={LEG} />
      <rect x={x + 19} y={seat - 64} width={7} height={140} rx={3} fill={LEG} />
      <rect x={x - 29} y={seat - 70} width={58} height={13} rx={6} fill={LEG} />
      <rect x={x - 22} y={seat - 40} width={44} height={8} rx={3} fill={LEG} />
      <rect x={x - 33} y={seat} width={66} height={11} rx={5} fill="#c96f6f" />
      <rect x={x - 33} y={seat + 8} width={66} height={5} rx={2} fill="#a85a5a" />
      <rect x={x - 29} y={seat + 12} width={6} height={60} fill={LEG} />
      <rect x={x + 23} y={seat + 12} width={6} height={60} fill={LEG} />
    </g>
  );
  return (
    <g data-slot="table" opacity={0.92}>
      {chair(cx - 100)}
      {chair(cx + 100)}
      <rect x={cx - 6} y={top} width={12} height={80} fill="#7a5536" />
      <ellipse cx={cx} cy={top + 4} rx={70} ry={14} fill="#a87445" />
      <ellipse cx={cx} cy={top} rx={70} ry={14} fill="#c98b55" />
      <path d={`M${cx - 10} ${top - 18} h20 v12 q-10 6 -20 0 Z`} fill="#fffaf0" />
      <ellipse cx={cx + 30} cy={top - 2} rx={16} ry={4} fill="#fffaf0" />
    </g>
  );
}

/** Status-bar destination: a little shop front with its door open (the line walks into it). */
export function ShopIcon() {
  return (
    <svg viewBox="0 0 112 108" width="100%" height="100%" aria-hidden="true">
      <rect x={14} y={36} width={84} height={66} rx={4} fill="#ffe8c2" stroke={WOOD_DARK} strokeWidth={3} />
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${8 + i * 19.2} 26 h19.2 v12 a9.6 9 0 0 1 -19.2 0 Z`} fill={i % 2 ? '#fffaf0' : '#ff9f7a'} stroke={WOOD_DARK} strokeWidth={1.5} />
      ))}
      <rect x={6} y={18} width={100} height={10} rx={4} fill={WOOD_DARK} />
      {/* open doorway, warm inside, the door swung in */}
      <rect x={58} y={54} width={30} height={48} fill="#ffd56b" />
      <path d="M58 54 L46 60 L46 98 L58 102 Z" fill={WOOD} stroke={WOOD_DARK} strokeWidth={2} />
      <rect x={22} y={52} width={22} height={22} rx={3} fill="#cfeaff" stroke={WOOD_DARK} strokeWidth={2} />
      <rect x={0} y={100} width={112} height={6} rx={3} fill={WOOD_DARK} />
    </svg>
  );
}

/** Coin jar for the status bar: a glass jar with coins in it. */
export function CoinJarIcon() {
  return (
    <svg viewBox="0 0 70 80" width="100%" height="100%" aria-hidden="true">
      <rect x={18} y={4} width={34} height={10} rx={3} fill={WOOD} />
      <path d="M14 16 h42 q8 6 8 20 v30 q0 10 -10 10 h-38 q-10 0 -10 -10 v-30 q0 -14 8 -20 Z" fill="#e8f6ff" stroke="#9cc3d9" strokeWidth={3} />
      {[
        [26, 64],
        [44, 64],
        [35, 56],
        [24, 50],
        [46, 50],
      ].map(([cx, cy]) => (
        <ellipse key={`${cx}${cy}`} cx={cx} cy={cy} rx={10} ry={6} fill="#f6c445" stroke="#c99a1f" strokeWidth={2} />
      ))}
      <path d="M18 28 q-2 14 0 30" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
    </svg>
  );
}
