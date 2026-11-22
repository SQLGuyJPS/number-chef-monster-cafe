// `?mock&v=shop|later|confirm|delivery|home`: static layout mock of the M4a shop (look only,
// owner review before interaction is built). `?mock&v=s3&decor` shows the service with a labelled
// stand-in in every decor slot.
import { useEffect, useState } from 'react';
import { CounterScene, type DecorView } from '../art/CounterScene';
import { DeliveryBox } from '../art/decor/DeliveryBox';
import { Monster } from '../art/monsters/Monster';
import { faceX } from './screens/Results';
import { Pip } from '../art/Pip';
import { expandCatalog, M4_ITEMS, type DecorSlot, type ShopEntry } from '../engine/economy';
import { Caption, CoinJar, at } from '../game/service/ServiceParts';
import { TapButton } from '../game/input/TapButton';
import { COUNTER, COUNTER_Y, FRONT, RESULTS4, SHOP, SHOP_MORE, type Rect } from './metrics';
import { lookFor, swatchOf } from './decorLook';
import {
  ColourDots,
  ItemTile,
  MiniStandIn,
  PageArrow,
  PagePips,
  Price,
  SlotIcon,
  SlotTab,
} from './screens/ShopParts';
import { FrontMonster, FrontPip, FrontSign } from './screens/FrontRoom';
import './screens/shop.css';

export const SHOP_MOCK_VARIANTS = [
  'shop',
  'later',
  'five',
  'max',
  'pages',
  'strip',
  'rows',
  'more',
  'more-open',
  'confirm',
  'delivery',
  'home',
  'results',
] as const;
export type ShopMockVariant = (typeof SHOP_MOCK_VARIANTS)[number];

const ALL = expandCatalog(M4_ITEMS);
/** Mock-only extra colorways (M14 may bring up to five per item); priced as a colorway. */
const mk = (
  slot: DecorSlot,
  item: string,
  name: string,
  colorway: ShopEntry['colorway'],
  tier: ShopEntry['tier'],
  price: number,
): ShopEntry => ({
  key: `${slot}.${item}.${colorway}`,
  slot,
  item,
  name,
  colorway,
  tier,
  price,
});
/** Mock-only extras: M14's further colorways (up to five per item) and themed-set pieces. */
const EXTRA: ShopEntry[] = [
  mk('wallpaper', 'plain', 'Plain Paint', 'mint', 1, 20),
  mk('wallpaper', 'plain', 'Plain Paint', 'sky', 1, 20),
  mk('wallArt', 'neon-open', 'Neon OPEN', 'honey', 2, 20),
  mk('wallArt', 'neon-open', 'Neon OPEN', 'lavender', 2, 20),
  mk('counter', 'flower-vase', 'Flower Vase', 'mint', 1, 15),
  mk('counter', 'flower-vase', 'Flower Vase', 'lavender', 1, 15),
  ...(
    [
      ['rocket-lamp', 'Rocket Lamp', 'sky'],
      ['moon-globe', 'Moon Globe', 'lavender'],
      ['snow-globe', 'Snow Globe', 'classic'],
      ['treasure-chest', 'Treasure Chest', 'honey'],
      ['tiny-castle', 'Tiny Castle', 'berry'],
      ['rainbow-jar', 'Rainbow Jar', 'classic'],
      ['space-plant', 'Space Plant', 'mint'],
      ['pirate-ship', 'Pirate Ship', 'cocoa'],
    ] as const
  ).map(([id, name, c]) => mk('counter', id, name, c, 3, 55)),
];
const entry = (key: string): ShopEntry => {
  const e = ALL.find((x) => x.key === key) ?? EXTRA.find((x) => x.key === key);
  if (!e) throw new Error(`no entry ${key}`);
  return e;
};

const SLOTS: DecorSlot[] = ['wallpaper', 'floor', 'lights', 'window', 'counter', 'wallArt'];
const noop = () => undefined;

