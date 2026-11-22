// `?mock&v=shop|later|confirm|delivery|home`: static layout mock of the M4a shop (look only,
// owner review before interaction is built). `?mock&v=s3&decor` shows the service with a labelled
// stand-in in every decor slot.
import { CounterScene, type DecorView } from '../art/CounterScene';
import { Pip } from '../art/Pip';
import { expandCatalog, M4_ITEMS, type DecorSlot, type ShopEntry } from '../engine/economy';
import { Caption, CoinJar, at } from '../game/service/ServiceParts';
import { TapButton } from '../game/input/TapButton';
import { COUNTER, COUNTER_Y, FRONT, SHOP } from './metrics';
import { lookFor, swatchOf } from './decorLook';
import { ColourDots, ItemTile, MiniStandIn, Price, SlotTab } from './screens/ShopParts';
import { FrontMonster, FrontPip, FrontSign } from './screens/FrontRoom';
import './screens/shop.css';

export const SHOP_MOCK_VARIANTS = ['shop', 'later', 'confirm', 'delivery', 'home'] as const;
export type ShopMockVariant = (typeof SHOP_MOCK_VARIANTS)[number];

const ALL = expandCatalog(M4_ITEMS);
const entry = (key: string): ShopEntry => {
  const e = ALL.find((x) => x.key === key);
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
        <SlotTab key={s} rect={SHOP.tab(i)} slot={s} active={s === slot} fresh={fresh.includes(s)} onTap={noop} />
      ))}
      <CoinJar rect={COUNTER.bar.jar} count={47} testId="coin-jar" />
      <TapButton className="shop-home" style={at(SHOP.home)} testId="shop-home" label="Home" tapKind="button" onTap={noop}>
        <svg viewBox="0 0 72 72" width="70%" height="70%" aria-hidden="true">
          <path d="M10 36 L36 12 L62 36 V62 H44 V44 H28 V62 H10 Z" fill="#6b4a2e" />
        </svg>
      </TapButton>
    </>
  );
}

interface Shelf {
  tiles: { key: string; state: 'equipped' | 'owned' | 'forSale'; fresh?: boolean; none?: boolean }[];
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

/** Weeks later: a full wall-art shelf, the Menu Board bought, a crate's Giant Clock still new. */
const LATER: Shelf = {
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

function ShopBand({ shelf }: { shelf: Shelf }) {
  const sel = entry(shelf.dot);
  return (
    <>
      {shelf.tiles.map((t, i) => {
        const e = entry(t.key);
        return (
          <ItemTile
            key={t.key}
            rect={SHOP.tile(i)}
            // The selected tile shows the colour being tried on.
            look={t.none ? null : lookFor(i === shelf.selected ? sel : e)}
            name={e.name}
            state={t.state}
            price={e.price}
            selected={i === shelf.selected}
            fresh={t.fresh}
            onTap={noop}
          />
        );
      })}
      <ColourDots
        rect={SHOP.dots}
        dots={shelf.dots.map((d) => ({ key: d.key, colour: swatchOf(entry(d.key)), owned: d.owned, selected: d.key === shelf.dot }))}
        onTap={noop}
      />
      <TapButton className="btn btn-primary shop-buy" style={at(SHOP.buy)} testId="shop-buy" tapKind="button" onTap={noop}>
        Buy <Price n={sel.price} />
      </TapButton>
    </>
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
        <CounterScene decor={{ counter: ALL_SLOTS_DECOR.counter, wallArt: ALL_SLOTS_DECOR.wallArt }} />
        <FrontSign>
          <span className="front-title">Monster Café</span>
        </FrontSign>
        <CoinJar rect={COUNTER.bar.jar} count={47} testId="coin-jar" />
        <FrontMonster />
        <FrontPip />
        <TapButton className="btn btn-primary front-btn open-cafe" style={at(FRONT.open)} tapKind="button" onTap={noop}>
          Open the Café
        </TapButton>
        <TapButton className="btn btn-secondary front-btn decorate" style={at(SHOP.decorate)} testId="decorate" tapKind="button" onTap={noop}>
          <span className="decorate-inner">
            <Brush />
            Decorate
          </span>
        </TapButton>
      </div>
    );
  }
  const later = variant === 'later';
  const shelf = later ? LATER : START;
  const preview = entry(shelf.dot);
  const decor: DecorView = later
    ? { wallArt: lookFor(preview), counter: ALL_SLOTS_DECOR.counter }
    : { wallpaper: lookFor(preview) };
  return (
    <div className="screen shop counter-mock" data-testid="counter-mock" data-variant={variant}>
      <CounterScene decor={decor} />
      <Bar slot={later ? 'wallArt' : 'wallpaper'} fresh={later ? ['wallArt', 'counter'] : []} />
      <ShopPip />
      <ShopBand shelf={shelf} />
      {variant === 'confirm' && <Confirm e={preview} />}
      {variant === 'delivery' && <Delivery />}
    </div>
  );
}

function Brush() {
  return (
    <svg viewBox="0 0 64 64" width={64} height={64} aria-hidden="true">
      <rect x={28} y={4} width={10} height={30} rx={5} fill="#b98352" transform="rotate(20 33 19)" />
      <path d="M20 34 q10 -6 18 2 q4 14 -10 22 q-12 4 -16 -2 q8 -4 8 -22 Z" fill="#d9487f" />
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
      <TapButton className="btn btn-primary shop-yes" style={at(SHOP.yes)} testId="shop-yes" tapKind="button" onTap={noop}>
        Yes!
      </TapButton>
      <TapButton className="btn btn-secondary shop-not-yet" style={at(SHOP.notYet)} testId="shop-not-yet" tapKind="button" onTap={noop}>
        Not yet
      </TapButton>
    </div>
  );
}

/** A crate on the counter's far edge, lid off, its two entries popping out; Pip says it. */
function Delivery() {
  const r = SHOP.crate;
  const items = [entry('wallpaper.polka-dots.sky'), entry('counter.fish-bowl.classic')];
  return (
    <div className="shop-delivery" data-testid="shop-delivery">
      <div className="shop-dim" />
      <Caption rect={COUNTER.scene.caption} text="A delivery arrived!" speaker="pip" />
      {items.map((e, i) => (
        <div key={e.key} className="shop-delivery-item" style={at({ x: r.x + 10 + i * 120, y: r.y - 70, w: 100, h: 80 })}>
          <MiniStandIn look={lookFor(e)} />
        </div>
      ))}
      <svg className="shop-crate" style={at(r)} viewBox="0 0 240 190" aria-hidden="true">
        <path d="M10 70 L40 20 L120 36 L22 86 Z" fill="#e0b47a" />
        <path d="M230 70 L200 20 L120 36 L218 86 Z" fill="#d6a66a" />
        <rect x={20} y={60} width={200} height={124} rx={6} fill="#c98f58" />
        <rect x={20} y={60} width={200} height={16} fill="#b07a46" />
        <rect x={108} y={60} width={24} height={124} fill="#e8c48a" opacity={0.8} />
        <path d="M60 116 l10 -10 l10 10 l-10 10 Z M160 130 l10 -10 l10 10 l-10 10 Z" fill="#fff3a6" />
      </svg>
    </div>
  );
}
