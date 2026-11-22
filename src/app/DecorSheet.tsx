// `?decor` (D156): the shop's contact sheet. Every M4 entry in place in the café, slot by slot and
// colorway by colorway, each with the rest of the café on its defaults, so an art batch is judged
// side by side (M4b). `&slot=floor` shows one slot; `&key=floor.tiles.mint` shows one entry at the
// size the child sees it, on the stage. A look-only page like `?gallery`: nothing here writes.
import { useState } from 'react';
import { CounterScene } from '../art/CounterScene';
import type { DecorSlot, ShopEntry } from '../engine/economy';
import { CATALOG, DECOR_SLOTS, entryOf } from '../engine/shop';
import { lookFor } from './decorLook';
import { STAGE_H, STAGE_W } from './metrics';
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

/** The café with only this entry changed; a free default draws the café as it is. */
function Cafe({ e }: { e: ShopEntry }) {
  return <CounterScene decor={e.price > 0 ? { [e.slot]: lookFor(e) } : {}} />;
}

export function DecorSheet() {
  const q = new URLSearchParams(location.search);
  const one = entryOf(q.get('key') ?? '');
  const only = q.get('slot');
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
  const scale = cardW / STAGE_W;
  return (
    <div className="decor-sheet" data-testid="decor-sheet">
      {slots.map((slot) => {
        const entries = CATALOG.filter((e) => e.slot === slot);
        return (
          <section key={slot} data-testid={`decor-slot-${slot}`}>
            <h2>
              {SLOT_NAMES[slot]} <small>({entries.length})</small>
            </h2>
            <div className="decor-grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cardW}px)`, gap }}>
              {entries.map((e) => (
                <a key={e.key} className="decor-card" href={`?decor&key=${e.key}`} data-entry={e.key}>
                  <div className="decor-frame" style={{ width: cardW, height: Math.round(STAGE_H * scale) }}>
                    <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>
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