/** One stand-in per slot: what the `decor` service mock and the café preview show. */
export const ALL_SLOTS_DECOR: DecorView = {
  wallpaper: lookFor(entry('wallpaper.polka-dots.sky')),
  floor: lookFor(entry('floor.tiles.mint')),
  lights: lookFor(entry('lights.string-lights.honey')),
  window: lookFor(entry('window.garden.classic')),
  counter: lookFor(entry('counter.flower-vase.berry')),
  wallArt: lookFor(entry('wallArt.menu-board.classic')),
};

function Bar({ slot, fresh = [] }: { slot: DecorSlot; fresh?: DecorSlot[] }) {
  return (
    <>
      {SLOTS.map((s, i) => (
        <SlotTab
          key={s}
          rect={SHOP.tab(i)}
          slot={s}
          active={s === slot}
          fresh={fresh.includes(s)}
          onTap={noop}
        />
      ))}
      <CoinJar rect={COUNTER.bar.jar} count={47} testId="coin-jar" />
      <TapButton
        className="shop-home"
        style={at(SHOP.home)}
        testId="shop-home"
        label="Home"
        tapKind="button"
        onTap={noop}
      >
        <svg viewBox="0 0 72 72" width="70%" height="70%" aria-hidden="true">
          <path d="M10 36 L36 12 L62 36 V62 H44 V44 H28 V62 H10 Z" fill="#6b4a2e" />
        </svg>
      </TapButton>
    </>
  );
}

interface Shelf {
  tiles: {
    key: string;
    state: 'equipped' | 'owned' | 'forSale';
    fresh?: boolean;
    none?: boolean;
  }[];
  selected: number;
  dots: { key: string; owned: boolean }[];
  dot: string;
}

/** Wallpaper on the starter shelf: Plain Paint (Sunny owned and on), previewing Berry. */
const START: Shelf = {
  tiles: [
    { key: 'wallpaper.plain.sunny', state: 'equipped' },
    { key: 'wallpaper.polka-dots.berry', state: 'forSale' },
    { key: 'wallpaper.stripes.mint', state: 'forSale' },
  ],
  selected: 0,
  dots: [
    { key: 'wallpaper.plain.sunny', owned: true },
    { key: 'wallpaper.plain.berry', owned: false },
    { key: 'wallpaper.plain.lavender', owned: false },
  ],
  dot: 'wallpaper.plain.berry',
};

/** Five colorways (room kept for M14's extra colours): the dots row holds five. */
const FIVE: Shelf = {
  ...START,
  dots: [
    ...START.dots,
    { key: 'wallpaper.plain.mint', owned: false },
    { key: 'wallpaper.plain.sky', owned: false },
  ],
  dot: 'wallpaper.plain.mint',
};

/** Weeks later: a full wall-art shelf, the Menu Board bought, a crate's Giant Clock still new. */
const LATER_ONLY: Shelf = {
  tiles: [
    { key: 'wallArt.none.classic', state: 'owned', none: true },
    { key: 'wallArt.menu-board.classic', state: 'equipped' },
    { key: 'wallArt.neon-open.berry', state: 'forSale' },
    { key: 'wallArt.giant-clock.honey', state: 'forSale', fresh: true },
    { key: 'wallArt.monster-portraits.classic', state: 'forSale' },
    { key: 'wallArt.trophy-shelf.classic', state: 'forSale' },
  ],
  selected: 2,
  dots: [
    { key: 'wallArt.neon-open.berry', owned: false },
    { key: 'wallArt.neon-open.sky', owned: false },
    { key: 'wallArt.neon-open.mint', owned: false },
  ],
  dot: 'wallArt.neon-open.sky',
};
const LATER = LATER_ONLY;

/**
 * Fit check at the most a slot can hold in one row (D166): six tiles with the longest names and a
 * three-digit price, a star and ticks, and five colour dots.
 */
const MAX: Shelf = {
  ...LATER_ONLY,
  dots: [
    ...LATER_ONLY.dots,
    { key: 'wallArt.neon-open.honey', owned: false },
    { key: 'wallArt.neon-open.lavender', owned: false },
  ],
  dot: 'wallArt.neon-open.honey',
};

