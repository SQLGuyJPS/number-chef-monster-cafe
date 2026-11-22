// Shop screen parts (SPEC §10). Geometry from SHOP in metrics.ts; styles in shop.css.
import type { ReactNode } from 'react';
import { TapButton } from '../../game/input/TapButton';
import { at } from '../../game/service/ServiceParts';
import { SHOP_DOT, type Rect } from '../metrics';
import type { DecorSlot } from '../../engine/economy';
import type { DecorLook } from '../../art/decor/StandIn';

/** Small picture per slot for the tabs: drawn shapes, no words (the child may not read them). */
export function SlotIcon({ slot }: { slot: DecorSlot }) {
  const ink = '#6b4a2e';
  const body: Record<DecorSlot, ReactNode> = {
    wallpaper: (
      <>
        <rect x={14} y={10} width={44} height={52} rx={4} fill="#f7c4d8" />
        <circle cx={26} cy={24} r={4} fill="#d9487f" />
        <circle cx={46} cy={38} r={4} fill="#d9487f" />
        <circle cx={26} cy={52} r={4} fill="#d9487f" />
        <rect x={56} y={10} width={10} height={52} rx={5} fill="#e0a6bd" />
      </>
    ),
    floor: (
      <>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}${c}`} x={12 + c * 17} y={14 + r * 17} width={16} height={16} fill={(r + c) % 2 ? '#fffaf0' : '#3aa57a'} />
          )),
        )}
      </>
    ),
    lights: (
      <>
        <path d="M6 16 Q 36 40 66 16" fill="none" stroke={ink} strokeWidth={2} />
        {[18, 36, 54].map((x, i) => (
          <circle key={x} cx={x} cy={i === 1 ? 34 : 28} r={7} fill={['#f0b54a', '#d9487f', '#3d86c6'][i]} />
        ))}
      </>
    ),
    window: (
      <>
        <rect x={12} y={12} width={48} height={44} rx={4} fill="#cfeaff" stroke="#fff" strokeWidth={5} />
        <line x1={36} y1={12} x2={36} y2={56} stroke="#fff" strokeWidth={4} />
        <circle cx={48} cy={24} r={5} fill="#fff3a6" />
        <rect x={8} y={56} width={56} height={6} rx={2} fill="#e8c48a" />
      </>
    ),
    counter: (
      <>
        <rect x={6} y={52} width={60} height={8} rx={3} fill="#b98352" />
        <path d="M26 52 h20 l-3 -18 h-14 Z" fill="#3d86c6" />
        <circle cx={30} cy={22} r={7} fill="#d9487f" />
        <circle cx={42} cy={20} r={7} fill="#f0b54a" />
        <circle cx={36} cy={28} r={6} fill="#d9487f" />
      </>
    ),
    wallArt: (
      <>
        <rect x={12} y={14} width={48} height={40} rx={3} fill="#fffaf0" stroke="#b98352" strokeWidth={5} />
        <path d="M18 48 l12 -14 l8 8 l6 -6 l10 12 Z" fill="#3aa57a" />
        <circle cx={46} cy={26} r={4} fill="#f0b54a" />
      </>
    ),
    staff: null,
  };
  return (
    <svg viewBox="0 0 72 72" width="100%" height="100%" aria-hidden="true">
      {body[slot]}
    </svg>
  );
}

export function SlotTab({
  rect,
  slot,
  active,
  fresh,
  onTap,
}: {
  rect: Rect;
  slot: DecorSlot;
  active: boolean;
  /** A delivered entry in this slot not yet looked at. */
  fresh?: boolean;
  onTap: () => void;
}) {
  return (
    <TapButton
      className={`shop-tab${active ? ' active' : ''}`}
      style={at(rect)}
      testId={`shop-tab-${slot}`}
      label={slot}
      tapKind="button"
      onTap={onTap}
    >
      <SlotIcon slot={slot} />
      {fresh && <span className="shop-new" aria-hidden="true" />}
    </TapButton>
  );
}

/** Coin and amount; the amount is spoken in words when read out (Pip's line), never as digits. */
export function Price({ n }: { n: number }) {
  return (
    <span className="shop-price">
      <span className="shop-coin" aria-hidden="true" />
      {n}
    </span>
  );
}

/** Mini stand-in of an entry: its colours in a rounded swatch (M4b swaps in the real art). */
export function MiniStandIn({ look }: { look: DecorLook }) {
  return (
    <svg viewBox="0 0 100 80" width="100%" height="100%" aria-hidden="true">
      <rect x={4} y={4} width={92} height={72} rx={12} fill={look.base} stroke={look.accent} strokeWidth={5} strokeDasharray="10 6" />
      <circle cx={30} cy={30} r={9} fill={look.accent} opacity={0.6} />
      <circle cx={70} cy={50} r={9} fill={look.accent} opacity={0.6} />
    </svg>
  );
}

export type TileState = 'equipped' | 'owned' | 'forSale';

export function ItemTile({
  rect,
  look,
  name,
  state,
  price,
  selected,
  fresh,
  onTap,
}: {
  rect: Rect;
  look: DecorLook | null;
  name: string;
  state: TileState;
  price: number;
  selected: boolean;
  fresh?: boolean;
  onTap: () => void;
}) {
  return (
    <TapButton
      className={`shop-tile ${state}${selected ? ' selected' : ''}`}
      style={at(rect)}
      testId={`shop-tile-${look?.item ?? 'none'}`}
      label={name}
      tapKind="button"
      onTap={onTap}
    >
      <span className="shop-tile-pic">{look ? <MiniStandIn look={look} /> : <span className="shop-empty" />}</span>
      <span className="shop-tile-name">{name}</span>
      <span className="shop-tile-foot">
        {state === 'forSale' ? <Price n={price} /> : <span className="shop-tick" aria-label="yours" />}
      </span>
      {fresh && <span className="shop-new" aria-hidden="true" />}
    </TapButton>
  );
}

export function ColourDots({
  rect,
  dots,
  onTap,
}: {
  rect: Rect;
  dots: { key: string; colour: string; owned: boolean; selected: boolean }[];
  onTap: (key: string) => void;
}) {
  const total = dots.length * SHOP_DOT.tap + (dots.length - 1) * SHOP_DOT.gap;
  const x0 = rect.x + (rect.w - total) / 2;
  return (
    <>
      {dots.map((d, i) => (
        <TapButton
          key={d.key}
          className={`shop-dot${d.selected ? ' selected' : ''}`}
          style={at({ x: x0 + i * (SHOP_DOT.tap + SHOP_DOT.gap), y: rect.y, w: SHOP_DOT.tap, h: SHOP_DOT.tap })}
          testId={`shop-dot-${d.key}`}
          label={d.key}
          tapKind="cell"
          onTap={() => onTap(d.key)}
        >
          <span className="shop-dot-paint" style={{ background: d.colour }}>
            {d.owned && <span className="shop-tick small" aria-hidden="true" />}
          </span>
        </TapButton>
      ))}
    </>
  );
}
