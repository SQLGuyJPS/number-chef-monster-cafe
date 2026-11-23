// The coin shop (SPEC §10, §10.1; layout approved in the M4a mock, D161–D169). The café behind
// the counter is the preview: tapping an item or a colour dot shows it live (App draws the scene
// from `onPreview`). Owned entries equip on a tap; a new one needs Buy, then Yes!. Every rule
// (owned, price, shelf, crates) comes from engine/shop.ts; this screen only shows and writes.
import { useEffect, useRef, useState } from 'react';
import { Pip } from '../../art/Pip';
import { DeliveryBox } from '../../art/decor/DeliveryBox';
import { PIP_PITCH } from '../../audio/speech';
import { say } from '../../audio/voice';
import { phraseLine } from '../../engine/clips';
import type { DecorSlot, ShopEntry } from '../../engine/economy';
import { phrase, type PhraseKey } from '../../engine/phrases';
import type { Derived } from '../../engine/replay';
import {
  DECOR_SLOTS,
  canBuy,
  crateEntries,
  entryOf,
  equippedKey,
  isOwned,
  slotShelf,
  type ShelfItem,
} from '../../engine/shop';
import { TapButton } from '../../game/input/TapButton';
import { Caption, CoinJar, at } from '../../game/service/ServiceParts';
import { lookFor, swatchOf } from '../decorLook';
import { COUNTER, COUNTER_Y, SHOP, SHOP_PAGE } from '../metrics';
import { loadedProgress } from '../progress';
import { seeShopFresh, useShopFresh } from '../shopFresh';
import {
  ColourDots,
  ItemTile,
  MiniStandIn,
  PageArrow,
  PagePips,
  Price,
  SlotTab,
  type TileState,
} from './ShopParts';
import './shop.css';

const DROP_MS = 700;
/** It opens on a tap, or by itself this long after it lands (D164). */
const AUTO_OPEN_MS = 2000;
/**
 * How long the open box and its new entries stay before the shelf shows them, unless the screen
 * is tapped (D181). Taps in the first OPEN_TAP_GUARD_MS are ignored, so the tap (or quick second
 * tap) that opened the box does not skip the rise.
 */
const OPEN_HOLD_MS = 8000;
const OPEN_TAP_GUARD_MS = 1000;
/** The entries rise one after the other this far apart (shop.css .shop-delivery-item). */
const RISE_STAGGER_MS = 300;
/** A caption stays up at least this long, for reading. */
const CAPTION_MIN_MS = 2500;

/** The entry a tile shows: the one on, else one the child owns, else the item's first colour. */
function shownEntry(d: Derived, it: ShelfItem, equipped: string): ShopEntry {
  return (
    it.entries.find((e) => e.key === equipped) ??
    it.entries.find((e) => isOwned(d, e.key)) ??
    it.entries[0]!
  );
}

const isNone = (e: ShopEntry): boolean => e.item === 'none';