/** The counter-top at M14's most (14 items: M4's six and eight themed-set pieces), Flower Vase picked. */
const COUNTER_14: Shelf = {
  tiles: [
    { key: 'counter.none.classic', state: 'owned', none: true },
    { key: 'counter.flower-vase.berry', state: 'equipped' },
    { key: 'counter.cake-stand.berry', state: 'forSale' },
    { key: 'counter.cookie-jar.sky', state: 'owned' },
    { key: 'counter.fish-bowl.classic', state: 'forSale' },
    { key: 'counter.tiny-robot.sky', state: 'forSale' },
    { key: 'counter.rocket-lamp.sky', state: 'forSale', fresh: true },
    { key: 'counter.moon-globe.lavender', state: 'forSale', fresh: true },
    { key: 'counter.snow-globe.classic', state: 'forSale' },
    { key: 'counter.treasure-chest.honey', state: 'forSale' },
    { key: 'counter.tiny-castle.berry', state: 'forSale' },
    { key: 'counter.rainbow-jar.classic', state: 'forSale' },
    { key: 'counter.space-plant.mint', state: 'forSale' },
    { key: 'counter.pirate-ship.cocoa', state: 'forSale' },
  ],
  selected: 1,
  dots: [
    { key: 'counter.flower-vase.berry', owned: true },
    { key: 'counter.flower-vase.sky', owned: false },
    { key: 'counter.flower-vase.honey', owned: false },
    { key: 'counter.flower-vase.mint', owned: false },
    { key: 'counter.flower-vase.lavender', owned: false },
  ],
  dot: 'counter.flower-vase.mint',
};

type Layout = 'row' | 'pages' | 'strip' | 'rows' | 'more';

function Tiles({
  shelf,
  from,
  count,
  rect,
  compact,
  shift,
}: {
  shelf: Shelf;
  from: number;
  count: number;
  rect: (i: number) => Rect;
  compact?: boolean;
  shift?: { x: number; y: number };
}) {
  const sel = entry(shelf.dot);
  return (
    <>
      {shelf.tiles.slice(from, from + count).map((t, j) => {
        const i = from + j;
        const e = entry(t.key);
        const r = rect(j);
        return (
          <ItemTile
            key={t.key}
            rect={shift ? { ...r, x: r.x - shift.x, y: r.y - shift.y } : r}
            // The selected tile shows the colour being tried on.
            look={t.none ? null : lookFor(i === shelf.selected ? sel : e)}
            name={e.name}
            state={t.state}
            price={e.price}
            selected={i === shelf.selected}
            fresh={t.fresh}
            compact={compact}
            onTap={noop}
          />
        );
      })}
    </>
  );
}

