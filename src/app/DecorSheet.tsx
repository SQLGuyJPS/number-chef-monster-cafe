// `?decor` (D156): the shop's contact sheet. Every M4 entry in place in the café, slot by slot and
// colorway by colorway, each with the rest of the café on its defaults, so an art batch is judged
// side by side (M4b). `&slot=floor` shows one slot; `&key=floor.tiles.mint` shows one entry at the
// size the child sees it, on the stage; `&zoom` crops each card to the small slots (counter-top,
// wall art, window) so their detail can be judged. A look-only page like `?gallery`: nothing here
// writes.
import { useState } from 'react';
import { CounterScene } from '../art/CounterScene';
import { STREET_MOCKS } from '../art/decor/StreetMocks';
import type { DecorSlot, ShopEntry } from '../engine/economy';
import { CATALOG, DECOR_SLOTS, entryOf } from '../engine/shop';
import { lookFor } from './decorLook';
import { DECOR, STAGE_H, STAGE_W, type Rect } from './metrics';
import { Stage } from './Stage';

const SLOT_NAMES: Record<DecorSlot, string> = {
  wallpaper: 'Wallpaper',
  floor: 'Floor',
  lights: 'Lights',
  window: 'Window',
  counter: 'Counter top',
  wallArt: 'Wall art',
  staff: 'Staff & pets',
};

const label = (e: ShopEntry): string =>
  `${e.name}${e.colorway === 'classic' ? '' : ` · ${e.colorway}`} · ${e.price === 0 ? 'free' : e.price}`;

/** `&zoom`: the café around a small slot; slots that fill the room keep the whole stage. */
function zoomRegion(slot: DecorSlot): Rect {
  const r = slot === 'counter' ? DECOR.counter : slot === 'wallArt' ? DECOR.wallArt : slot === 'window' ? DECOR.window : null;
  if (!r) return { x: 0, y: 0, w: STAGE_W, h: STAGE_H };
  const pad = 24;
  const x = Math.max(0, r.x - pad);
  return { x, y: r.y - pad, w: Math.min(STAGE_W, r.x + r.w + pad) - x, h: r.h + 2 * pad };
}

/** The café with only this entry changed; a free default draws the café as it is. */
function Cafe({ e }: { e: ShopEntry }) {
  return <CounterScene decor={e.price > 0 ? { [e.slot]: lookFor(e) } : {}} />;
}

/** `&mocks`: the Street window redesign mocks beside today's Street, for the owner to pick. */
function StreetMockCards({ cardW, region, scale }: { cardW: number; region: Rect; scale: number }) {
  const cards = [{ item: 'street', name: 'Today · Street' }, ...STREET_MOCKS];
  return (
    <>
      {cards.map((m) => (
        <a key={m.item} className="decor-card" href={`?mock&window=${m.item}`} data-entry={m.item}>
          <div className="decor-frame" style={{ width: cardW, height: Math.round(region.h * scale) }}>
            <div style={{ transform: `scale(${scale}) translate(${-region.x}px, ${-region.y}px)`, transformOrigin: '0 0' }}>
              <CounterScene
                decor={m.item === 'street' ? {} : { window: { slot: 'window', item: m.item, name: m.name, base: '', accent: '' } }}
              />
            </div>
          </div>
          <div className="decor-label">{m.name}</div>
        </a>
      ))}
    </>
  );
}

export function DecorSheet() {
  const q = new URLSearchParams(location.search);
  const mocks = q.has('mocks');
  const one = entryOf(q.get('key') ?? '');
  const only = q.get('slot');
  const zoom = q.has('zoom');
  const [cols] = useState(() => (window.innerWidth >= 1000 ? 3 : 2));
  if (one) {
    return (
      <Stage allowRotate={false} background={<div className="cafe-backdrop counter-backdrop" />}>
        <div className="decor-one" data-testid="decor-one">
          <Cafe e={one} />
          <div className="decor-one-label">{label(one)}</div>
        </div>
      </Stage>
    );
  }
  const slots = DECOR_SLOTS.filter((s) => !only || s === only);
  const gap = 12;
  const cardW = Math.floor((window.innerWidth - 32 - gap * (cols - 1)) / cols);
  return (
    <div className="decor-sheet" data-testid="decor-sheet">
      {slots.map((slot) => {
        const entries = CATALOG.filter((e) => e.slot === slot);
        const region = zoom ? zoomRegion(slot) : { x: 0, y: 0, w: STAGE_W, h: STAGE_H };
        const scale = cardW / region.w;
        return (
          <section key={slot} data-testid={`decor-slot-${slot}`}>
            <h2>
              {mocks && slot === 'window' ? 'Street mocks' : SLOT_NAMES[slot]}{' '}
              <small>({mocks && slot === 'window' ? STREET_MOCKS.length + 1 : entries.length})</small>
            </h2>
            <div className="decor-grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap }}>
              {mocks && slot === 'window' ? <StreetMockCards cardW={cardW} region={region} scale={scale} /> : null}
              {!(mocks && slot === 'window') && entries.map((e) => (
                <a key={e.key} className="decor-card" href={`?decor&key=${e.key}`} data-entry={e.key}>
                  <div className="decor-frame" style={{ width: cardW, height: Math.round(region.h * scale) }}>
                    <div
                      style={{
                        transform: `scale(${scale}) translate(${-region.x}px, ${-region.y}px)`,
                        transformOrigin: '0 0',
                      }}
                    >
                      <Cafe e={e} />
                    </div>
                  </div>
                  <div className="decor-label">{label(e)}</div>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