export function Shop({
  derived,
  coins,
  crate,
  onPreview,
  onHome,
}: {
  derived: Derived;
  coins: number;
  /** A crate recorded as the shop opened (D154): its delivery moment plays first. */
  crate: number | null;
  /** The entry being tried on in a slot, or null to show what is equipped. */
  onPreview: (slot: DecorSlot, key: string | null) => void;
  onHome: () => void;
}) {
  const fresh = useShopFresh();
  const arrived = crate === null ? [] : crateEntries(crate);
  const [slot, setSlot] = useState<DecorSlot>(
    () => (entryOf(arrived[0] ?? '')?.slot as DecorSlot | undefined) ?? 'wallpaper',
  );
  const shelf = slotShelf(derived, slot);
  const equipped = equippedKey(derived, slot);
  /** The entry selected (tile + dot); starts on what the slot shows. */
  const [sel, setSel] = useState<string>(equipped);
  const selEntry = entryOf(sel) ?? entryOf(equipped)!;
  const selIndex = Math.max(
    0,
    shelf.findIndex((it) => it.item === selEntry.item),
  );
  const pages = Math.max(1, Math.ceil(shelf.length / SHOP_PAGE));
  const [page, setPage] = useState(() => Math.floor(selIndex / SHOP_PAGE));
  const [confirm, setConfirm] = useState(false);
  const [delivery, setDelivery] = useState<'drop' | 'closed' | 'open' | null>(
    arrived.length > 0 ? 'drop' : null,
  );
  const [caption, setCaption] = useState('');
  const speaking = useRef(0);
  const openedAt = useRef(0);
  /** A tap anywhere during the delivery: a closed box opens; an open one gives way to the shelf. */
  const tapDelivery = () =>
    setDelivery((p) => {
      if (p === 'closed') return 'open';
      if (p === 'open' && performance.now() - openedAt.current >= OPEN_TAP_GUARD_MS) return null;
      return p;
    });

  /**
   * Pip's line with its caption. The caption stays at least CAPTION_MIN_MS even when speech ends
   * sooner (or is missing), so the child can read it (SPEC §5.4, D168).
   */
  const speak = (key: PhraseKey) => {
    const my = ++speaking.current;
    setCaption(phrase(key));
    const shown = new Promise<void>((r) => window.setTimeout(r, CAPTION_MIN_MS));
    void Promise.all([say(phraseLine(key), 'pip', { pitch: PIP_PITCH, interrupt: true }), shown]).then(
      () => {
        if (speaking.current === my) setCaption('');
      },
    );
  };

  // The café shows the selected entry; leaving the shop drops the preview (App).
  useEffect(() => {
    onPreview(slot, sel === equipped ? null : sel);
  }, [slot, sel, equipped, onPreview]);

  // The delivery moment (D164, D181): drop, wait for a tap or 2 s, open, hold 8 s or until a tap,
  // then the shelf.
  useEffect(() => {
    if (delivery === 'drop') {
      const t = window.setTimeout(() => {
        setDelivery('closed');
        speak('shop.delivery');
      }, reducedMotion() ? 0 : DROP_MS);
      return () => window.clearTimeout(t);
    }
    if (delivery === 'closed') {
      const t = window.setTimeout(() => setDelivery('open'), AUTO_OPEN_MS);
      return () => window.clearTimeout(t);
    }
    if (delivery === 'open') {
      openedAt.current = performance.now();
      const t = window.setTimeout(() => setDelivery(null), OPEN_HOLD_MS);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [delivery]);

  const pickSlot = (s: DecorSlot) => {
    speak(`shop.slot.${s}` as PhraseKey);
    if (s === slot) return;
    const on = equippedKey(derived, s);
    const items = slotShelf(derived, s);
    setSlot(s);
    setSel(on);
    setConfirm(false);
    setPage(Math.floor(Math.max(0, items.findIndex((it) => entryOf(on)?.item === it.item)) / SHOP_PAGE));
  };

  /** Tapping an owned entry puts it on at once (free, SPEC §10); a new one is only tried on. */
  const pick = (e: ShopEntry, item: ShelfItem) => {
    setSel(e.key);
    seeShopFresh(item.entries.map((x) => x.key));
    if (isOwned(derived, e.key)) loadedProgress()?.equip(slot, e.key);
  };

  const owned = isOwned(derived, selEntry.key);
  const short = canBuy(derived, selEntry.key) === 'short';
  const onBuy = () => {
    if (owned) return;
    if (short) {
      speak('shop.save');
      return;
    }
    setConfirm(true);
    speak('shop.buy');
  };
  const onYes = () => {
    setConfirm(false);
    if (loadedProgress()?.buy(selEntry.key)) speak('shop.yours');
  };

  const selItem = shelf[selIndex];
  const freshSlots = new Set(
    fresh.map((k) => entryOf(k)?.slot).filter((s): s is DecorSlot => s !== undefined),
  );
  const from = page * SHOP_PAGE;

  return (
    <div className="screen shop" data-testid="screen-shop" data-slot={slot}>
      {DECOR_SLOTS.map((s, i) => (
        <SlotTab
          key={s}
          rect={SHOP.tab(i)}
          slot={s}
          active={s === slot}
          fresh={freshSlots.has(s)}
          onTap={() => pickSlot(s)}
        />
      ))}
      <CoinJar rect={COUNTER.bar.jar} count={coins} testId="coin-jar" />
      <TapButton
        className="shop-home"
        style={at(SHOP.home)}
        testId="shop-home"
        label="Home"
        tapKind="button"
        onTap={onHome}
      >
        <svg viewBox="0 0 72 72" width="70%" height="70%" aria-hidden="true">
          <path d="M10 36 L36 12 L62 36 V62 H44 V44 H28 V62 H10 Z" fill="#6b4a2e" />
        </svg>
      </TapButton>
      <div className="pip-well" style={at({ ...COUNTER.scene.pip, h: COUNTER_Y + 4 - COUNTER.scene.pip.y })}>
        <div style={{ width: COUNTER.scene.pip.w, height: COUNTER.scene.pip.h }}>
          <Pip />
        </div>
      </div>

      {shelf.slice(from, from + SHOP_PAGE).map((it, j) => {
        const i = from + j;
        const isSel = i === selIndex;
        const e = isSel ? selEntry : shownEntry(derived, it, equipped);
        const state: TileState =
          it.entries.some((x) => x.key === equipped) && (!isSel || e.key === equipped)
            ? 'equipped'
            : isOwned(derived, e.key)
              ? 'owned'
              : 'forSale';
        return (
          <ItemTile
            key={it.item}
            rect={SHOP.tile(j)}
            look={isNone(e) ? null : lookFor(e)}
            item={it.item}
            name={it.name}
            state={state}
            price={e.price}
            selected={isSel}
            fresh={it.entries.some((x) => fresh.includes(x.key))}
            onTap={() => pick(isSel ? e : shownEntry(derived, it, equipped), it)}
          />
        );
      })}
      {pages > 1 && (
        <>
          <PageArrow
            rect={SHOP.back}
            dir="back"
            off={page === 0}
            onTap={() => setPage((p) => Math.max(0, p - 1))}
          />
          <PageArrow
            rect={SHOP.next}
            dir="next"
            off={page === pages - 1}
            onTap={() => setPage((p) => Math.min(pages - 1, p + 1))}
          />
          <PagePips rect={SHOP.pips} n={pages} at={page} />
        </>
      )}
      {selItem && selItem.entries.length > 1 && (
        <ColourDots
          rect={SHOP.dots}
          dots={selItem.entries.map((e) => ({
            key: e.key,
            colour: swatchOf(e),
            owned: isOwned(derived, e.key),
            selected: e.key === selEntry.key,
          }))}
          onTap={(k) => {
            const e = entryOf(k);
            if (e) pick(e, selItem);
          }}
        />
      )}
      {!owned && (
        <TapButton
          className={`btn btn-primary shop-buy${short ? ' short' : ''}`}
          style={at(SHOP.buy)}
          testId="shop-buy"
          tapKind="button"
          onTap={onBuy}
        >
          Buy <Price n={selEntry.price} />
        </TapButton>
      )}

      {!delivery && <Caption rect={COUNTER.scene.caption} text={caption} speaker="pip" />}

      {confirm && (
        <div className="shop-confirm-layer" data-testid="shop-confirm" role="dialog" aria-modal="true">
          <TapButton
            className="shop-dim"
            testId="shop-delivery-dim"
            label={delivery === 'open' ? 'Back to the shop' : 'Open the box'}
            tapKind="button"
            onTap={tapDelivery}
          >
            {null}
          </TapButton>
          <div className="shop-confirm" style={at(SHOP.confirm)}>
            <div className="shop-confirm-pic">
              <MiniStandIn look={lookFor(selEntry)} />
            </div>
            <div className="shop-confirm-title">
              Buy {selEntry.name}? <Price n={selEntry.price} />
            </div>
          </div>
          <TapButton
            className="btn btn-primary shop-yes"
            style={at(SHOP.yes)}
            testId="shop-yes"
            tapKind="button"
            onTap={onYes}
          >
            Yes!
          </TapButton>
          <TapButton
            className="btn btn-secondary shop-not-yet"
            style={at(SHOP.notYet)}
            testId="shop-not-yet"
            tapKind="button"
            onTap={() => setConfirm(false)}
          >
            Not yet
          </TapButton>
        </div>
      )}

      {delivery && (
        <div className="shop-delivery" data-testid="shop-delivery" data-phase={delivery}>
          <TapButton
            className="shop-dim"
            testId="shop-delivery-dim"
            label={delivery === 'open' ? 'Back to the shop' : 'Open the box'}
            tapKind="button"
            onTap={tapDelivery}
          >
            {null}
          </TapButton>
          {delivery === 'open' &&
            arrived.map((k, i) => {
              const e = entryOf(k)!;
              const r = SHOP.crate;
              return (
                <div
                  key={k}
                  className="shop-delivery-item"
                  style={{
                    ...at({ x: r.x + 36 + i * 128, y: r.y - 10, w: 100, h: 80 }),
                    animationDelay: `${500 + i * RISE_STAGGER_MS}ms`,
                  }}
                >
                  {isNone(e) ? null : <MiniStandIn look={lookFor(e)} />}
                </div>
              );
            })}
          <TapButton
            className={`shop-crate${delivery === 'drop' ? ' dropping' : ''}`}
            style={at(SHOP.crate)}
            testId="shop-crate"
            label="Open the box"
            tapKind="button"
            onTap={tapDelivery}
          >
            <DeliveryBox phase={delivery === 'open' ? 'open' : 'closed'} />
          </TapButton>
          {/* Above the dim, so Pip's line reads during the delivery. */}
          <Caption rect={COUNTER.scene.caption} text={caption} speaker="pip" />
        </div>
      )}
    </div>
  );
}

function reducedMotion(): boolean {
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