function ShopBand({ shelf, layout = 'row' }: { shelf: Shelf; layout?: Layout }) {
  const sel = entry(shelf.dot);
  const P = SHOP_MORE.pages;
  const S = SHOP_MORE.strip;
  return (
    <>
      {layout === 'row' && <Tiles shelf={shelf} from={0} count={6} rect={SHOP.tile} />}
      {layout === 'pages' && (
        <>
          {/* Page 1 of 4 is showing: the back arrow is faded, not hidden, so nothing jumps. */}
          <PageArrow rect={P.back} dir="back" off onTap={noop} />
          <Tiles shelf={shelf} from={0} count={4} rect={P.tile} />
          <PageArrow rect={P.next} dir="next" onTap={noop} />
          <PagePips rect={P.pips} n={Math.ceil(shelf.tiles.length / 4)} at={0} />
        </>
      )}
      {layout === 'strip' && (
        <>
          <div className="shop-strip" style={at(S.window)}>
            <Tiles
              shelf={shelf}
              from={0}
              count={7}
              rect={S.tile}
              shift={{ x: S.window.x, y: S.window.y }}
            />
          </div>
          <PageArrow rect={S.next} dir="next" onTap={noop} />
        </>
      )}
      {layout === 'rows' && (
        <Tiles shelf={shelf} from={0} count={14} rect={SHOP_MORE.rows.tile} compact />
      )}
      {layout === 'more' && (
        <>
          <Tiles shelf={shelf} from={0} count={5} rect={SHOP.tile} />
          <TapButton
            className="shop-tile forSale shop-more-tile"
            style={at(SHOP.tile(5))}
            testId="shop-more"
            label="More"
            tapKind="button"
            onTap={noop}
          >
            <svg viewBox="0 0 72 72" width="80" height="80" aria-hidden="true">
              {[0, 1, 2, 3].map((k) => (
                <rect
                  key={k}
                  x={6 + (k % 2) * 32}
                  y={6 + Math.floor(k / 2) * 32}
                  width={28}
                  height={28}
                  rx={7}
                  fill={['#f7c4d8', '#c4e0f6', '#c6ecd9', '#ffdc85'][k]}
                />
              ))}
            </svg>
            <span>+{shelf.tiles.length - 5}</span>
            <span className="shop-new" aria-hidden="true" />
          </TapButton>
        </>
      )}
      <ColourDots
        rect={SHOP.dots}
        dots={shelf.dots.map((d) => ({
          key: d.key,
          colour: swatchOf(entry(d.key)),
          owned: d.owned,
          selected: d.key === shelf.dot,
        }))}
        onTap={noop}
      />
      <TapButton
        className="btn btn-primary shop-buy"
        style={at(SHOP.buy)}
        testId="shop-buy"
        tapKind="button"
        onTap={noop}
      >
        Buy <Price n={sel.price} />
      </TapButton>
    </>
  );
}

/** D, opened: every item of the slot on a sheet over the café; tapping one picks it and closes it. */
function MoreSheet({ shelf }: { shelf: Shelf }) {
  const M = SHOP_MORE.more;
  return (
    <div className="shop-confirm-layer" data-testid="shop-sheet">
      <div className="shop-dim" />
      <div className="shop-sheet" style={at(M.sheet)}>
        <div className="shop-sheet-head">
          <SlotIcon slot="counter" />
        </div>
      </div>
      <Tiles shelf={shelf} from={0} count={14} rect={M.tile} />
      <TapButton
        className="shop-close"
        style={at(M.close)}
        testId="shop-close"
        label="Done"
        tapKind="button"
        onTap={noop}
      >
        <svg viewBox="0 0 72 72" width="100%" height="100%" aria-hidden="true">
          <path
            d="M14 38 L30 54 L58 20"
            fill="none"
            stroke="#fff"
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </TapButton>
    </div>
  );
}

function ShopPip() {
  const r = COUNTER.scene.pip;
  return (
    <div className="pip-well" style={at({ ...r, h: COUNTER_Y + 4 - r.y })}>
      <div style={{ width: r.w, height: r.h }}>
        <Pip />
      </div>
    </div>
  );
}

export function ShopMock({ variant }: { variant: ShopMockVariant }) {
  if (variant === 'home') {
    return (
      <div className="screen home counter-mock" data-testid="counter-mock" data-variant={variant}>
        <CounterScene
          decor={{ counter: ALL_SLOTS_DECOR.counter, wallArt: ALL_SLOTS_DECOR.wallArt }}
        />
        <FrontSign>
          <span className="front-title">Monster Café</span>
        </FrontSign>
        <CoinJar rect={COUNTER.bar.jar} count={47} testId="coin-jar" />
        <FrontMonster />
        <FrontPip />
        <TapButton
          className="btn btn-primary front-btn open-cafe"
          style={at(FRONT.open)}
          tapKind="button"
          onTap={noop}
        >
          Open the Café
        </TapButton>
        <TapButton
          className="btn btn-secondary front-btn shop-button"
          style={at(SHOP.shopButton)}
          testId="shop-button"
          tapKind="button"
          onTap={noop}
        >
          <span className="shop-button-inner">
            <Brush />
            <span>Shop</span>
          </span>
        </TapButton>
      </div>
    );
  }
  if (variant === 'results') return <ResultsMock />;
  const later = variant === 'later' || variant === 'max';
  const many =
    variant === 'pages' ||
    variant === 'strip' ||
    variant === 'rows' ||
    variant === 'more' ||
    variant === 'more-open';
  const shelf = many
    ? COUNTER_14
    : variant === 'max'
      ? MAX
      : later
        ? LATER
        : variant === 'five'
          ? FIVE
          : START;
  const preview = entry(shelf.dot);
  const decor: DecorView = many
    ? { counter: lookFor(preview), wallArt: ALL_SLOTS_DECOR.wallArt }
    : later
      ? { wallArt: lookFor(preview), counter: ALL_SLOTS_DECOR.counter }
      : { wallpaper: lookFor(preview) };
  const layout: Layout = variant === 'more-open' ? 'more' : many ? variant : 'row';
  return (
    <div className="screen shop counter-mock" data-testid="counter-mock" data-variant={variant}>
      <CounterScene decor={decor} />
      <Bar
        slot={many ? 'counter' : later ? 'wallArt' : 'wallpaper'}
        fresh={many ? ['counter'] : later ? ['wallArt', 'counter'] : []}
      />
      <ShopPip />
      <ShopBand shelf={shelf} layout={layout} />
      {variant === 'more-open' && <MoreSheet shelf={shelf} />}
      {variant === 'confirm' && <Confirm e={preview} />}
      {variant === 'delivery' && <Delivery phase={phaseParam()} />}
    </div>
  );
}

function Brush() {
  return (
    <svg className="shop-brush" viewBox="0 0 64 64" aria-hidden="true">
      <g transform="rotate(35 32 32)">
        <rect x={27} y={2} width={10} height={30} rx={5} fill="#b98352" />
        <rect x={25} y={30} width={14} height={8} rx={2} fill="#9aa6b2" />
        <path d="M25 38 h14 q2 12 -7 22 q-9 -10 -7 -22 Z" fill="#d9487f" />
      </g>
    </svg>
  );
}

/** "Buy Plain Paint?" — big Yes! / Not yet; Pip says it too. */
function Confirm({ e }: { e: ShopEntry }) {
  return (
    <div className="shop-confirm-layer" data-testid="shop-confirm" role="dialog" aria-modal="true">
      <div className="shop-dim" />
      <div className="shop-confirm" style={at(SHOP.confirm)}>
        <div className="shop-confirm-pic">
          <MiniStandIn look={lookFor(e)} />
        </div>
        <div className="shop-confirm-title">
          Buy {e.name}? <Price n={e.price} />
        </div>
      </div>
      <TapButton
        className="btn btn-primary shop-yes"
        style={at(SHOP.yes)}
        testId="shop-yes"
        tapKind="button"
        onTap={noop}
      >
        Yes!
      </TapButton>
      <TapButton
        className="btn btn-secondary shop-not-yet"
        style={at(SHOP.notYet)}
        testId="shop-not-yet"
        tapKind="button"
        onTap={noop}
      >
        Not yet
      </TapButton>
    </div>
  );
}

type DeliveryPhase = 'drop' | 'closed' | 'open';
/** `&phase=drop|closed|open` freezes the delivery for screenshots; without it, it plays live. */
const phaseParam = (): DeliveryPhase | undefined => {
  const p = new URLSearchParams(location.search).get('phase');
  return p === 'drop' || p === 'closed' || p === 'open' ? p : undefined;
};
const DROP_MS = 700;
/** It opens on a tap, or by itself this long after it lands (owner, 2026-11-22). */
const AUTO_OPEN_MS = 2000;

/**
 * The delivery moment (SPEC §10.1): the box fades in and drops onto the counter's far edge, Pip
 * says "A delivery arrived!", the box twinkles until it is tapped or two seconds pass, then the
 * flaps fold out and the two new entries rise out of it. (Built: they then fly to their tiles.)
 */
function Delivery({ phase: frozen }: { phase?: DeliveryPhase }) {
  const [phase, setPhase] = useState<DeliveryPhase>(frozen ?? 'drop');
  useEffect(() => {
    if (frozen) return;
    const t1 = window.setTimeout(() => setPhase((p) => (p === 'drop' ? 'closed' : p)), DROP_MS);
    const t2 = window.setTimeout(() => setPhase('open'), DROP_MS + AUTO_OPEN_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [frozen]);
  const r = SHOP.crate;
  const items = [entry('wallpaper.polka-dots.sky'), entry('counter.fish-bowl.classic')];
  return (
    <div className="shop-delivery" data-testid="shop-delivery" data-phase={phase}>
      <div className="shop-dim" />
      {phase !== 'drop' && (
        <Caption rect={COUNTER.scene.caption} text="A delivery arrived!" speaker="pip" />
      )}
      {phase === 'open' &&
        items.map((e, i) => (
          <div
            key={e.key}
            className="shop-delivery-item"
            style={{
              ...at({ x: r.x + 36 + i * 128, y: r.y - 10, w: 100, h: 80 }),
              animationDelay: `${400 + i * 120}ms`,
            }}
          >
            <MiniStandIn look={lookFor(e)} />
          </div>
        ))}
      <TapButton
        className={`shop-crate${phase === 'drop' && !frozen ? ' dropping' : ''}`}
        style={at(r)}
        testId="shop-crate"
        label="Open the box"
        tapKind="button"
        onTap={() => setPhase('open')}
      >
        <DeliveryBox phase={phase === 'open' ? 'open' : 'closed'} />
      </TapButton>
    </div>
  );
}

/** Results with the longest service (8 orders, 2 requeues): ten monsters in front of the counter-top item. */
function ResultsMock() {
  const ids = [
    'blobbo',
    'gruffles',
    'zibbit',
    'mimsy',
    'chompers',
    'wobbleton',
    'blobbo',
    'gruffles',
    'zibbit',
    'chompers',
  ];
  const f = FRONT.faces;
  return (
    <div className="screen results counter-mock" data-testid="counter-mock" data-variant="results">
      <CounterScene decor={ALL_SLOTS_DECOR} />
      <div className="closed-sign" style={at(FRONT.closed)}>
        CLOSED
      </div>
      <CoinJar rect={COUNTER.bar.jar} count={76} testId="coin-jar" />
      <div className="results-tally" style={at(FRONT.tally)}>
        <span className="coin-icon" aria-hidden="true" />
        <span className="coin-count">29</span>
      </div>
      {ids.map((m, i) => (
        <div
          key={i}
          className="results-face"
          style={at({ x: faceX(i, ids.length), y: f.y, w: f.size, h: f.size })}
        >
          <Monster id={m} expression="delight" size={f.size} />
        </div>
      ))}
      {/* Shop joins Results (SPEC §5.7): four buttons on one line, text a size smaller. */}
      <TapButton
        className="btn btn-secondary front-btn results4 results-change"
        style={at(RESULTS4.change)}
        tapKind="button"
        onTap={noop}
      >
        Change dish
      </TapButton>
      <TapButton
        className="btn btn-primary front-btn results4 results-another"
        style={at(RESULTS4.another)}
        tapKind="button"
        onTap={noop}
      >
        Another service
      </TapButton>
      <TapButton
        className="btn btn-secondary front-btn results4 results-shop"
        style={at(RESULTS4.shop)}
        testId="results-shop"
        tapKind="button"
        onTap={noop}
      >
        <span className="shop-button-inner">
          <Brush />
          <span>Shop</span>
        </span>
      </TapButton>
      <TapButton
        className="btn btn-secondary front-btn results4 results-home"
        style={at(RESULTS4.home)}
        tapKind="button"
        onTap={noop}
      >
        Home
      </TapButton>
    </div>
  );
}
